import { z } from 'zod'
import { sanitizePersonName, sanitizeIdentificationNumber, sanitizePhoneNumber, sanitizeAddress, sanitizePostalCode } from '../security/sanitization'
import { securityLogger } from '../logging/edge-logger'

// Schemas básicos
const uuidSchema = z.string().uuid('Debe ser un UUID válido').transform(sanitizeId)

const personTypeSchema = z.enum(['PHYSICAL', 'LEGAL'], {
  errorMap: () => ({ message: 'Tipo de persona debe ser PHYSICAL o LEGAL' })
})

const identificationTypeSchema = z.enum(['DNI', 'CIF', 'NIE', 'PASSPORT'], {
  errorMap: () => ({ message: 'Tipo de identificación debe ser DNI, CIF, NIE o PASSPORT' })
})

const personCategorySchema = z.enum(['PHYSICAL', 'LEGAL'], {
  errorMap: () => ({ message: 'Categoría debe ser PHYSICAL o LEGAL' })
})

// Schema para persona física
const physicalPersonSchema = z.object({
  firstName: z.string()
    .min(1, 'Nombre es requerido')
    .max(100, 'Nombre no puede exceder 100 caracteres')
    .transform(sanitizePersonName)
    .refine(val => val.length > 0, 'Nombre no puede estar vacío después de sanitización'),
  lastName: z.string()
    .min(1, 'Apellido es requerido')
    .max(100, 'Apellido no puede exceder 100 caracteres')
    .transform(sanitizePersonName)
    .refine(val => val.length > 0, 'Apellido no puede estar vacío después de sanitización'),
  businessName: z.null(),
  identificationType: identificationTypeSchema,
  identificationNumber: z.string()
    .min(1, 'Número de identificación es requerido')
    .max(50, 'Número de identificación no puede exceder 50 caracteres')
    .transform(sanitizeIdentificationNumber)
    .refine(val => val.length > 0, 'Número de identificación no puede estar vacío después de sanitización'),
  personCategory: z.literal('PHYSICAL')
})

// Schema para persona jurídica
const legalPersonSchema = z.object({
  firstName: z.null(),
  lastName: z.null(),
  businessName: z.string()
    .min(1, 'Razón social es requerida')
    .max(200, 'Razón social no puede exceder 200 caracteres')
    .transform(sanitizePersonName)
    .refine(val => val.length > 0, 'Razón social no puede estar vacía después de sanitización'),
  identificationType: identificationTypeSchema,
  identificationNumber: z.string()
    .min(1, 'Número de identificación es requerido')
    .max(50, 'Número de identificación no puede exceder 50 caracteres')
    .transform(sanitizeIdentificationNumber)
    .refine(val => val.length > 0, 'Número de identificación no puede estar vacío después de sanitización'),
  personCategory: z.literal('LEGAL')
})

// Schema principal para crear persona
export const CreatePersonSchema = z.discriminatedUnion('personCategory', [
  physicalPersonSchema,
  legalPersonSchema
]).extend({
  personTypeId: uuidSchema,
  isActive: z.boolean().default(true)
})

// Schema para actualizar persona
export const UpdatePersonSchema = z.object({
  firstName: z.string()
    .min(1, 'Nombre es requerido')
    .max(100, 'Nombre no puede exceder 100 caracteres')
    .transform(sanitizePersonName)
    .optional(),
  lastName: z.string()
    .min(1, 'Apellido es requerido')
    .max(100, 'Apellido no puede exceder 100 caracteres')
    .transform(sanitizePersonName)
    .optional(),
  businessName: z.string()
    .min(1, 'Razón social es requerida')
    .max(200, 'Razón social no puede exceder 200 caracteres')
    .transform(sanitizePersonName)
    .optional(),
  identificationType: identificationTypeSchema.optional(),
  identificationNumber: z.string()
    .min(1, 'Número de identificación es requerido')
    .max(50, 'Número de identificación no puede exceder 50 caracteres')
    .transform(sanitizeIdentificationNumber)
    .optional(),
  isActive: z.boolean().optional()
})

// Schema para filtros de búsqueda
export const PersonFiltersSchema = z.object({
  name: z.string()
    .max(100, 'Nombre de búsqueda no puede exceder 100 caracteres')
    .transform(sanitizePersonName)
    .optional(),
  identificationNumber: z.string()
    .max(50, 'Número de identificación no puede exceder 50 caracteres')
    .transform(sanitizeIdentificationNumber)
    .optional(),
  personTypeId: uuidSchema.optional(),
  category: personCategorySchema.optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0)
})

// Schemas para información de contacto
export const CreateContactInfoSchema = z.object({
  contactName: z.string()
    .min(1, 'Nombre de contacto es requerido')
    .max(100, 'Nombre de contacto no puede exceder 100 caracteres')
    .transform(sanitizePersonName)
    .refine(val => val.length > 0, 'Nombre de contacto no puede estar vacío después de sanitización'),
  phone: z.string()
    .max(20, 'Teléfono no puede exceder 20 caracteres')
    .transform(sanitizePhoneNumber)
    .optional(),
  email: z.string()
    .email('Email debe tener un formato válido')
    .max(100, 'Email no puede exceder 100 caracteres')
    .optional(),
  position: z.string()
    .max(100, 'Cargo no puede exceder 100 caracteres')
    .transform(sanitizePersonName)
    .optional(),
  isPrimary: z.boolean().default(false)
})

export const UpdateContactInfoSchema = z.object({
  contactName: z.string()
    .min(1, 'Nombre de contacto es requerido')
    .max(100, 'Nombre de contacto no puede exceder 100 caracteres')
    .transform(sanitizePersonName)
    .optional(),
  phone: z.string()
    .max(20, 'Teléfono no puede exceder 20 caracteres')
    .transform(sanitizePhoneNumber)
    .optional(),
  email: z.string()
    .email('Email debe tener un formato válido')
    .max(100, 'Email no puede exceder 100 caracteres')
    .optional(),
  position: z.string()
    .max(100, 'Cargo no puede exceder 100 caracteres')
    .transform(sanitizePersonName)
    .optional(),
  isPrimary: z.boolean().optional()
})

// Schemas para dirección fiscal
export const CreateFiscalAddressSchema = z.object({
  street: z.string()
    .min(1, 'Calle es requerida')
    .max(200, 'Calle no puede exceder 200 caracteres')
    .transform(sanitizeAddress)
    .refine(val => val.length > 0, 'Calle no puede estar vacía después de sanitización'),
  number: z.string()
    .max(10, 'Número no puede exceder 10 caracteres')
    .transform(sanitizeAddress)
    .optional(),
  floor: z.string()
    .max(10, 'Piso no puede exceder 10 caracteres')
    .transform(sanitizeAddress)
    .optional(),
  door: z.string()
    .max(10, 'Puerta no puede exceder 10 caracteres')
    .transform(sanitizeAddress)
    .optional(),
  postalCode: z.string()
    .min(1, 'Código postal es requerido')
    .max(10, 'Código postal no puede exceder 10 caracteres')
    .transform(sanitizePostalCode)
    .refine(val => val.length > 0, 'Código postal no puede estar vacío después de sanitización'),
  city: z.string()
    .min(1, 'Ciudad es requerida')
    .max(100, 'Ciudad no puede exceder 100 caracteres')
    .transform(sanitizeAddress)
    .refine(val => val.length > 0, 'Ciudad no puede estar vacía después de sanitización'),
  province: z.string()
    .max(100, 'Provincia no puede exceder 100 caracteres')
    .transform(sanitizeAddress)
    .optional(),
  country: z.string()
    .max(100, 'País no puede exceder 100 caracteres')
    .transform(sanitizeAddress)
    .default('España')
})

export const UpdateFiscalAddressSchema = z.object({
  street: z.string()
    .min(1, 'Calle es requerida')
    .max(200, 'Calle no puede exceder 200 caracteres')
    .transform(sanitizeAddress)
    .optional(),
  number: z.string()
    .max(10, 'Número no puede exceder 10 caracteres')
    .transform(sanitizeAddress)
    .optional(),
  floor: z.string()
    .max(10, 'Piso no puede exceder 10 caracteres')
    .transform(sanitizeAddress)
    .optional(),
  door: z.string()
    .max(10, 'Puerta no puede exceder 10 caracteres')
    .transform(sanitizeAddress)
    .optional(),
  postalCode: z.string()
    .min(1, 'Código postal es requerido')
    .max(10, 'Código postal no puede exceder 10 caracteres')
    .transform(sanitizePostalCode)
    .optional(),
  city: z.string()
    .min(1, 'Ciudad es requerida')
    .max(100, 'Ciudad no puede exceder 100 caracteres')
    .transform(sanitizeAddress)
    .optional(),
  province: z.string()
    .max(100, 'Provincia no puede exceder 100 caracteres')
    .transform(sanitizeAddress)
    .optional(),
  country: z.string()
    .max(100, 'País no puede exceder 100 caracteres')
    .transform(sanitizeAddress)
    .optional()
})

// Schemas para headers
export const PersonHeadersSchema = z.object({
  authorization: z.string()
    .min(1, 'Authorization header es requerido')
    .refine(val => val.startsWith('Bearer '), 'Authorization header debe comenzar con Bearer ')
})

// Schemas para query parameters
export const PersonQueryParamsSchema = z.object({
  tenant_id: uuidSchema.optional(),
  name: z.string().max(100).optional(),
  identification_number: z.string().max(50).optional(),
  person_type_id: uuidSchema.optional(),
  category: personCategorySchema.optional(),
  is_active: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0)).optional()
})

// Funciones de validación
export function validatePersonBody(schema: z.ZodSchema, data: any) {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw error
    }
    throw new Error('Error de validación desconocido')
  }
}

export function validatePersonHeaders(headers: Record<string, string | undefined>) {
  try {
    return PersonHeadersSchema.parse(headers)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw error
    }
    throw new Error('Error de validación de headers desconocido')
  }
}

export function validatePersonQueryParams(params: Record<string, string | undefined>) {
  try {
    return PersonQueryParamsSchema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw error
    }
    throw new Error('Error de validación de query parameters desconocido')
  }
}

export function createPersonValidationErrorResponse(errors: z.ZodError, context?: {
  ip?: string
  userAgent?: string
  endpoint?: string
  payload?: any
}) {
  // Verificar que errors tiene la estructura esperada
  if (!errors || !errors.errors || !Array.isArray(errors.errors)) {
    return {
      success: false,
      error: 'Error de validación',
      details: 'Estructura de error inválida'
    }
  }

  const formattedErrors = errors.errors.map(error => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code,
  }))

  // Log de seguridad para intentos de XSS o SQL Injection
  const hasSuspiciousContent = formattedErrors.some(error => 
    error.message.includes('sanitización') || 
    error.message.includes('vacío después de')
  )

  if (hasSuspiciousContent && context) {
    securityLogger.warn('Suspicious input detected in person validation', {
      event: 'suspiciousInput',
      endpoint: context.endpoint,
      ip: context.ip,
      userAgent: context.userAgent,
      errors: formattedErrors,
      payload: context.payload
    })
  }

  return {
    success: false,
    error: 'Error de validación',
    details: formattedErrors
  }
}