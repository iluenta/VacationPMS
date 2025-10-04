"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Calendar, Users, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const { profile, tenant, loading, user } = useAuth()

  // Debug logs
  console.log("[Dashboard] Loading:", loading)
  console.log("[Dashboard] User:", user)
  console.log("[Dashboard] Profile:", profile)
  console.log("[Dashboard] Tenant:", tenant)

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error de autenticación</h1>
          <p className="text-muted-foreground">No se pudo cargar la información del usuario.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bienvenido, {profile?.full_name || "Usuario"}</h1>
          <p className="text-muted-foreground">{tenant ? `Gestionando ${tenant.name}` : "Panel de administración"}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Sin propiedades registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservas Activas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Sin reservas activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Huéspedes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Sin huéspedes registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">Sin ingresos registrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Comienza a usar VacationPMS</CardTitle>
            <CardDescription>Configura tu cuenta y añade tus primeras propiedades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">1. Añade propiedades</h3>
                <p className="text-sm text-muted-foreground">Registra tus alquileres vacacionales en el sistema</p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">2. Configura calendarios</h3>
                <p className="text-sm text-muted-foreground">Sincroniza con tus plataformas de reserva</p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">3. Gestiona reservas</h3>
                <p className="text-sm text-muted-foreground">Administra check-ins, check-outs y comunicación</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
