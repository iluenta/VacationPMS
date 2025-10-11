"use client"

import { useAuth } from "@/lib/auth-context"
import { useCurrentTenant } from "@/lib/hooks/use-current-tenant"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, 
  Calendar, 
  Users, 
  TrendingUp, 
  DollarSign, 
  XCircle, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar as CalendarIcon,
  UserCheck,
  Home,
  Settings
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { profile, loading, user } = useAuth()
  const { currentTenant, isAdmin, hasTenant } = useCurrentTenant()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Error de autenticación</h1>
        <p className="text-gray-600">No se pudo cargar la información del usuario.</p>
      </div>
    )
  }

  // Datos de ejemplo para el dashboard
  const kpiData = {
    reservations: { confirmed: 12, cancelled: 2, total: 14 },
    guests: { unique: 18, total: 24 },
    revenue: { gross: 15420.50, commissions: 1233.64, expenses: 2100.00, net: 12086.86 },
    recentReservations: [
      { name: "Carol Gately", dates: "18/10/2025 – 22/10/2025", amount: "386,92 €" },
      { name: "Nosotros", dates: "15/10/2025 – 17/10/2025", amount: "0,00 €" },
      { name: "Encarnación Ayuso", dates: "12/10/2025 – 15/10/2025", amount: "283,52 €" },
      { name: "Miguel Martín Huertas", dates: "08/10/2025 – 12/10/2025", amount: "846,48 €" },
      { name: "David Vico Jimenez", dates: "05/10/2025 – 08/10/2025", amount: "949,08 €" }
    ]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen general de tu negocio</p>
      </div>

      {/* Year Filter */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50">
          Todos los años
        </Button>
        <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50">
          2027
        </Button>
        <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50">
          2026
        </Button>
        <Button 
          size="sm" 
          variant="default"
        >
          2025
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Reservas confirmadas */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reservas confirmadas</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.reservations.confirmed}</p>
                <p className="text-xs text-gray-500">reservas confirmadas</p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Huéspedes */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Huéspedes</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.guests.unique}</p>
                <p className="text-xs text-gray-500">huéspedes únicos</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Canceladas */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Canceladas</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.reservations.cancelled}</p>
                <p className="text-xs text-gray-500">reservas canceladas</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ingresos Brutos */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Brutos</p>
                <p className="text-2xl font-bold text-green-600">{kpiData.revenue.gross.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                <p className="text-xs text-gray-500">ingresos totales</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comisiones */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Comisiones</p>
                <p className="text-2xl font-bold text-red-600">-{kpiData.revenue.commissions.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                <p className="text-xs text-gray-500">comisiones (con IVA)</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <ArrowDownRight className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gastos */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gastos</p>
                <p className="text-2xl font-bold text-red-600">-{kpiData.revenue.expenses.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                <p className="text-xs text-gray-500">gastos operacionales (todos)</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <ArrowDownRight className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Beneficio Neto */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Beneficio Neto</p>
                <p className="text-2xl font-bold text-green-600">+{kpiData.revenue.net.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                <p className="text-xs text-gray-500">ingresos menos gastos y comisiones (con IVA)</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Las últimas 5 reservas realizadas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {kpiData.recentReservations.map((reservation, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <UserCheck className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{reservation.name}</p>
                      <p className="text-sm text-gray-600">{reservation.dates}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{reservation.amount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">Acciones Rápidas</CardTitle>
          <CardDescription className="text-gray-600">
            Gestiona tu negocio de forma eficiente
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/persons">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-gray-200 hover:bg-primary/10 hover:border-primary/20">
                <Users className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Gestionar Personas</span>
              </Button>
            </Link>
            <Link href="/dashboard/properties">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-gray-200 hover:bg-primary/10 hover:border-primary/20">
                <Home className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Propiedades</span>
              </Button>
            </Link>
            <Link href="/dashboard/reservations">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-gray-200 hover:bg-primary/10 hover:border-primary/20">
                <CalendarIcon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Reservas</span>
              </Button>
            </Link>
            <Link href="/dashboard/configurations">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-gray-200 hover:bg-primary/10 hover:border-primary/20">
                <Settings className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Configuración</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}