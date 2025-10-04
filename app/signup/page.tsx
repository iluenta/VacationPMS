"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface Tenant {
  id: string
  name: string
  slug: string
}

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [tenantId, setTenantId] = useState("")
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Fetch available tenants
    const fetchTenants = async () => {
      try {
        const supabase = createClient()
        console.log("[v0] Fetching tenants...")
        
        const { data, error } = await supabase.from("tenants").select("*").order("name")

        if (error) {
          console.error("[v0] Error fetching tenants:", error)
          console.error("[v0] Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          setError(
            `Error al cargar organizaciones: ${error.message}. Verifica que los scripts de base de datos se hayan ejecutado correctamente.`,
          )
        } else if (data && data.length > 0) {
          console.log("[v0] Tenants loaded:", data)
          setTenants(data)
          setError(null) // Clear any previous errors
        } else {
          console.log("[v0] No tenants found")
          setError("No hay organizaciones disponibles. Por favor, ejecuta los scripts de base de datos.")
        }
      } catch (err) {
        console.error("[v0] Unexpected error fetching tenants:", err)
        setError("Error inesperado al cargar las organizaciones. Verifica la conexión con la base de datos.")
      }
    }
    fetchTenants()
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (!tenantId) {
      setError("Por favor selecciona una organización")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            tenant_id: tenantId,
            is_admin: false,
          },
        },
      })
      if (error) throw error
      router.push("/signup-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al crear la cuenta")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    const supabase = createClient()
    setIsGoogleLoading(true)
    setError(null)

    if (!tenantId) {
      setError("Por favor selecciona una organización antes de continuar con Google")
      setIsGoogleLoading(false)
      return
    }

    try {
      console.log("[v0] Starting Google OAuth with tenant:", tenantId)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            tenant_id: tenantId,
          },
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      console.error("[v0] Google OAuth error:", error)
      setError(error instanceof Error ? error.message : "Error al registrarse con Google")
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
        <div className="flex items-center gap-2 text-primary-foreground">
          <Building2 className="h-8 w-8" />
          <span className="text-2xl font-bold">VacationPMS</span>
        </div>
        <div className="space-y-6 text-primary-foreground">
          <h1 className="text-4xl font-bold leading-tight">Comienza a gestionar tus propiedades hoy</h1>
          <p className="text-lg opacity-90">
            Únete a miles de propietarios que ya optimizan su negocio con VacationPMS.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/70">
          &copy; 2025 VacationPMS. Todos los derechos reservados.
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center justify-center gap-2 mb-4">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">VacationPMS</span>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Crear cuenta</CardTitle>
                <CardDescription>Completa el formulario para comenzar</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup}>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="fullName">Nombre completo</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Juan Pérez"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isLoading || isGoogleLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading || isGoogleLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tenant">Organización</Label>
                      <Select value={tenantId} onValueChange={setTenantId} disabled={isLoading || isGoogleLoading}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu organización" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading || isGoogleLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading || isGoogleLoading}
                      />
                    </div>
                    {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
                    <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                      {isLoading ? "Creando cuenta..." : "Crear cuenta"}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">O continuar con</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={handleGoogleSignup}
                      disabled={isLoading || isGoogleLoading}
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        aria-hidden="true"
                        focusable="false"
                        data-prefix="fab"
                        data-icon="google"
                        role="img"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 488 512"
                      >
                        <path
                          fill="currentColor"
                          d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                        ></path>
                      </svg>
                      {isGoogleLoading ? "Conectando..." : "Continuar con Google"}
                    </Button>
                  </div>
                  <div className="mt-6 text-center text-sm">
                    ¿Ya tienes una cuenta?{" "}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                      Inicia sesión
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="text-center text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                ← Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
