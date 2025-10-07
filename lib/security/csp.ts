// ============================================================================
// CONTENT SECURITY POLICY (CSP) HEADERS
// ============================================================================

/**
 * Configuración estricta de CSP para prevenir XSS y otros ataques
 */
export const CSP_POLICY = {
  // Directivas de CSP
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline' 'unsafe-eval'", // Permitir inline scripts para Next.js
  'style-src': "'self' 'unsafe-inline'", // Permitir inline styles para Tailwind
  'img-src': "'self' data: blob: https:", // Permitir imágenes de HTTPS y data URLs
  'font-src': "'self' data:", // Permitir fuentes locales y data URLs
  'connect-src': "'self' https://*.supabase.co https://*.upstash.io", // APIs permitidas
  'media-src': "'self'",
  'object-src': "'none'", // No permitir objetos embebidos
  'base-uri': "'self'",
  'form-action': "'self'",
  'frame-ancestors': "'none'", // Prevenir clickjacking
  'upgrade-insecure-requests': '', // Forzar HTTPS
  'block-all-mixed-content': '', // Bloquear contenido mixto
}

/**
 * Configuración de CSP para desarrollo (más permisiva)
 */
export const CSP_POLICY_DEV = {
  ...CSP_POLICY,
  'script-src': "'self' 'unsafe-inline' 'unsafe-eval' localhost:*", // Permitir scripts de desarrollo
  'connect-src': "'self' https://*.supabase.co https://*.upstash.io localhost:* ws://localhost:*", // WebSockets para desarrollo
  'upgrade-insecure-requests': undefined, // No forzar HTTPS en desarrollo
  'block-all-mixed-content': undefined, // Permitir contenido mixto en desarrollo
}

/**
 * Genera el header CSP como string
 */
export function generateCSPHeader(policy: Record<string, string | undefined> = CSP_POLICY): string {
  return Object.entries(policy)
    .filter(([_, value]) => value !== undefined && value !== '')
    .map(([directive, value]) => `${directive} ${value}`)
    .join('; ')
}

/**
 * Headers de seguridad adicionales
 */
export const SECURITY_HEADERS = {
  // Prevenir clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevenir MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Habilitar XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Política de referrer
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permisos de funcionalidades del navegador
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', '),
  
  // Prevenir DNS prefetch
  'X-DNS-Prefetch-Control': 'off',
  
  // Prevenir descarga automática
  'X-Download-Options': 'noopen',
  
  // Política de origen cruzado
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
}

/**
 * Headers de seguridad para desarrollo
 */
export const SECURITY_HEADERS_DEV = {
  ...SECURITY_HEADERS,
  'X-Frame-Options': 'SAMEORIGIN', // Más permisivo para desarrollo
  'Cross-Origin-Embedder-Policy': undefined, // Deshabilitar en desarrollo
  'Cross-Origin-Opener-Policy': undefined, // Deshabilitar en desarrollo
  'Cross-Origin-Resource-Policy': undefined, // Deshabilitar en desarrollo
}

/**
 * Aplica headers de seguridad a una respuesta
 */
export function applySecurityHeaders(
  response: Response,
  isDev: boolean = process.env.NODE_ENV === 'development'
): Response {
  const cspPolicy = isDev ? CSP_POLICY_DEV : CSP_POLICY
  const securityHeaders = isDev ? SECURITY_HEADERS_DEV : SECURITY_HEADERS
  
  // Aplicar CSP
  const cspHeader = generateCSPHeader(cspPolicy)
  if (cspHeader) {
    response.headers.set('Content-Security-Policy', cspHeader)
  }
  
  // Aplicar otros headers de seguridad
  Object.entries(securityHeaders).forEach(([header, value]) => {
    if (value !== undefined) {
      response.headers.set(header, value)
    }
  })
  
  return response
}

/**
 * Middleware para aplicar headers de seguridad
 */
export function securityHeadersMiddleware(request: Request): HeadersInit {
  const isDev = process.env.NODE_ENV === 'development'
  const cspPolicy = isDev ? CSP_POLICY_DEV : CSP_POLICY
  const securityHeaders = isDev ? SECURITY_HEADERS_DEV : SECURITY_HEADERS
  
  const headers: HeadersInit = {}
  
  // Aplicar CSP
  const cspHeader = generateCSPHeader(cspPolicy)
  if (cspHeader) {
    headers['Content-Security-Policy'] = cspHeader
  }
  
  // Aplicar otros headers de seguridad
  Object.entries(securityHeaders).forEach(([header, value]) => {
    if (value !== undefined) {
      headers[header] = value
    }
  })
  
  return headers
}

/**
 * Configuración de CSP para diferentes entornos
 */
export const CSP_CONFIGS = {
  production: CSP_POLICY,
  development: CSP_POLICY_DEV,
  test: {
    ...CSP_POLICY,
    'script-src': "'self' 'unsafe-inline' 'unsafe-eval'", // Permitir más en tests
  }
} as const

/**
 * Obtiene la configuración de CSP según el entorno
 */
export function getCSPConfig(env: keyof typeof CSP_CONFIGS = 'production'): Record<string, string | undefined> {
  return CSP_CONFIGS[env] || CSP_CONFIGS.production
}

/**
 * Valida que una URL esté permitida por la política CSP
 */
export function isUrlAllowedByCSP(url: string, directive: keyof typeof CSP_POLICY = 'connect-src'): boolean {
  const policy = CSP_POLICY[directive]
  if (!policy) return false
  
  // Verificar si la URL coincide con alguna de las fuentes permitidas
  const allowedSources = policy.split(' ')
  
  return allowedSources.some(source => {
    if (source === "'self'") {
      return url.startsWith('/') || url.includes(window?.location?.hostname || 'localhost')
    }
    if (source === "'unsafe-inline'") {
      return url.startsWith('data:') || url.startsWith('blob:')
    }
    if (source.startsWith('https://')) {
      return url.startsWith(source)
    }
    return false
  })
}

/**
 * Genera nonce para scripts inline (para casos específicos)
 */
export function generateNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64')
}

/**
 * Configuración de CSP con nonce para scripts inline
 */
export function getCSPWithNonce(nonce: string): Record<string, string | undefined> {
  return {
    ...CSP_POLICY,
    'script-src': `'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval'`,
  }
}
