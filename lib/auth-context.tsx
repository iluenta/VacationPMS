"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState } from "react"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  tenant_id: string | null
  is_admin: boolean
  theme_color: string
}

interface Tenant {
  id: string
  name: string
  slug: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  tenant: Tenant | null
  selectedTenant: Tenant | null // Tenant seleccionado por el admin
  availableTenants: Tenant[] // Todos los tenants disponibles para admins
  loading: boolean
  isEmailConfirmed: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  setSelectedTenant: (tenant: Tenant | null) => void
  fetchAvailableTenants: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  // Computed property for email confirmation status
  const isEmailConfirmed = user?.email_confirmed_at !== null

  const fetchProfile = async (userId: string) => {
    const supabase = createClient()

    try {
      // Fetch user profile with better error handling
      const { data, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError) {
        console.error("[AuthContext] Error fetching profile:", profileError)
        console.error("[AuthContext] Error details:", {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        })
        
        // Si el usuario no existe en public.users, esto podría ser un problema de trigger
        if (profileError.code === 'PGRST116') {
          // No establecer el perfil, pero no fallar completamente
          return
        }
        return
      }

      // Validate that we have valid data
      if (!data || typeof data !== 'object') {
        console.error("[AuthContext] Invalid profile data received:", data)
        return
      }

      setProfile(data)

      // Fetch tenant if user has one
      if (data.tenant_id) {
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .select("*")
          .eq("id", data.tenant_id)
          .single()

        if (tenantError) {
          console.error("[AuthContext] Error fetching tenant:", tenantError)
        } else if (tenantData) {
          setTenant(tenantData)
        }
      }
    } catch (error) {
      console.error("[AuthContext] Unexpected error fetching profile:", error)
      // Don't throw, just log and continue
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const fetchAvailableTenants = async () => {
    const supabase = createClient()

    const { data: tenantsData, error: tenantsError } = await supabase
      .from("tenants")
      .select("*")
      .order("name")

    if (tenantsError) {
      console.error("[AuthContext] Error fetching tenants:", tenantsError)
      return
    }

    setAvailableTenants(tenantsData || [])

    // Si es admin y no hay tenant seleccionado, seleccionar el primero que tenga personas
    if (profile?.is_admin && !selectedTenant && tenantsData && tenantsData.length > 0) {
      // Priorizar tenants con datos: veratespera, Demo Tenant, Atalanta
      const tenantWithData = tenantsData.find(t => 
        t.id === '00000001-0000-4000-8000-000000000000' || // veratespera (2 personas)
        t.id === '00000000-0000-0000-0000-000000000001' || // Demo Tenant (2 personas)
        t.id === '00000002-0000-4000-8000-000000000000'    // Atalanta (1 persona)
      ) || tenantsData[0] // Fallback al primero si no hay ninguno con datos
      
      setSelectedTenant(tenantWithData)
    }
  }

  useEffect(() => {
    const supabase = createClient()

    // Get initial session with better error handling
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("[AuthContext] Session error:", error)
        setLoading(false)
        return
      }
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).catch((err) => {
          console.error("[AuthContext] Error fetching initial profile:", err)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    }).catch((err) => {
      console.error("[AuthContext] Unexpected error getting session:", err)
      setLoading(false)
    })

    // Listen for auth changes with better error handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      try {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id).catch((err) => {
            console.error("[AuthContext] Error fetching profile on auth change:", err)
          })
        } else {
          setProfile(null)
          setTenant(null)
          setSelectedTenant(null)
          setAvailableTenants([])
        }
        setLoading(false)
      } catch (err) {
        console.error("[AuthContext] Error in auth state change:", err)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Cargar tenants disponibles cuando el perfil cambie y el usuario sea admin
  useEffect(() => {
    if (profile?.is_admin) {
      fetchAvailableTenants()
    }
  }, [profile?.is_admin])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setTenant(null)
    setSelectedTenant(null)
    setAvailableTenants([])
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      tenant, 
      selectedTenant,
      availableTenants,
      loading, 
      isEmailConfirmed, 
      signOut, 
      refreshProfile,
      setSelectedTenant,
      fetchAvailableTenants
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
