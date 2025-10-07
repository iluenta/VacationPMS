import { NextRequest, NextResponse } from "next/server"
import { SessionManager } from "@/lib/auth/session-manager"
import { verifyJWTFromRequest } from "@/lib/auth/jwt-manager"
import { securityLogger, getClientInfo } from "@/lib/logging/edge-logger"

// ============================================================================
// POST /api/auth/sessions/revoke-all - Revocar todas las otras sesiones
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const jwtPayload = await verifyJWTFromRequest(request)
    if (!jwtPayload) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const clientInfo = getClientInfo(request)

    // Revocar todas las otras sesiones
    const revokedCount = await SessionManager.revokeAllOtherSessions(jwtPayload.userId, jwtPayload.sessionId)

    return NextResponse.json({
      success: true,
      message: `${revokedCount} sesiones revocadas exitosamente`,
      data: {
        revokedCount
      }
    })

  } catch (error) {
    console.error('[API] Error revoking all sessions:', error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      message: "Error al revocar sesiones"
    }, { status: 500 })
  }
}
