import { updateSession } from "@/lib/supabase/middleware"
import { getRateLimiter, getClientIdentifier, createRateLimitResponse } from "@/lib/rate-limit"
import { securityHeadersMiddleware } from "@/lib/security/csp"
import { securityLogger, getClientInfo } from "@/lib/logging/edge-logger"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  // Aplicar rate limiting solo a rutas de API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    try {
      const method = request.method
      const pathname = request.nextUrl.pathname
      
      // Obtener el rate limiter apropiado
      const rateLimiter = getRateLimiter(method, pathname)
      
      // Obtener identificador único del cliente
      const clientId = getClientIdentifier(request)
      
      // Verificar rate limit
      const { success, remaining, reset } = await rateLimiter.limit(clientId)
      
      if (!success) {
        // Rate limit excedido - logear evento de seguridad
        const clientInfo = getClientInfo(request)
        securityLogger.rateLimitExceeded({
          ip: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          endpoint: pathname,
          method: method,
          limit: 100, // TODO: Obtener límite real del rate limiter
          window: '60s'
        })
        
        console.warn(`[RATE LIMIT] Cliente ${clientId} excedió límite en ${method} ${pathname}`)
        return createRateLimitResponse(remaining, reset)
      }
      
      // Continuar con la request, agregando headers de rate limit
      const response = await updateSession(request)
      
      // Agregar headers informativos de rate limit
      if (response instanceof NextResponse) {
        response.headers.set('X-RateLimit-Remaining', remaining.toString())
        response.headers.set('X-RateLimit-Reset', reset.toString())
        
        // Aplicar headers de seguridad
        const securityHeaders = securityHeadersMiddleware(request)
        Object.entries(securityHeaders).forEach(([header, value]) => {
          response.headers.set(header, value)
        })
      }
      
      return response
      
    } catch (error) {
      // Si hay error en rate limiting, logear pero continuar
      console.error('[RATE LIMIT ERROR]', error)
      return await updateSession(request)
    }
  }
  
  // Para rutas no-API, aplicar autenticación y headers de seguridad
  const response = await updateSession(request)
  
  // Aplicar headers de seguridad a todas las respuestas
  if (response instanceof NextResponse) {
    const securityHeaders = securityHeadersMiddleware(request)
    Object.entries(securityHeaders).forEach(([header, value]) => {
      response.headers.set(header, value)
    })
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match only API routes and auth-related routes
     * This prevents the middleware from running on client-side navigation
     */
    "/api/(.*)",
    "/auth/(.*)",
    "/login",
    "/verify-email",
    "/dashboard/(.*)"
  ],
}
