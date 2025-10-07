import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Configuración de Redis desde variables de entorno
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Configuración de rate limiting por tipo de endpoint
export const rateLimiters = {
  // Endpoints de lectura (más permisivos)
  read: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "60 s"), // 100 requests por minuto
    analytics: true,
    prefix: "rl:read",
  }),

  // Endpoints de creación (más restrictivos)
  create: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "60 s"), // 20 requests por minuto
    analytics: true,
    prefix: "rl:create",
  }),

  // Endpoints de actualización (medio restrictivos)
  update: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "60 s"), // 30 requests por minuto
    analytics: true,
    prefix: "rl:update",
  }),

  // Endpoints de eliminación (muy restrictivos)
  delete: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 requests por minuto
    analytics: true,
    prefix: "rl:delete",
  }),

  // Endpoints de autenticación (muy restrictivos para prevenir ataques)
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 requests por minuto
    analytics: true,
    prefix: "rl:auth",
  }),
}

// Función helper para obtener el rate limiter según el método HTTP
export function getRateLimiter(method: string, pathname: string) {
  // Endpoints de autenticación
  if (pathname.includes('/auth/') || pathname.includes('/login') || pathname.includes('/signup')) {
    return rateLimiters.auth
  }

  // Determinar tipo de operación por método HTTP
  switch (method.toUpperCase()) {
    case 'GET':
      return rateLimiters.read
    case 'POST':
      return rateLimiters.create
    case 'PUT':
    case 'PATCH':
      return rateLimiters.update
    case 'DELETE':
      return rateLimiters.delete
    default:
      return rateLimiters.read // Por defecto, usar el más permisivo
  }
}

// Función helper para obtener identificador único del cliente
export function getClientIdentifier(request: Request): string {
  // Intentar obtener IP real del cliente
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  // Usar la primera IP disponible
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'
  
  return ip.trim()
}

// Función helper para crear respuesta de rate limit excedido
export function createRateLimitResponse(remaining: number, resetTime: number) {
  return new Response(
    JSON.stringify({
      error: "Demasiadas peticiones",
      message: "Has excedido el límite de peticiones. Intenta de nuevo más tarde.",
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      remaining: 0,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime.toString(),
        'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
      },
    }
  )
}
