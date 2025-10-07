import { NextRequest, NextResponse } from "next/server"
import { JWTManager, getTokenFromCookies, setAuthCookies, clearAuthCookies } from "@/lib/auth/jwt-manager"
import { securityLogger, getClientInfo } from "@/lib/logging/edge-logger"

// ============================================================================
// POST /api/auth/refresh - Renovar tokens
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const clientInfo = getClientInfo(request)
    
    // Obtener refresh token de cookies
    const cookies = request.headers.get('cookie') || ''
    const { refreshToken } = getTokenFromCookies(cookies)

    if (!refreshToken) {
      return NextResponse.json({ 
        error: "Refresh token no encontrado",
        message: "Debes iniciar sesión nuevamente"
      }, { status: 401 })
    }

    // Renovar tokens
    const newTokenPair = await JWTManager.refreshAccessToken(refreshToken)

    if (!newTokenPair) {
      // Refresh token inválido o expirado
      const clearCookies = clearAuthCookies()
      const response = NextResponse.json({
        error: "Sesión expirada",
        message: "Tu sesión ha expirado. Inicia sesión nuevamente."
      }, { status: 401 })

      // Limpiar cookies
      clearCookies.forEach(cookie => {
        response.headers.append('Set-Cookie', cookie)
      })

      return response
    }

    // Configurar nuevas cookies
    const cookiesToSet = setAuthCookies(newTokenPair)
    const response = NextResponse.json({
      success: true,
      message: "Tokens renovados exitosamente",
      expiresIn: newTokenPair.expiresIn
    })

    // Aplicar nuevas cookies
    cookiesToSet.forEach(cookie => {
      response.headers.append('Set-Cookie', cookie)
    })

    return response

  } catch (error) {
    console.error('[API] Error in refresh:', error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      message: "Error al renovar la sesión"
    }, { status: 500 })
  }
}
