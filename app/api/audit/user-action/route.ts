import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { auditLogger } from "@/lib/logging/logger"
import { getClientInfo } from "@/lib/logging/edge-logger"
import { sanitizeForLogging } from "@/lib/logging/audit-middleware"

// ============================================================================
// POST /api/audit/user-action - Logear acción de usuario
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { action, details } = body

    if (!action) {
      return NextResponse.json({ error: "action es requerido" }, { status: 400 })
    }

    const clientInfo = getClientInfo(request)
    
    // Sanitizar detalles para logging
    const sanitizedDetails = sanitizeForLogging(details)

    // Logear acción de usuario
    auditLogger.resourceCreated({
      userId: user.id,
      resourceType: 'user_action',
      resourceId: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      details: {
        action,
        ...sanitizedDetails,
        userAgent: clientInfo.userAgent,
        ip: clientInfo.ip,
        referer: clientInfo.referer,
        timestamp: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      message: "Acción logueada exitosamente"
    })

  } catch (error) {
    console.error('Error logging user action:', error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
