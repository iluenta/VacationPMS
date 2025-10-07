import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAlertSystem } from "@/lib/logging/alerts"
import { appLogger } from "@/lib/logging/logger"

// ============================================================================
// GET /api/admin/security-alerts - Obtener alertas de seguridad
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el usuario sea admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 })
    }

    if (!profile.is_admin) {
      return NextResponse.json({ error: "Acceso denegado - se requieren permisos de administrador" }, { status: 403 })
    }

    const alertSystem = getAlertSystem()
    const url = new URL(request.url)
    const severity = url.searchParams.get('severity')
    const resolved = url.searchParams.get('resolved')

    let alerts

    if (severity) {
      alerts = alertSystem.getAlertsBySeverity(severity as any)
    } else {
      alerts = alertSystem.getActiveAlerts()
    }

    if (resolved === 'true') {
      alerts = alerts.filter(alert => alert.resolved)
    } else if (resolved === 'false') {
      alerts = alerts.filter(alert => !alert.resolved)
    }

    // Logear acceso a alertas
    appLogger.info('Security alerts accessed', {
      userId: user.id,
      filters: { severity, resolved },
      resultsCount: alerts.length
    })

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    appLogger.error('Error getting security alerts', { error: error.message })
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// ============================================================================
// POST /api/admin/security-alerts - Resolver alerta
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el usuario sea admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 })
    }

    if (!profile.is_admin) {
      return NextResponse.json({ error: "Acceso denegado - se requieren permisos de administrador" }, { status: 403 })
    }

    const body = await request.json()
    const { alertId } = body

    if (!alertId) {
      return NextResponse.json({ error: "alertId es requerido" }, { status: 400 })
    }

    const alertSystem = getAlertSystem()
    await alertSystem.resolveAlert(alertId, user.id)

    // Logear resolución de alerta
    appLogger.info('Security alert resolved', {
      alertId,
      resolvedBy: user.id,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: "Alerta resuelta exitosamente"
    })

  } catch (error) {
    appLogger.error('Error resolving security alert', { error: error.message })
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
