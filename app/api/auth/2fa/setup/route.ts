import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TwoFactorManager } from "@/lib/auth/2fa-manager"
import { verifyJWTFromRequest } from "@/lib/auth/jwt-manager"
import { securityLogger, getClientInfo } from "@/lib/logging/edge-logger"

// ============================================================================
// GET /api/auth/2fa/setup - Obtener configuración 2FA
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const jwtPayload = await verifyJWTFromRequest(request)
    if (!jwtPayload) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const clientInfo = getClientInfo(request)

    // Generar configuración 2FA
    const setup = await TwoFactorManager.generateSetup(jwtPayload.userId, jwtPayload.email)

    // Logear inicio de configuración 2FA
    securityLogger.authAttempt({
      userId: jwtPayload.userId,
      email: jwtPayload.email,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      success: true,
      reason: '2FA setup initiated'
    })

    return NextResponse.json({
      success: true,
      data: {
        secret: setup.secret,
        qrCodeUrl: setup.qrCodeUrl,
        backupCodes: setup.backupCodes,
        message: "Escanea el código QR con tu aplicación de autenticación"
      }
    })

  } catch (error) {
    console.error('[API] Error in 2FA setup:', error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      message: "Error al configurar 2FA"
    }, { status: 500 })
  }
}

// ============================================================================
// POST /api/auth/2fa/setup - Activar 2FA
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
        message: "Ingresa el código de 6 dígitos de tu aplicación de autenticación"
      }, { status: 400 })
    }

    const clientInfo = getClientInfo(request)

    // Verificar y activar 2FA
    const result = await TwoFactorManager.verifyAndActivate(jwtPayload.userId, token)

    if (!result.isValid) {
      // Logear intento fallido
      securityLogger.authAttempt({
        userId: jwtPayload.userId,
        email: jwtPayload.email,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        success: false,
        reason: '2FA activation failed - invalid token'
      })

      return NextResponse.json({
        error: "Código inválido",
        message: "El código de autenticación es incorrecto. Intenta nuevamente."
      }, { status: 400 })
    }

    // Logear activación exitosa
    securityLogger.authAttempt({
      userId: jwtPayload.userId,
      email: jwtPayload.email,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      success: true,
      reason: '2FA activated successfully'
    })

    return NextResponse.json({
      success: true,
      message: "2FA activado exitosamente",
      data: {
        isBackupCode: result.isBackupCode,
        remainingBackupCodes: result.remainingBackupCodes
      }
    })

  } catch (error) {
    console.error('[API] Error in 2FA activation:', error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      message: "Error al activar 2FA"
    }, { status: 500 })
  }
}
