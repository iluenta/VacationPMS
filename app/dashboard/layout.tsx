"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useMemoizedTenant } from "@/lib/hooks/use-memoized-tenant"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ThemeManager } from "@/components/theme-manager"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, selectedTenant, availableTenants, loading, signOut, setSelectedTenant } = useAuth()
  const { currentTenant, isAdmin } = useMemoizedTenant()
  const router = useRouter()


  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading]) // Removed router from dependencies

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const handleTenantChange = (tenantId: string) => {
    const tenant = availableTenants.find(t => t.id === tenantId)
    if (tenant) {
      setSelectedTenant(tenant)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ThemeManager />
      
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <Sidebar 
          user={user}
          profile={profile}
          selectedTenant={currentTenant}
          onSignOut={handleSignOut}
          onTenantChange={handleTenantChange}
        />
      </div>

      {/* Main Content */}
      <div className="md:pl-64">
        <Header 
          user={user}
          profile={profile}
          selectedTenant={currentTenant}
          availableTenants={availableTenants}
          onSignOut={handleSignOut}
          onTenantChange={handleTenantChange}
        />
        
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}