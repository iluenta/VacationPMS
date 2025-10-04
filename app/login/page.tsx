"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Building2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      // Check if email is confirmed
      if (data.user && !data.user.email_confirmed_at) {
        // User is authenticated but email not confirmed
        router.push("/verify-email")
      } else {
        // User is authenticated and email is confirmed
        router.push("/dashboard")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    setIsGoogleLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting Google OAuth login")
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      console.error("[v0] Google OAuth error:", error)
      setError(error instanceof Error ? error.message : "Error al iniciar sesión con Google")
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
          <h1 className="text-4xl font-bold leading-tight">
            Gestiona tus alquileres vacacionales con eficiencia total
          </h1>
          <p className="text-lg opacity-90">
            Sistema completo de gestión de propiedades, reservas y comunicación con huéspedes.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/70">
          &copy; 2025 VacationPMS. Todos los derechos reservados.
        </div>
      </div>

      {/* Right side - Login Form */}
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
                <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
                <CardDescription>Accede a tu cuenta para gestionar tus propiedades</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailLogin}>
                  <div className="flex flex-col gap-6">
                    {/* Email/Password Login */}
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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Contraseña</Label>
                        <a href="#" className="text-sm text-primary hover:underline">
                          ¿Olvidaste tu contraseña?
                        </a>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading || isGoogleLoading}
                      />
                    </div>
                    {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
                    <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                      {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                    </Button>

                    {/* Separator */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">O continuar con</span>
                      </div>
                    </div>

                    {/* Google OAuth */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={handleGoogleLogin}
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
                    ¿No tienes una cuenta?{" "}
                    <Link href="/signup" className="font-medium text-primary hover:underline">
                      Regístrate
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
