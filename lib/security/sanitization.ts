import DOMPurify from 'dompurify'
import validator from 'validator'

// ============================================================================
// CONFIGURACIÓN DE SANITIZACIÓN
// ============================================================================

// Configuración estricta para DOMPurify
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [], // No permitir ningún tag HTML
  ALLOWED_ATTR: [], // No permitir ningún atributo
  KEEP_CONTENT: false, // No mantener contenido
  RETURN_DOM: false, // Retornar string, no DOM
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
  SAFE_FOR_TEMPLATES: true, // Seguro para templates
  SANITIZE_NAMED_PROPS: true,
  IN_PLACE: false,
  USE_PROFILES: {
    html: false, // No permitir HTML
    svg: false,  // No permitir SVG
    svgFilters: false,
    mathMl: false
  }
}

// Configuración para contenido HTML limitado (solo para casos específicos)
const DOMPURIFY_CONFIG_LIMITED = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
  SAFE_FOR_TEMPLATES: true,
  SANITIZE_NAMED_PROPS: true,
  IN_PLACE: false,
  USE_PROFILES: {
    html: true,
    svg: false,
    svgFilters: false,
    mathMl: false
  }
}

// ============================================================================
// SANITIZACIÓN DE ENTRADA
// ============================================================================

/**
 * Sanitiza texto plano - elimina todo HTML/scripts
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  // Usar DOMPurify con configuración estricta
  const sanitized = DOMPurify.sanitize(input, DOMPURIFY_CONFIG)
  
  // Limpiar caracteres de control adicionales
  return sanitized
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Caracteres de control
    .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
    .trim()
}

/**
 * Sanitiza HTML limitado - permite solo tags básicos de formato
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  return DOMPurify.sanitize(input, DOMPURIFY_CONFIG_LIMITED)
}

/**
 * Sanitiza URL - valida y limpia URLs
 */
export function sanitizeUrl(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  const trimmed = input.trim()
  
  // Validar que sea una URL válida
  if (!validator.isURL(trimmed, { 
    protocols: ['http', 'https'],
    require_protocol: true,
    require_host: true,
    require_valid_protocol: true,
    allow_underscores: false,
    host_whitelist: false,
    host_blacklist: false,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false
  })) {
    return ''
  }
  
  return trimmed
}

/**
 * Sanitiza email - valida y limpia emails
 */
export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  const trimmed = input.trim().toLowerCase()
  
  if (!validator.isEmail(trimmed)) {
    return ''
  }
  
  return trimmed
}

/**
 * Sanitiza nombre de archivo - elimina caracteres peligrosos
 */
export function sanitizeFilename(input: string): string {
  if (typeof input !== 'string') {
    return 'unnamed'
  }
  
  return input
    .replace(/[<>:"/\\|?*]/g, '') // Caracteres peligrosos para archivos
    .replace(/\.+/g, '.') // Múltiples puntos a uno solo
    .replace(/^\./, '') // No empezar con punto
    .replace(/\.$/, '') // No terminar con punto
    .replace(/\s+/g, '_') // Espacios a guiones bajos
    .substring(0, 255) // Límite de longitud
    .trim() || 'unnamed'
}

/**
 * Sanitiza código de color hexadecimal
 */
export function sanitizeColor(input: string): string {
  if (typeof input !== 'string') {
    return '#000000'
  }
  
  const trimmed = input.trim()
  
  // Validar formato hexadecimal
  if (!/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return '#000000'
  }
  
  return trimmed.toUpperCase()
}

/**
 * Sanitiza identificador (UUID, ID, etc.)
 */
export function sanitizeId(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  const trimmed = input.trim()
  
  // Solo permitir caracteres alfanuméricos, guiones y guiones bajos
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return ''
  }
  
  return trimmed
}

// ============================================================================
// ESCAPE DE SALIDA
// ============================================================================

/**
 * Escapa HTML para prevenir XSS
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Escapa JavaScript para prevenir inyección
 */
export function escapeJs(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

/**
 * Escapa SQL para prevenir inyección SQL (básico)
 */
export function escapeSql(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  return input
    .replace(/'/g, "''") // Escapar comillas simples
    .replace(/\\/g, '\\\\') // Escapar backslashes
    .replace(/%/g, '\\%') // Escapar wildcards
    .replace(/_/g, '\\_') // Escapar wildcards
}

// ============================================================================
// VALIDACIÓN DE ARCHIVOS
// ============================================================================

// Tipos MIME permitidos
const ALLOWED_MIME_TYPES = {
  images: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  all: [] as string[]
}

// Inicializar lista completa
ALLOWED_MIME_TYPES.all = [
  ...ALLOWED_MIME_TYPES.images,
  ...ALLOWED_MIME_TYPES.documents
]

/**
 * Valida tipo MIME de archivo
 */
export function validateMimeType(mimeType: string, allowedTypes: string[] = ALLOWED_MIME_TYPES.all): boolean {
  if (typeof mimeType !== 'string') {
    return false
  }
  
  return allowedTypes.includes(mimeType.toLowerCase())
}

/**
 * Valida tamaño de archivo
 */
export function validateFileSize(size: number, maxSizeBytes: number = 5 * 1024 * 1024): boolean {
  if (typeof size !== 'number' || size < 0) {
    return false
  }
  
  return size <= maxSizeBytes
}

/**
 * Valida nombre de archivo
 */
export function validateFilename(filename: string): boolean {
  if (typeof filename !== 'string') {
    return false
  }
  
  const sanitized = sanitizeFilename(filename)
  
  return sanitized.length > 0 && 
         sanitized !== 'unnamed' && 
         sanitized.length <= 255 &&
         !filename.includes('..') && // Prevenir path traversal
         !filename.startsWith('.') // No archivos ocultos
}

// ============================================================================
// UTILIDADES DE VALIDACIÓN
// ============================================================================

/**
 * Valida que una cadena no contenga scripts o HTML peligroso
 */
export function isSafeString(input: string): boolean {
  if (typeof input !== 'string') {
    return false
  }
  
  // Detectar patrones sospechosos
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
    /<style/i,
    /expression\s*\(/i, // CSS expressions
    /url\s*\(/i, // CSS URLs
    /@import/i, // CSS imports
    /vbscript:/i,
    /data:/i, // Data URLs
    /blob:/i // Blob URLs
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(input))
}

/**
 * Valida que una URL sea segura
 */
export function isSafeUrl(input: string): boolean {
  if (typeof input !== 'string') {
    return false
  }
  
  const trimmed = input.trim()
  
  // Solo permitir HTTP/HTTPS
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false
  }
  
  // Validar formato de URL
  if (!validator.isURL(trimmed)) {
    return false
  }
  
  // Verificar que no contenga caracteres peligrosos
  return isSafeString(trimmed)
}

// ============================================================================
// FUNCIONES HELPER
// ============================================================================

/**
 * Sanitiza un objeto completo recursivamente
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T, sanitizers: Record<string, (input: any) => any>): T {
  const sanitized = { ...obj }
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string' && sanitizers[key]) {
      sanitized[key] = sanitizers[key](value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value, sanitizers)
    }
  }
  
  return sanitized
}

/**
 * Sanitiza un array de strings
 */
export function sanitizeStringArray(input: string[], sanitizer: (input: string) => string = sanitizeText): string[] {
  if (!Array.isArray(input)) {
    return []
  }
  
  return input
    .filter(item => typeof item === 'string')
    .map(sanitizer)
    .filter(item => item.length > 0)
}

// ============================================================================
// EXPORTAR CONFIGURACIONES
// ============================================================================

export {
  DOMPURIFY_CONFIG,
  DOMPURIFY_CONFIG_LIMITED,
  ALLOWED_MIME_TYPES
}
