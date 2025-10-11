"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  LogOut,
  Menu,
  ChevronRight,
  Home,
  FileText,
  BarChart3,
  CreditCard,
  Receipt
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  user?: any
  profile?: any
  selectedTenant?: any
  onSignOut?: () => void
  onTenantChange?: (tenantId: string) => void
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Personas",
    href: "/dashboard/persons",
    icon: Users,
  },
  {
    name: "Propiedades",
    href: "/dashboard/properties",
    icon: Building2,
  },
  {
    name: "Reservas",
    href: "/dashboard/reservations",
    icon: Calendar,
  },
  {
    name: "Calendario",
    href: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    name: "Canales de Distribución",
    href: "/dashboard/channels",
    icon: FileText,
  },
  {
    name: "Pagos de Reservas",
    href: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    name: "Gastos de Propiedades",
    href: "/dashboard/expenses",
    icon: Receipt,
  },
  {
    name: "Guías del Huésped",
    href: "/dashboard/guides",
    icon: FileText,
  },
  {
    name: "Reportes",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    name: "Configuración",
    href: "/dashboard/configurations",
    icon: Settings,
  },
]

export function Sidebar({ 
  className, 
  user, 
  profile, 
  selectedTenant, 
  onSignOut, 
  onTenantChange 
}: SidebarProps) {
  const pathname = usePathname()

  return (
    <div 
      className={cn("flex h-full w-64 flex-col text-white", className)}
      style={{ backgroundColor: 'hsl(var(--sidebar-primary))' }}
    >
      {/* Logo */}
      <div 
        className="flex h-16 items-center px-6 border-b"
        style={{ borderColor: 'hsl(var(--sidebar-primary) / 0.8)' }}
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          <span className="text-xl font-bold">TuriGest</span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive && "text-white"
                )}
                style={{
                  backgroundColor: isActive ? 'hsl(var(--sidebar-primary) / 0.8)' : 'transparent',
                  '--hover-bg': 'hsl(var(--sidebar-primary) / 0.5)'
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'hsl(var(--sidebar-primary) / 0.5)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
                {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div 
        className="border-t p-4"
        style={{ borderColor: 'hsl(var(--sidebar-primary) / 0.8)' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: 'hsl(var(--sidebar-primary))' }}
          >
            <span className="text-sm font-medium">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {profile?.full_name || "Usuario"}
            </p>
            <p 
              className="text-xs truncate"
              style={{ color: 'hsl(var(--sidebar-primary) / 0.7)' }}
            >
              {selectedTenant?.name || "Sin organización"}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          className="mt-3 w-full justify-start text-white"
          style={{
            '--hover-bg': 'hsl(var(--sidebar-primary) / 0.5)'
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'hsl(var(--sidebar-primary) / 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}

export function MobileSidebar({ 
  user, 
  profile, 
  selectedTenant, 
  onSignOut, 
  onTenantChange 
}: Omit<SidebarProps, 'className'>) {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <Sidebar 
          user={user}
          profile={profile}
          selectedTenant={selectedTenant}
          onSignOut={() => {
            onSignOut?.()
            setOpen(false)
          }}
          onTenantChange={onTenantChange}
        />
      </SheetContent>
    </Sheet>
  )
}
