"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MobileSidebar } from "./sidebar"
import { ChevronDown, User, Settings, LogOut } from "lucide-react"

interface HeaderProps {
  user?: any
  profile?: any
  selectedTenant?: any
  availableTenants?: any[]
  onSignOut?: () => void
  onTenantChange?: (tenantId: string) => void
}

export function Header({ 
  user, 
  profile, 
  selectedTenant, 
  availableTenants = [], 
  onSignOut, 
  onTenantChange 
}: HeaderProps) {
  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Mobile menu */}
        <div className="flex items-center gap-4">
          <MobileSidebar 
            user={user}
            profile={profile}
            selectedTenant={selectedTenant}
            onSignOut={onSignOut}
            onTenantChange={onTenantChange}
          />
          
          {/* Tenant selector */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div 
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: 'hsl(var(--primary))' }}
              />
              <span className="text-sm font-medium text-gray-900">
                {selectedTenant?.name || "Sin organización"}
              </span>
            </div>
            {availableTenants.length > 1 && (
              <Select 
                value={selectedTenant?.id} 
                onValueChange={onTenantChange}
              >
                <SelectTrigger className="w-auto border-0 shadow-none h-auto p-0">
                  <ChevronDown className="h-4 w-4" />
                </SelectTrigger>
                <SelectContent>
                  {availableTenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* User menu */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                  <AvatarFallback 
                    className="text-white text-xs"
                    style={{ backgroundColor: 'hsl(var(--primary))' }}
                  >
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.full_name || "Usuario"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="flex items-center cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
