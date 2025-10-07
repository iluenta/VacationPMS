import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TwoFactorManager } from "@/lib/auth/2fa-manager"
import { verifyJWTFromRequest } from "@/lib/auth/jwt-manager"
import { securityLogger, getClientInfo } from "@/lib/logging/edge-logger"

// ============================================================================
// POST /api/auth/2fa/verify - Verificar código 2FA
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const jwtPayload = await verifyJWTFromRequest(request)
    if (!jwtPayload) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ 
        error: "Token requerido",
        message: "Ingresa el código de 6 dígitos"
      }, { status: 400 })
    }

    const clientInfo = getClientInfo(request)

    // Verificar código 2FA
    const result = await TwoFactorManager.verifyLogin(jwtPayload.userId, token)

    if (!result.isValid) {
      // Logear intento fallido
      securityLogger.authAttempt({
        userId: jwtPayload.userId,
        email: jwtPayload.email,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        success: false,
        reason: '2FA verification failed - invalid token'
      })

      return NextResponse.json({
        error: "Código inválido",
        message: "El código de autenticación es incorrecto"
      }, { status: 400 })
    }

    // Logear verificación exitosa
    securityLogger.authAttempt({
      userId: jwtPayload.userId,
      email: jwtPayload.email,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      success: true,
      reason: result.isBackupCode ? '2FA verified with backup code' : '2FA verified'
    })

    return NextResponse.json({
      success: true,
      message: "Código 2FA verificado exitosamente",
      data: {
        isBackupCode: result.isBackupCode,
        remainingBackupCodes: result.remainingBackupCodes
      }
    })

  } catch (error) {
    console.error('[API] Error in 2FA verification:', error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      message: "Error al verificar código 2FA"
    }, { status: 500 })
  }
}
