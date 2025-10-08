import { auditLogger } from './logger'
import { PersonId } from '../domain/value-objects/PersonId'
import { TenantId } from '../domain/value-objects/TenantId'
import { UserId } from '../domain/value-objects/UserId'

/**
 * Audit logging específico para operaciones de Person Management
 */

export interface PersonAuditContext {
  userId: string
  tenantId?: string
  personId?: string
  ip?: string
  userAgent?: string
  endpoint?: string
}

export class PersonAuditLogger {
  /**
   * Log cuando se crea una nueva persona
   */
  static personCreated(context: PersonAuditContext, personData: any) {
    auditLogger.info('Person created', {
      event: 'personCreated',
      userId: context.userId,
      tenantId: context.tenantId,
      personId: context.personId,
      personData: {
        firstName: personData.firstName,
        lastName: personData.lastName,
        businessName: personData.businessName,
        identificationType: personData.identificationType,
        personCategory: personData.personCategory
      },
      ip: context.ip,
      userAgent: context.userAgent,
      endpoint: context.endpoint,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log cuando se actualiza una persona
   */
  static personUpdated(context: PersonAuditContext, personId: string, changes: any) {
    auditLogger.info('Person updated', {
      event: 'personUpdated',
      userId: context.userId,
      tenantId: context.tenantId,
      personId: personId,
      changes: changes,
      ip: context.ip,
      userAgent: context.userAgent,
      endpoint: context.endpoint,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log cuando se elimina una persona
   */
  static personDeleted(context: PersonAuditContext, personId: string, personData: any) {
    auditLogger.warn('Person deleted', {
      event: 'personDeleted',
      userId: context.userId,
      tenantId: context.tenantId,
      personId: personId,
      deletedPersonData: {
        firstName: personData.firstName,
        lastName: personData.lastName,
        businessName: personData.businessName,
        identificationType: personData.identificationType
      },
      ip: context.ip,
      userAgent: context.userAgent,
      endpoint: context.endpoint,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log cuando se accede a información de personas
   */
  static personsAccessed(context: PersonAuditContext, filters: any, resultCount: number) {
    auditLogger.info('Persons accessed', {
      event: 'personsAccessed',
      userId: context.userId,
      tenantId: context.tenantId,
      filters: filters,
      resultCount: resultCount,
      ip: context.ip,
      userAgent: context.userAgent,
      endpoint: context.endpoint,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log cuando se accede a una persona específica
   */
  static personAccessed(context: PersonAuditContext, personId: string) {
    auditLogger.info('Person accessed', {
      event: 'personAccessed',
      userId: context.userId,
      tenantId: context.tenantId,
      personId: personId,
      ip: context.ip,
      userAgent: context.userAgent,
      endpoint: context.endpoint,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log cuando se crea información de contacto
   */
  static contactInfoCreated(context: PersonAuditContext, personId: string, contactData: any) {
    auditLogger.info('Contact info created', {
      event: 'contactInfoCreated',
      userId: context.userId,
      tenantId: context.tenantId,
      personId: personId,
      contactData: {
        contactName: contactData.contactName,
        email: contactData.email,
        phone: contactData.phone,
        isPrimary: contactData.isPrimary
      },
      ip: context.ip,
      userAgent: context.userAgent,
      endpoint: context.endpoint,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log cuando se crea dirección fiscal
   */
  static fiscalAddressCreated(context: PersonAuditContext, personId: string, addressData: any) {
    auditLogger.info('Fiscal address created', {
      event: 'fiscalAddressCreated',
      userId: context.userId,
      tenantId: context.tenantId,
      personId: personId,
      addressData: {
        street: addressData.street,
        city: addressData.city,
        postalCode: addressData.postalCode,
        country: addressData.country
      },
      ip: context.ip,
      userAgent: context.userAgent,
      endpoint: context.endpoint,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log de errores en operaciones de personas
   */
  static personOperationError(context: PersonAuditContext, operation: string, error: Error) {
    auditLogger.error('Person operation error', {
      event: 'personOperationError',
      userId: context.userId,
      tenantId: context.tenantId,
      personId: context.personId,
      operation: operation,
      error: {
        message: error.message,
        stack: error.stack
      },
      ip: context.ip,
      userAgent: context.userAgent,
      endpoint: context.endpoint,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log de intentos de acceso no autorizado
   */
  static unauthorizedAccess(context: PersonAuditContext, operation: string) {
    auditLogger.warn('Unauthorized access attempt', {
      event: 'unauthorizedAccess',
      userId: context.userId,
      tenantId: context.tenantId,
      personId: context.personId,
      operation: operation,
      ip: context.ip,
      userAgent: context.userAgent,
      endpoint: context.endpoint,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log de validaciones fallidas
   */
  static validationFailed(context: PersonAuditContext, validationErrors: any[]) {
    auditLogger.warn('Person validation failed', {
      event: 'personValidationFailed',
      userId: context.userId,
      tenantId: context.tenantId,
      personId: context.personId,
      validationErrors: validationErrors,
      ip: context.ip,
      userAgent: context.userAgent,
      endpoint: context.endpoint,
      timestamp: new Date().toISOString()
    })
  }
}
