import { z } from "zod"
import { 
  sanitizeText, 
  sanitizeColor, 
  sanitizeId,
  isSafeString,
  isSafeUrl 
} from "@/lib/security/sanitization"
import { securityLogger } from "@/lib/logging/edge-logger"

// ============================================================================
// ESQUEMAS BASE
// ============================================================================

// Validación de UUID con sanitización
const uuidSchema = z.string()
  .uuid("ID debe ser un UUID válido")
  .transform(sanitizeId)
  .refine(id => id.length > 0, "ID no válido después de sanitización")

// Validación de colores hexadecimales con sanitización
const colorSchema = z.string()
  .regex(
    /^#[0-9A-F]{6}$/i,
    "Color debe ser un código hexadecimal válido (ej: #3B82F6)"
  )
  .transform(sanitizeColor)
  .refine(color => color !== '#000000' || true, "Color válido") // Permitir #000000

// Validación de iconos con sanitización
const iconSchema = z.string()
  .min(1, "Icono es requerido")
  .max(50, "Icono no puede exceder 50 caracteres")
  .transform(sanitizeText)
  .refine(icon => /^[a-zA-Z0-9_-]+$/.test(icon), "Icono solo puede contener letras, números, guiones y guiones bajos")
  .refine(icon => isSafeString(icon), "Icono contiene caracteres peligrosos")

// ============================================================================
// ESQUEMAS PARA CONFIGURATION TYPES
// ============================================================================

// Esquema para crear un tipo de configuración con sanitización
export const CreateConfigurationTypeSchema = z.object({
  name: z.string()
    .min(1, "Nombre es requerido")
    .max(100, "Nombre no puede exceder 100 caracteres")
    .transform(sanitizeText)
    .refine(name => name.length > 0, "Nombre no puede estar vacío después de sanitización")
    .refine(name => isSafeString(name), "Nombre contiene caracteres peligrosos"),
  
  description: z.string()
    .max(500, "Descripción no puede exceder 500 caracteres")
    .transform(sanitizeText)
    .refine(desc => !desc || isSafeString(desc), "Descripción contiene caracteres peligrosos")
    .optional(),
  
  icon: iconSchema,
  
  color: colorSchema,
  
  is_active: z.boolean().default(true),
  
  sort_order: z.number()
    .int("Orden debe ser un número entero")
    .min(0, "Orden debe ser mayor o igual a 0")
    .max(999, "Orden no puede exceder 999")
    .default(0),
})

// Esquema para actualizar un tipo de configuración
export const UpdateConfigurationTypeSchema = CreateConfigurationTypeSchema.partial().extend({
  id: uuidSchema,
})

// Esquema para obtener configuraciones (query parameters)
export const GetConfigurationsSchema = z.object({
  tenant_id: uuidSchema.optional(),
  is_active: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number()
    .int("Límite debe ser un número entero")
    .min(1, "Límite debe ser mayor a 0")
    .max(100, "Límite no puede exceder 100")
    .default(50),
  offset: z.coerce.number()
    .int("Offset debe ser un número entero")
    .min(0, "Offset debe ser mayor o igual a 0")
    .default(0),
})

// Esquema para eliminar un tipo de configuración
export const DeleteConfigurationTypeSchema = z.object({
  id: uuidSchema,
})

// ============================================================================
// ESQUEMAS PARA CONFIGURATION VALUES
// ============================================================================

// Esquema para crear un valor de configuración con sanitización
export const CreateConfigurationValueSchema = z.object({
  configuration_type_id: uuidSchema,
  
  value: z.string()
    .min(1, "Valor es requerido")
    .max(200, "Valor no puede exceder 200 caracteres")
    .transform(sanitizeText)
    .refine(value => value.length > 0, "Valor no puede estar vacío después de sanitización")
    .refine(value => isSafeString(value), "Valor contiene caracteres peligrosos"),
  
  label: z.string()
    .min(1, "Etiqueta es requerida")
    .max(100, "Etiqueta no puede exceder 100 caracteres")
    .transform(sanitizeText)
    .refine(label => label.length > 0, "Etiqueta no puede estar vacía después de sanitización")
    .refine(label => isSafeString(label), "Etiqueta contiene caracteres peligrosos"),
  
  description: z.string()
    .max(300, "Descripción no puede exceder 300 caracteres")
    .transform(sanitizeText)
    .refine(desc => !desc || isSafeString(desc), "Descripción contiene caracteres peligrosos")
    .optional(),
  
  is_active: z.boolean().default(true),
  
  sort_order: z.number()
    .int("Orden debe ser un número entero")
    .min(0, "Orden debe ser mayor o igual a 0")
    .max(999, "Orden no puede exceder 999")
    .default(0),
  
  metadata: z.record(z.any()).optional(), // JSON opcional para metadatos adicionales
})

// Esquema para actualizar un valor de configuración
export const UpdateConfigurationValueSchema = CreateConfigurationValueSchema.partial().extend({
  id: uuidSchema,
})

// Esquema para obtener valores de configuración
export const GetConfigurationValuesSchema = z.object({
  configuration_type_id: uuidSchema,
  is_active: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number()
    .int("Límite debe ser un número entero")
    .min(1, "Límite debe ser mayor a 0")
    .max(100, "Límite no puede exceder 100")
    .default(50),
  offset: z.coerce.number()
    .int("Offset debe ser un número entero")
    .min(0, "Offset debe ser mayor o igual a 0")
    .default(0),
})

// Esquema para eliminar un valor de configuración
export const DeleteConfigurationValueSchema = z.object({
  id: uuidSchema,
})

// ============================================================================
// ESQUEMAS PARA PARÁMETROS DE RUTA
// ============================================================================

// Esquema para parámetros de ruta con ID
export const RouteParamsSchema = z.object({
  id: uuidSchema,
  valueId: uuidSchema.optional(),
})

// ============================================================================
// ESQUEMAS PARA HEADERS
// ============================================================================

// Esquema para headers de tenant (para admins)
export const TenantHeaderSchema = z.object({
  'x-tenant-id': uuidSchema.optional(),
})

// ============================================================================
// TIPOS TYPESCRIPT DERIVADOS
// ============================================================================

export type CreateConfigurationTypeInput = z.infer<typeof CreateConfigurationTypeSchema>
export type UpdateConfigurationTypeInput = z.infer<typeof UpdateConfigurationTypeSchema>
export type GetConfigurationsInput = z.infer<typeof GetConfigurationsSchema>
export type DeleteConfigurationTypeInput = z.infer<typeof DeleteConfigurationTypeSchema>

export type CreateConfigurationValueInput = z.infer<typeof CreateConfigurationValueSchema>
export type UpdateConfigurationValueInput = z.infer<typeof UpdateConfigurationValueSchema>
export type GetConfigurationValuesInput = z.infer<typeof GetConfigurationValuesSchema>
export type DeleteConfigurationValueInput = z.infer<typeof DeleteConfigurationValueSchema>

export type RouteParams = z.infer<typeof RouteParamsSchema>
export type TenantHeader = z.infer<typeof TenantHeaderSchema>

// ============================================================================
// FUNCIONES HELPER PARA VALIDACIÓN
// ============================================================================

// Función para validar y parsear query parameters
export function validateQueryParams<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): T {
  const params = Object.fromEntries(searchParams.entries())
  return schema.parse(params)
}

// Función para validar y parsear body de request
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  return schema.parse(body)
}

// Función para validar parámetros de ruta
export function validateRouteParams<T>(schema: z.ZodSchema<T>, params: unknown): T {
  return schema.parse(params)
}

// Función para validar headers
export function validateHeaders<T>(schema: z.ZodSchema<T>, headers: Record<string, string | undefined>): T {
  return schema.parse(headers)
}

// Función para crear respuesta de error de validación
export function createValidationErrorResponse(errors: z.ZodError, context?: {
  ip?: string
  userAgent?: string
  endpoint?: string
  payload?: any
}) {
  const formattedErrors = errors.errors.map(error => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code,
  }))

  // Detectar intentos de ataque en los errores
  const suspiciousErrors = formattedErrors.filter(error => 
    error.message.includes('caracteres peligrosos') ||
    error.message.includes('no válido después de sanitización')
  )

  // Logear eventos de seguridad si se detectan intentos de ataque
  if (suspiciousErrors.length > 0 && context) {
    const payloadStr = JSON.stringify(context.payload || {})
    
    // Detectar tipo de ataque
    if (payloadStr.includes('<script>') || payloadStr.includes('javascript:')) {
      securityLogger.xssAttempt({
        ip: context.ip || 'unknown',
        userAgent: context.userAgent || 'unknown',
        endpoint: context.endpoint || 'unknown',
        payload: payloadStr.substring(0, 500), // Limitar tamaño del log
        sanitized: true
      })
    } else if (payloadStr.includes("'") || payloadStr.includes('--') || payloadStr.includes(';')) {
      securityLogger.sqlInjectionAttempt({
        ip: context.ip || 'unknown',
        userAgent: context.userAgent || 'unknown',
        endpoint: context.endpoint || 'unknown',
        payload: payloadStr.substring(0, 500),
        blocked: true
      })
    }
  }

  return {
    error: "Datos de entrada inválidos",
    message: "Los datos proporcionados no cumplen con los requisitos de validación",
    details: formattedErrors,
  }
}
