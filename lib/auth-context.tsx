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
  loading: boolean
  isEmailConfirmed: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  // Computed property for email confirmation status
  const isEmailConfirmed = user?.email_confirmed_at !== null

  const fetchProfile = async (userId: string) => {
    console.log("[AuthContext] Fetching profile for user:", userId)
    const supabase = createClient()

    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (profileError) {
      console.error("[AuthContext] Error fetching profile:", profileError)
      return
    }

    console.log("[AuthContext] Profile data:", profileData)

    if (profileData) {
      setProfile(profileData)

      // Fetch tenant if user has one
      if (profileData.tenant_id) {
        console.log("[AuthContext] Fetching tenant:", profileData.tenant_id)
        const { data: tenantData, error: tenantError } = await supabase.from("tenants").select("*").eq("id", profileData.tenant_id).single()

        if (tenantError) {
          console.error("[AuthContext] Error fetching tenant:", tenantError)
        } else {
          console.log("[AuthContext] Tenant data:", tenantData)
          if (tenantData) {
            setTenant(tenantData)
          }
        }
      }
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    console.log("[AuthContext] Initializing auth context")
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("[AuthContext] Initial session:", session)
      if (error) {
        console.error("[AuthContext] Session error:", error)
      }
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setTenant(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setTenant(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, tenant, loading, isEmailConfirmed, signOut, refreshProfile }}>
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
