import { NextRequest, NextResponse } from "next/server"
import { OAuthManager, getOAuthCallbackUrl } from "@/lib/auth/oauth-manager"
import { JWTManager, setAuthCookies } from "@/lib/auth/jwt-manager"
import { securityLogger, getClientInfo } from "@/lib/logging/edge-logger"

// ============================================================================
// GET /api/auth/oauth/callback/[provider] - Callback OAuth
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    const clientInfo = getClientInfo(request)

    // Verificar errores de OAuth
    if (error) {
      securityLogger.authAttempt({
        email: 'oauth',
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        success: false,
        reason: `OAuth error: ${error}`
      })

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/error?error=oauth_${error}`)
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/error?error=oauth_no_code`)
    }

    // Verificar que el proveedor esté disponible
    if (!OAuthManager.isProviderAvailable(provider)) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/error?error=oauth_provider_unavailable`)
    }

    // Autenticar con OAuth
    const redirectUri = getOAuthCallbackUrl(provider)
    const { user, tokenPair, isNewUser } = await OAuthManager.authenticateWithOAuth(provider, code, redirectUri)

    // Configurar cookies
    const cookies = setAuthCookies(tokenPair)
    
    // Redirigir al dashboard
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?oauth_success=true&is_new_user=${isNewUser}`)

    // Aplicar cookies
    cookies.forEach(cookie => {
      response.headers.append('Set-Cookie', cookie)
    })

    return response

  } catch (error) {
    console.error('[API] Error in OAuth callback:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/error?error=oauth_callback_error`)
  }
}
