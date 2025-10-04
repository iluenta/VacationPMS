import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Building2,
  Calendar,
  BarChartBig as ChartBar,
  CheckCircle,
  CreditCard,
  Globe,
  MessageSquare,
  Shield,
  Smartphone,
  Users,
  Zap,
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">VacationPMS</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Características
            </a>
            <a href="#benefits" className="text-sm font-medium hover:text-primary transition-colors">
              Beneficios
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Precios
            </a>
          </nav>
          <Link href="/login">
            <Button>Acceder al PMS</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center gap-8 py-20 md:py-32">
        <div className="flex max-w-4xl flex-col items-center gap-6 text-center">
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm">
            <Zap className="mr-2 h-4 w-4 text-yellow-500" />
            <span className="font-medium">Sistema de gestión todo en uno</span>
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Gestiona tus alquileres vacacionales con <span className="text-primary">eficiencia total</span>
          </h1>
          <p className="text-pretty max-w-2xl text-lg text-muted-foreground sm:text-xl">
            La plataforma completa para administrar propiedades, reservas, pagos y comunicación con huéspedes. Todo lo
            que necesitas en un solo lugar.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Comenzar ahora
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
              Ver demo
            </Button>
          </div>
        </div>

        {/* Hero Image Placeholder */}
        <div className="w-full max-w-5xl">
          <Card className="overflow-hidden border-2">
            <CardContent className="p-0">
              <img src="/property-management-dashboard.png" alt="Dashboard Preview" className="h-auto w-full" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t bg-muted/50 py-20">
        <div className="container">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Todo lo que necesitas para gestionar tu negocio
            </h2>
            <p className="text-pretty max-w-2xl text-lg text-muted-foreground">
              Herramientas profesionales diseñadas para maximizar tu eficiencia y rentabilidad
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Gestión de Reservas</h3>
                <p className="text-muted-foreground">
                  Calendario inteligente con sincronización automática de todas tus plataformas de reserva.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Multi-Propiedad</h3>
                <p className="text-muted-foreground">
                  Administra múltiples propiedades desde un único panel de control centralizado.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Pagos Automatizados</h3>
                <p className="text-muted-foreground">
                  Procesa pagos, depósitos y reembolsos de forma automática y segura.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Comunicación Unificada</h3>
                <p className="text-muted-foreground">
                  Centraliza todas las conversaciones con huéspedes en una bandeja de entrada.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <ChartBar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Reportes y Analytics</h3>
                <p className="text-muted-foreground">Métricas en tiempo real para tomar decisiones basadas en datos.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">App Móvil</h3>
                <p className="text-muted-foreground">
                  Gestiona tu negocio desde cualquier lugar con nuestra app móvil.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center gap-6">
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Ahorra tiempo y aumenta tus ingresos
              </h2>
              <p className="text-pretty text-lg text-muted-foreground">
                VacationPMS automatiza las tareas repetitivas para que puedas enfocarte en hacer crecer tu negocio.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">Automatización inteligente</p>
                    <p className="text-sm text-muted-foreground">Reduce el trabajo manual hasta en un 80%</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">Sincronización en tiempo real</p>
                    <p className="text-sm text-muted-foreground">Evita dobles reservas con actualización instantánea</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">Optimización de precios</p>
                    <p className="text-sm text-muted-foreground">Maximiza tus ingresos con precios dinámicos</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">Soporte 24/7</p>
                    <p className="text-sm text-muted-foreground">Equipo de expertos siempre disponible para ayudarte</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <Card className="overflow-hidden border-2">
                <CardContent className="p-0">
                  <img src="/analytics-dashboard.png" alt="Benefits Illustration" className="h-auto w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container">
          <div className="flex flex-col items-center gap-12 text-center">
            <div className="flex flex-col gap-4">
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Confianza y seguridad garantizadas
              </h2>
              <p className="text-pretty max-w-2xl text-lg text-muted-foreground">
                Miles de propietarios confían en VacationPMS para gestionar sus negocios
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">99.9%</h3>
                <p className="text-sm text-muted-foreground">Uptime garantizado</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">10,000+</h3>
                <p className="text-sm text-muted-foreground">Usuarios activos</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">50+</h3>
                <p className="text-sm text-muted-foreground">Países</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="border-2 bg-primary text-primary-foreground">
            <CardContent className="flex flex-col items-center gap-6 p-12 text-center">
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Comienza a gestionar tus propiedades hoy
              </h2>
              <p className="text-pretty max-w-2xl text-lg opacity-90">
                Únete a miles de propietarios que ya están optimizando su negocio con VacationPMS
              </p>
              <Link href="/login">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Acceder al sistema
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-bold">VacationPMS</span>
              </div>
              <p className="text-sm text-muted-foreground">
                La solución completa para gestión de alquileres vacacionales
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold">Producto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Características
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-foreground transition-colors">
                    Precios
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Integraciones
                  </a>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold">Empresa</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Sobre nosotros
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contacto
                  </a>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Términos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 VacationPMS. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
