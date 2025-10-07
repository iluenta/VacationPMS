import { NextRequest, NextResponse } from "next/server"
import { auditLogger, getClientInfo } from "./logger"

// ============================================================================
// MIDDLEWARE DE AUDITORÍA
// ============================================================================

interface AuditConfig {
  logRequests?: boolean
  logResponses?: boolean
  logErrors?: boolean
  sensitiveEndpoints?: string[]
  excludeEndpoints?: string[]
}

const defaultConfig: AuditConfig = {
  logRequests: true,
  logResponses: false, // Por defecto no logear respuestas (puede ser muy verboso)
  logErrors: true,
  sensitiveEndpoints: [
    '/api/auth/',
    '/api/admin/',
    '/api/users/',
    '/api/configurations/'
  ],
  excludeEndpoints: [
    '/api/health',
    '/api/status'
  ]
}

/**
 * Middleware para logging de auditoría de requests
 */
export function auditMiddleware(
  request: NextRequest,
  response: NextResponse,
  config: AuditConfig = {}
) {
  const finalConfig = { ...defaultConfig, ...config }
  const clientInfo = getClientInfo(request)
  const url = new URL(request.url)
  const pathname = url.pathname
  const method = request.method

  // Verificar si el endpoint debe ser excluido
  if (finalConfig.excludeEndpoints?.some(endpoint => pathname.startsWith(endpoint))) {
    return response
  }

  // Verificar si es un endpoint sensible
  const isSensitiveEndpoint = finalConfig.sensitiveEndpoints?.some(endpoint => 
    pathname.startsWith(endpoint)
  )

  // Logear request si está configurado
  if (finalConfig.logRequests && isSensitiveEndpoint) {
    auditLogger.resourceCreated({
      userId: 'system', // Se actualizará con el usuario real si está disponible
      resourceType: 'api_request',
      resourceId: `${method}_${pathname}_${Date.now()}`,
      details: {
        method,
        pathname,
        query: Object.fromEntries(url.searchParams.entries()),
        userAgent: clientInfo.userAgent,
        ip: clientInfo.ip,
        referer: clientInfo.referer,
        timestamp: new Date().toISOString()
      }
    })
  }

  return response
}

/**
 * Logear error de API
 */
export function logApiError(
  request: NextRequest,
  error: Error,
  statusCode: number,
  userId?: string
) {
  const clientInfo = getClientInfo(request)
  const url = new URL(request.url)

  auditLogger.resourceCreated({
    userId: userId || 'unknown',
    resourceType: 'api_error',
    resourceId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    details: {
      method: request.method,
      pathname: url.pathname,
      statusCode,
      error: error.message,
      stack: error.stack,
      userAgent: clientInfo.userAgent,
      ip: clientInfo.ip,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Logear acceso a datos sensibles
 */
export function logSensitiveDataAccess(
  userId: string,
  dataType: string,
  recordId?: string,
  reason: string = 'User request'
) {
  auditLogger.sensitiveDataAccess({
    userId,
    dataType,
    recordId,
    reason
  })
}

/**
 * Logear exportación de datos
 */
export function logDataExport(
  userId: string,
  exportType: string,
  recordCount: number,
  format: string = 'json'
) {
  auditLogger.dataExport({
    userId,
    exportType,
    recordCount,
    format
  })
}

/**
 * Logear modificación de recursos
 */
export function logResourceModification(
  userId: string,
  resourceType: string,
  resourceId: string,
  oldValues: any,
  newValues: any
) {
  auditLogger.resourceModified({
    userId,
    resourceType,
    resourceId,
    oldValues,
    newValues
  })
}

/**
 * Logear eliminación de recursos
 */
export function logResourceDeletion(
  userId: string,
  resourceType: string,
  resourceId: string,
  details: any
) {
  auditLogger.resourceDeleted({
    userId,
    resourceType,
    resourceId,
    details
  })
}

// ============================================================================
// HOOKS PARA COMPONENTES REACT
// ============================================================================

/**
 * Hook para logging de acciones de usuario en el frontend
 */
export function useAuditLog() {
  const logUserAction = (action: string, details: any) => {
    // Enviar al backend para logging
    fetch('/api/audit/user-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        details,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      console.error('Error logging user action:', error)
    })
  }

  const logPageView = (page: string, duration?: number) => {
    logUserAction('page_view', {
      page,
      duration,
      timestamp: new Date().toISOString()
    })
  }

  const logButtonClick = (buttonId: string, context?: any) => {
    logUserAction('button_click', {
      buttonId,
      context,
      timestamp: new Date().toISOString()
    })
  }

  const logFormSubmission = (formId: string, success: boolean, errors?: any) => {
    logUserAction('form_submission', {
      formId,
      success,
      errors,
      timestamp: new Date().toISOString()
    })
  }

  const logSearch = (query: string, resultsCount: number, filters?: any) => {
    logUserAction('search', {
      query,
      resultsCount,
      filters,
      timestamp: new Date().toISOString()
    })
  }

  const logDownload = (fileType: string, fileName: string, fileSize?: number) => {
    logUserAction('download', {
      fileType,
      fileName,
      fileSize,
      timestamp: new Date().toISOString()
    })
  }

  return {
    logUserAction,
    logPageView,
    logButtonClick,
    logFormSubmission,
    logSearch,
    logDownload
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Crear contexto de auditoría
 */
export function createAuditContext(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string
) {
  return {
    userId,
    action,
    resourceType,
    resourceId,
    timestamp: new Date().toISOString()
  }
}

/**
 * Sanitizar datos para logging (remover información sensible)
 */
export function sanitizeForLogging(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session'
  ]

  const sanitized = { ...data }

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  }

  // Sanitizar objetos anidados
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key])
    }
  }

  return sanitized
}

/**
 * Verificar si un endpoint requiere logging de auditoría
 */
export function requiresAuditLogging(pathname: string, config: AuditConfig = defaultConfig): boolean {
  // Verificar exclusiones
  if (config.excludeEndpoints?.some(endpoint => pathname.startsWith(endpoint))) {
    return false
  }

  // Verificar si es endpoint sensible
  return config.sensitiveEndpoints?.some(endpoint => pathname.startsWith(endpoint)) || false
}

// ============================================================================
// FIN DEL ARCHIVO
// ============================================================================
