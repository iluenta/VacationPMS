import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TwoFactorManager } from "@/lib/auth/2fa-manager"
import { verifyJWTFromRequest } from "@/lib/auth/jwt-manager"
import { securityLogger, getClientInfo } from "@/lib/logging/edge-logger"

// ============================================================================
// POST /api/auth/2fa/disable - Desactivar 2FA
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const jwtPayload = await verifyJWTFromRequest(request)
    if (!jwtPayload) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ 
        error: "Contraseña requerida",
        message: "Debes ingresar tu contraseña para desactivar 2FA"
      }, { status: 400 })
    }

    const clientInfo = getClientInfo(request)

    // Verificar contraseña
    const supabase = await createClient()
    const { data: user, error: authError } = await supabase.auth.signInWithPassword({
      email: jwtPayload.email,
      password
    })

    if (authError || !user.user) {
      // Logear intento fallido
      securityLogger.authAttempt({
        userId: jwtPayload.userId,
        email: jwtPayload.email,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        success: false,
        reason: '2FA disable failed - invalid password'
      })

      return NextResponse.json({
        error: "Contraseña incorrecta",
        message: "La contraseña ingresada es incorrecta"
      }, { status: 401 })
    }

    // Desactivar 2FA
    const success = await TwoFactorManager.disable(jwtPayload.userId, password)

    if (!success) {
      return NextResponse.json({
        error: "Error al desactivar 2FA",
        message: "No se pudo desactivar la autenticación de dos factores"
      }, { status: 500 })
    }

    // Logear desactivación exitosa
    securityLogger.authAttempt({
      userId: jwtPayload.userId,
      email: jwtPayload.email,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      success: true,
      reason: '2FA disabled successfully'
    })

    return NextResponse.json({
      success: true,
      message: "2FA desactivado exitosamente"
    })

  } catch (error) {
    console.error('[API] Error in 2FA disable:', error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      message: "Error al desactivar 2FA"
    }, { status: 500 })
  }
}
