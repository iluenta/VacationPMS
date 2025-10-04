"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Building2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error =
    searchParams.get("error_description") ||
    searchParams.get("error") ||
    searchParams.get("message") ||
    "Ha ocurrido un error durante la autenticación"
  
  const errorCode = searchParams.get("error_code")
  const errorHint = searchParams.get("error_hint")

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
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertCircle className="h-5 w-5" />
                <CardTitle className="text-2xl">Error de autenticación</CardTitle>
              </div>
              <CardDescription>No se pudo completar el proceso de inicio de sesión</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                  <div className="font-medium mb-2">Error:</div>
                  <div>{error}</div>
                  {errorCode && (
                    <div className="mt-2 text-xs opacity-75">
                      Código: {errorCode}
                    </div>
                  )}
                  {errorHint && (
                    <div className="mt-1 text-xs opacity-75">
                      Sugerencia: {errorHint}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button asChild className="w-full">
                    <Link href="/login">Volver a intentar</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/">Ir al inicio</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
