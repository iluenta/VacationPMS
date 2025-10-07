import { NextRequest, NextResponse } from "next/server"
import { SessionManager } from "@/lib/auth/session-manager"
import { verifyJWTFromRequest } from "@/lib/auth/jwt-manager"
import { securityLogger, getClientInfo } from "@/lib/logging/edge-logger"

// ============================================================================
// GET /api/auth/sessions - Obtener sesiones del usuario
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const jwtPayload = await verifyJWTFromRequest(request)
    if (!jwtPayload) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const clientInfo = getClientInfo(request)

    // Obtener sesiones del usuario
    const sessions = await SessionManager.getUserSessions(jwtPayload.userId, jwtPayload.sessionId)
    const stats = await SessionManager.getSessionStats(jwtPayload.userId, jwtPayload.sessionId)
    const suspiciousSessions = await SessionManager.detectSuspiciousSessions(jwtPayload.userId, jwtPayload.sessionId)

    // Logear acceso a sesiones
    securityLogger.authAttempt({
      userId: jwtPayload.userId,
      email: jwtPayload.email,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      success: true,
      reason: 'Sessions accessed'
    })

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        stats,
        suspiciousSessions,
        count: sessions.length
      }
    })

  } catch (error) {
    console.error('[API] Error getting sessions:', error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      message: "Error al obtener sesiones"
    }, { status: 500 })
  }
}

// ============================================================================
// DELETE /api/auth/sessions - Revocar sesión específica
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const jwtPayload = await verifyJWTFromRequest(request)
    if (!jwtPayload) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json({ 
        error: "Session ID requerido",
        message: "Debes especificar qué sesión revocar"
      }, { status: 400 })
    }

    const clientInfo = getClientInfo(request)

    // Revocar sesión
    const success = await SessionManager.revokeSession(sessionId, jwtPayload.userId, jwtPayload.userId)

    if (!success) {
      return NextResponse.json({
        error: "Error al revocar sesión",
        message: "No se pudo revocar la sesión especificada"
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Sesión revocada exitosamente"
    })

  } catch (error) {
    console.error('[API] Error revoking session:', error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      message: "Error al revocar sesión"
    }, { status: 500 })
  }
}
