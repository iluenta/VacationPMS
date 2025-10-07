import { NextRequest, NextResponse } from "next/server"
import { PasswordPolicyManager } from "@/lib/auth/password-policies"
import { verifyJWTFromRequest } from "@/lib/auth/jwt-manager"
import { securityLogger, getClientInfo } from "@/lib/logging/edge-logger"

// ============================================================================
// POST /api/auth/password/change - Cambiar contraseña
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const jwtPayload = await verifyJWTFromRequest(request)
    if (!jwtPayload) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: "Datos requeridos",
        message: "Debes proporcionar la contraseña actual y la nueva contraseña"
      }, { status: 400 })
    }

    const clientInfo = getClientInfo(request)

    // Cambiar contraseña
    const result = await PasswordPolicyManager.changePassword(
      jwtPayload.userId,
      currentPassword,
      newPassword,
      {
        email: jwtPayload.email,
        name: jwtPayload.email.split('@')[0] // Usar parte del email como nombre
      }
    )

    if (!result.success) {
      // Logear intento fallido
      securityLogger.authAttempt({
        userId: jwtPayload.userId,
        email: jwtPayload.email,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        success: false,
        reason: `Password change failed: ${result.errors.join(', ')}`
      })

      return NextResponse.json({
        error: "Error al cambiar contraseña",
        message: result.errors.join(', ')
      }, { status: 400 })
    }

    // Logear cambio exitoso
    securityLogger.authAttempt({
      userId: jwtPayload.userId,
      email: jwtPayload.email,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      success: true,
      reason: 'Password changed successfully'
    })

    return NextResponse.json({
      success: true,
      message: "Contraseña cambiada exitosamente"
    })

  } catch (error) {
    console.error('[API] Error changing password:', error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      message: "Error al cambiar contraseña"
    }, { status: 500 })
  }
}
