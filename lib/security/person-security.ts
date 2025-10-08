import { NextRequest } from 'next/server'
import { securityLogger } from '../logging/edge-logger'
import { PersonAuditLogger } from '../logging/person-audit'
import { getClientInfo } from '../logging/edge-logger'

/**
 * Middleware de seguridad específico para Person Management
 */

export interface PersonSecurityContext {
  userId: string
  tenantId?: string
  personId?: string
  operation: string
  request: NextRequest
}

export class PersonSecurityMiddleware {
  /**
   * Valida el acceso a operaciones de personas
   */
  static async validateAccess(context: PersonSecurityContext): Promise<boolean> {
    try {
      const clientInfo = getClientInfo(context.request)
      
      // Log del intento de acceso
      PersonAuditLogger.personsAccessed({
        userId: context.userId,
        tenantId: context.tenantId,
        personId: context.personId,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        endpoint: context.request.url
      }, {}, 0)

      // Validaciones básicas de seguridad
      if (!this.isValidUserId(context.userId)) {
        PersonAuditLogger.unauthorizedAccess({
          userId: context.userId,
          tenantId: context.tenantId,
          personId: context.personId,
          ip: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          endpoint: context.request.url
        }, context.operation)
        
        return false
      }

      // Validar rate limiting por usuario
      if (!this.checkRateLimit(context.userId, context.operation)) {
        securityLogger.warn('Rate limit exceeded for person operations', {
          event: 'rateLimitExceeded',
          userId: context.userId,
          operation: context.operation,
          ip: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          endpoint: context.request.url
        })
        
        return false
      }

      return true
    } catch (error) {
      securityLogger.error('Error in person security validation', {
        event: 'securityValidationError',
        userId: context.userId,
        operation: context.operation,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      return false
    }
  }

  /**
   * Valida que el UserId tenga formato válido
   */
  private static isValidUserId(userId: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(userId)
  }

  /**
   * Verifica rate limiting por usuario y operación
   */
  private static checkRateLimit(userId: string, operation: string): boolean {
    // TODO: Implementar rate limiting real con Redis o similar
    // Por ahora, retornamos true para permitir todas las operaciones
    return true
  }

  /**
   * Sanitiza datos de entrada para operaciones de personas
   */
  static sanitizePersonData(data: any): any {
    const sanitized = { ...data }

    // Sanitizar nombres
    if (sanitized.firstName) {
      sanitized.firstName = this.sanitizeName(sanitized.firstName)
    }
    if (sanitized.lastName) {
      sanitized.lastName = this.sanitizeName(sanitized.lastName)
    }
    if (sanitized.businessName) {
      sanitized.businessName = this.sanitizeName(sanitized.businessName)
    }

    // Sanitizar número de identificación
    if (sanitized.identificationNumber) {
      sanitized.identificationNumber = this.sanitizeIdentificationNumber(sanitized.identificationNumber)
    }

    // Sanitizar información de contacto
    if (sanitized.contactName) {
      sanitized.contactName = this.sanitizeName(sanitized.contactName)
    }
    if (sanitized.phone) {
      sanitized.phone = this.sanitizePhone(sanitized.phone)
    }

    // Sanitizar dirección
    if (sanitized.street) {
      sanitized.street = this.sanitizeAddress(sanitized.street)
    }
    if (sanitized.city) {
      sanitized.city = this.sanitizeAddress(sanitized.city)
    }

    return sanitized
  }

  /**
   * Sanitiza nombres y razones sociales
   */
  private static sanitizeName(name: string): string {
    return name
      .trim()
      .replace(/[<>\"'&]/g, '') // Remover caracteres peligrosos
      .replace(/\s+/g, ' ') // Normalizar espacios
      .substring(0, 200) // Limitar longitud
  }

  /**
   * Sanitiza números de identificación
   */
  private static sanitizeIdentificationNumber(idNumber: string): string {
    return idNumber
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') // Solo letras y números
      .substring(0, 50) // Limitar longitud
  }

  /**
   * Sanitiza números de teléfono
   */
  private static sanitizePhone(phone: string): string {
    return phone
      .trim()
      .replace(/[^\d+\-\s\(\)]/g, '') // Solo números, +, -, espacios, ()
      .substring(0, 20) // Limitar longitud
  }

  /**
   * Sanitiza direcciones
   */
  private static sanitizeAddress(address: string): string {
    return address
      .trim()
      .replace(/[<>\"'&]/g, '') // Remover caracteres peligrosos
      .replace(/\s+/g, ' ') // Normalizar espacios
      .substring(0, 200) // Limitar longitud
  }

  /**
   * Valida que los datos no contengan patrones sospechosos
   */
  static detectSuspiciousPatterns(data: any): string[] {
    const suspiciousPatterns: string[] = []
    const suspiciousRegexes = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i
    ]

    const checkValue = (value: any) => {
      if (typeof value === 'string') {
        for (const regex of suspiciousRegexes) {
          if (regex.test(value)) {
            suspiciousPatterns.push(`Suspicious pattern detected: ${regex.source}`)
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach(checkValue)
      }
    }

    checkValue(data)
    return suspiciousPatterns
  }

  /**
   * Log de intentos de inyección o patrones sospechosos
   */
  static logSuspiciousActivity(context: PersonSecurityContext, suspiciousPatterns: string[], data: any) {
    const clientInfo = getClientInfo(context.request)
    
    securityLogger.warn('Suspicious activity detected in person operations', {
      event: 'suspiciousActivity',
      userId: context.userId,
      tenantId: context.tenantId,
      personId: context.personId,
      operation: context.operation,
      suspiciousPatterns: suspiciousPatterns,
      data: data,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      endpoint: context.request.url,
      timestamp: new Date().toISOString()
    })
  }
}
