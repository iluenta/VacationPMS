import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'

// ============================================================================
// CONFIGURACIÓN DE LOGGING
// ============================================================================

// Niveles de log personalizados
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  security: 3,  // Nivel especial para eventos de seguridad
  audit: 4,     // Nivel para auditoría
  debug: 5
}

// Colores para cada nivel
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  security: 'magenta',
  audit: 'cyan',
  debug: 'blue'
}

winston.addColors(logColors)

// Formato personalizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`
  })
)

// Formato para consola (más legible)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ''
    return `${timestamp} ${level}: ${message}${metaStr}`
  })
)

// ============================================================================
// CONFIGURACIÓN DE TRANSPORTS
// ============================================================================

// Directorio de logs
const logsDir = path.join(process.cwd(), 'logs')

// Transport para logs generales
const generalTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'general-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info',
  format: logFormat
})

// Transport para logs de seguridad
const securityTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'security-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d', // Mantener logs de seguridad por más tiempo
  level: 'security',
  format: logFormat
})

// Transport para logs de auditoría
const auditTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'audit-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '90d', // Mantener logs de auditoría por mucho tiempo
  level: 'audit',
  format: logFormat
})

// Transport para errores
const errorTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: logFormat
})

// ============================================================================
// CREAR LOGGER PRINCIPAL
// ============================================================================

const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: {
    service: 'pms-api',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    generalTransport,
    securityTransport,
    auditTransport,
    errorTransport
  ]
})

// Agregar transporte de consola solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }))
}

// ============================================================================
// LOGGER ESPECIALIZADO PARA SEGURIDAD
// ============================================================================

export const securityLogger = {
  // Log de intentos de autenticación
  authAttempt: (data: {
    userId?: string
    email?: string
    ip: string
    userAgent: string
    success: boolean
    reason?: string
  }) => {
    logger.log('security', 'Authentication attempt', {
      event: 'auth_attempt',
      ...data,
      timestamp: new Date().toISOString()
    })
  },

  // Log de rate limiting
  rateLimitExceeded: (data: {
    ip: string
    userAgent: string
    endpoint: string
    method: string
    limit: number
    window: string
  }) => {
    logger.log('security', 'Rate limit exceeded', {
      event: 'rate_limit_exceeded',
      ...data,
      timestamp: new Date().toISOString()
    })
  },

  // Log de intentos de XSS
  xssAttempt: (data: {
    ip: string
    userAgent: string
    endpoint: string
    payload: string
    sanitized: boolean
  }) => {
    logger.log('security', 'XSS attempt detected', {
      event: 'xss_attempt',
      ...data,
      timestamp: new Date().toISOString()
    })
  },

  // Log de intentos de SQL Injection
  sqlInjectionAttempt: (data: {
    ip: string
    userAgent: string
    endpoint: string
    payload: string
    blocked: boolean
  }) => {
    logger.log('security', 'SQL injection attempt detected', {
      event: 'sql_injection_attempt',
      ...data,
      timestamp: new Date().toISOString()
    })
  },

  // Log de acceso a archivos
  fileAccess: (data: {
    userId?: string
    ip: string
    filename: string
    action: 'upload' | 'download' | 'delete'
    success: boolean
    reason?: string
  }) => {
    logger.log('security', 'File access', {
      event: 'file_access',
      ...data,
      timestamp: new Date().toISOString()
    })
  },

  // Log de cambios de permisos
  permissionChange: (data: {
    adminId: string
    targetUserId: string
    oldPermissions: string[]
    newPermissions: string[]
    reason?: string
  }) => {
    logger.log('security', 'Permission change', {
      event: 'permission_change',
      ...data,
      timestamp: new Date().toISOString()
    })
  },

  // Log de configuración de seguridad
  securityConfigChange: (data: {
    adminId: string
    configType: string
    oldValue: any
    newValue: any
    reason?: string
  }) => {
    logger.log('security', 'Security configuration change', {
      event: 'security_config_change',
      ...data,
      timestamp: new Date().toISOString()
    })
  }
}

// ============================================================================
// LOGGER ESPECIALIZADO PARA AUDITORÍA
// ============================================================================

export const auditLogger = {
  // Log de creación de recursos
  resourceCreated: (data: {
    userId: string
    resourceType: string
    resourceId: string
    details: any
  }) => {
    logger.log('audit', 'Resource created', {
      event: 'resource_created',
      ...data,
      timestamp: new Date().toISOString()
    })
  },

  // Log de modificación de recursos
  resourceModified: (data: {
    userId: string
    resourceType: string
    resourceId: string
    oldValues: any
    newValues: any
  }) => {
    logger.log('audit', 'Resource modified', {
      event: 'resource_modified',
      ...data,
      timestamp: new Date().toISOString()
    })
  },

  // Log de eliminación de recursos
  resourceDeleted: (data: {
    userId: string
    resourceType: string
    resourceId: string
    details: any
  }) => {
    logger.log('audit', 'Resource deleted', {
      event: 'resource_deleted',
      ...data,
      timestamp: new Date().toISOString()
    })
  },

  // Log de acceso a datos sensibles
  sensitiveDataAccess: (data: {
    userId: string
    dataType: string
    recordId?: string
    reason: string
  }) => {
    logger.log('audit', 'Sensitive data access', {
      event: 'sensitive_data_access',
      ...data,
      timestamp: new Date().toISOString()
    })
  },

  // Log de exportación de datos
  dataExport: (data: {
    userId: string
    exportType: string
    recordCount: number
    format: string
  }) => {
    logger.log('audit', 'Data export', {
      event: 'data_export',
      ...data,
      timestamp: new Date().toISOString()
    })
  }
}

// ============================================================================
// LOGGER GENERAL
// ============================================================================

export const appLogger = {
  error: (message: string, meta?: any) => {
    logger.error(message, meta)
  },

  warn: (message: string, meta?: any) => {
    logger.warn(message, meta)
  },

  info: (message: string, meta?: any) => {
    logger.info(message, meta)
  },

  debug: (message: string, meta?: any) => {
    logger.debug(message, meta)
  },

  // Log de performance
  performance: (data: {
    operation: string
    duration: number
    endpoint?: string
    userId?: string
  }) => {
    logger.info('Performance metric', {
      event: 'performance',
      ...data,
      timestamp: new Date().toISOString()
    })
  },

  // Log de errores de API
  apiError: (data: {
    endpoint: string
    method: string
    statusCode: number
    error: string
    userId?: string
    ip?: string
  }) => {
    logger.error('API error', {
      event: 'api_error',
      ...data,
      timestamp: new Date().toISOString()
    })
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Obtiene información del cliente desde el request
 */
export function getClientInfo(request: Request): {
  ip: string
  userAgent: string
  referer?: string
} {
  const headers = request.headers as any
  
  return {
    ip: headers.get('x-forwarded-for')?.split(',')[0] || 
        headers.get('x-real-ip') || 
        headers.get('cf-connecting-ip') || 
        'unknown',
    userAgent: headers.get('user-agent') || 'unknown',
    referer: headers.get('referer') || undefined
  }
}

/**
 * Crea un contexto de logging con información del usuario
 */
export function createLogContext(userId?: string, additionalData?: any) {
  return {
    userId,
    timestamp: new Date().toISOString(),
    ...additionalData
  }
}

// ============================================================================
// EXPORTAR LOGGER PRINCIPAL
// ============================================================================

export default logger
