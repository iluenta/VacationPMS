import { NextRequest, NextResponse } from "next/server"
import { JWTManager, getTokenFromCookies, clearAuthCookies, verifyJWTFromRequest } from "@/lib/auth/jwt-manager"
import { securityLogger, getClientInfo } from "@/lib/logging/edge-logger"

// ============================================================================
// POST /api/auth/logout - Cerrar sesión
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const clientInfo = getClientInfo(request)
    
    // Obtener información del usuario actual
    const jwtPayload = await verifyJWTFromRequest(request)
    const cookies = request.headers.get('cookie') || ''
    const { refreshToken } = getTokenFromCookies(cookies)

    // Revocar refresh token si existe
    if (refreshToken && jwtPayload) {
      await JWTManager.revokeRefreshToken(jwtPayload.sessionId)
    }

    // Logear logout
    if (jwtPayload) {
      securityLogger.authAttempt({
        userId: jwtPayload.userId,
        email: jwtPayload.email,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        success: true,
        reason: 'Logout exitoso'
      })
    }

    // Limpiar cookies
    const clearCookies = clearAuthCookies()
    const response = NextResponse.json({
      success: true,
      message: "Sesión cerrada exitosamente"
    })

    // Aplicar cookies de limpieza
    clearCookies.forEach(cookie => {
      response.headers.append('Set-Cookie', cookie)
    })

    return response

  } catch (error) {
    console.error('[API] Error in logout:', error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      message: "Error al cerrar la sesión"
    }, { status: 500 })
  }
}

// ============================================================================
// POST /api/auth/logout-all - Cerrar todas las sesiones
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const clientInfo = getClientInfo(request)
    
    // Obtener información del usuario actual
    const jwtPayload = await verifyJWTFromRequest(request)
    
    if (!jwtPayload) {
      return NextResponse.json({ 
        error: "No autorizado",
        message: "Debes iniciar sesión para realizar esta acción"
      }, { status: 401 })
    }

    // Revocar todos los tokens del usuario
    await JWTManager.revokeAllUserTokens(jwtPayload.userId)

    // Logear logout masivo
    securityLogger.authAttempt({
      userId: jwtPayload.userId,
      email: jwtPayload.email,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      success: true,
      reason: 'Logout de todas las sesiones'
    })

    // Limpiar cookies
    const clearCookies = clearAuthCookies()
    const response = NextResponse.json({
      success: true,
      message: "Todas las sesiones han sido cerradas exitosamente"
    })

    // Aplicar cookies de limpieza
    clearCookies.forEach(cookie => {
      response.headers.append('Set-Cookie', cookie)
    })

    return response

  } catch (error) {
    console.error('[API] Error in logout-all:', error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      message: "Error al cerrar las sesiones"
    }, { status: 500 })
  }
}
