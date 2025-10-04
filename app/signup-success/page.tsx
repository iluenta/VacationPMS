import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Mail } from "lucide-react"
import Link from "next/link"

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">VacationPMS</span>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">¡Revisa tu correo!</CardTitle>
              <CardDescription>Te hemos enviado un enlace de confirmación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Hemos enviado un correo electrónico a tu dirección. Por favor, haz clic en el enlace de confirmación
                para activar tu cuenta y poder iniciar sesión.
              </p>
              <div className="rounded-md bg-muted p-4 text-sm">
                <p className="font-medium mb-2">¿No recibiste el correo?</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Revisa tu carpeta de spam</li>
                  <li>Verifica que la dirección sea correcta</li>
                  <li>Espera unos minutos e intenta de nuevo</li>
                </ul>
              </div>
              <Link href="/login" className="block">
                <Button className="w-full">Ir a iniciar sesión</Button>
              </Link>
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
  )
}
