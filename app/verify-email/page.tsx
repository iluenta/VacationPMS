"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Mail, CheckCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function VerifyEmailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!user) {
      router.push("/login")
      return
    }

    // If user email is already confirmed, redirect to dashboard
    if (user.email_confirmed_at) {
      router.push("/dashboard")
      return
    }
  }, [user, router])

  const handleResendEmail = async () => {
    if (!user?.email) return

    setIsResending(true)
    setError(null)
    setResendSuccess(false)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
        },
      })

      if (error) throw error

      setResendSuccess(true)
    } catch (error) {
      console.error("Error resending email:", error)
      setError(error instanceof Error ? error.message : "Error al reenviar el email")
    } finally {
      setIsResending(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">VacationPMS</span>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-orange-100 p-3">
                  <Mail className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Verifica tu email</CardTitle>
              <CardDescription>
                Hemos enviado un enlace de verificación a tu dirección de email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Email enviado a:
                </p>
                <p className="font-medium">{user.email}</p>
              </div>

              {resendSuccess && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Email de verificación reenviado correctamente. Revisa tu bandeja de entrada.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Button 
                  onClick={handleResendEmail} 
                  disabled={isResending}
                  className="w-full"
                  variant="outline"
                >
                  {isResending ? "Reenviando..." : "Reenviar email de verificación"}
                </Button>

                <Button 
                  onClick={handleSignOut}
                  variant="ghost"
                  className="w-full"
                >
                  Cerrar sesión
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  ¿No recibiste el email? Revisa tu carpeta de spam o{" "}
                  <button
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="text-primary hover:underline"
                  >
                    reenvíalo
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Una vez que verifiques tu email, podrás acceder a todas las funcionalidades del sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
