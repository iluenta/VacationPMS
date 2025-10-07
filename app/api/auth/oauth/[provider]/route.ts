import { NextRequest, NextResponse } from "next/server"
import { OAuthManager, getOAuthCallbackUrl } from "@/lib/auth/oauth-manager"
import { securityLogger, getClientInfo } from "@/lib/logging/edge-logger"

// ============================================================================
// GET /api/auth/oauth/[provider] - Iniciar flujo OAuth
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const clientInfo = getClientInfo(request)

    // Verificar que el proveedor esté disponible
    if (!OAuthManager.isProviderAvailable(provider)) {
      return NextResponse.json({
        error: "Proveedor no disponible",
        message: `El proveedor ${provider} no está configurado`
      }, { status: 400 })
    }

    // Generar URL de autorización
    const redirectUri = getOAuthCallbackUrl(provider)
    const authUrl = OAuthManager.getAuthUrl(provider, redirectUri)

    // Logear inicio de OAuth
    securityLogger.authAttempt({
      email: 'oauth',
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      success: true,
      reason: `OAuth initiated with ${provider}`
    })

    return NextResponse.json({
      success: true,
      data: {
        authUrl,
        provider,
        redirectUri
      }
    })

  } catch (error) {
    console.error('[API] Error in OAuth initiation:', error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      message: "Error al iniciar autenticación OAuth"
    }, { status: 500 })
  }
}
