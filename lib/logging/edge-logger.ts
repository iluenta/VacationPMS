// ============================================================================
// LOGGER COMPATIBLE CON EDGE RUNTIME
// ============================================================================
// Este logger es compatible con Edge Runtime y no usa módulos de Node.js

/**
 * Logger simplificado para Edge Runtime
 * No usa archivos, solo console.log con formato estructurado
 */

interface LogEntry {
  timestamp: string
  level: string
  message: string
  meta?: any
}

class EdgeLogger {
  private formatLog(level: string, message: string, meta?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta
    }
  }

  private log(level: string, message: string, meta?: any) {
    const logEntry = this.formatLog(level, message, meta)
    
    // En Edge Runtime, solo podemos usar console.log
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${logEntry.timestamp}] [${level.toUpperCase()}]: ${message}`, meta || '')
    } else {
      // En producción, usar console.log con formato JSON
      console.log(JSON.stringify(logEntry))
    }
  }

  error(message: string, meta?: any) {
    this.log('error', message, meta)
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta)
  }

  info(message: string, meta?: any) {
    this.log('info', message, meta)
  }

  security(message: string, meta?: any) {
    this.log('security', message, meta)
  }

  audit(message: string, meta?: any) {
    this.log('audit', message, meta)
  }

  debug(message: string, meta?: any) {
    this.log('debug', message, meta)
  }
}

// Instancia singleton
const edgeLogger = new EdgeLogger()

// ============================================================================
// FUNCIONES ESPECIALIZADAS PARA SEGURIDAD
// ============================================================================

export const securityLogger = {
  // Log de rate limiting
  rateLimitExceeded: (data: {
    ip: string
    userAgent: string
    endpoint: string
    method: string
    limit: number
    window: string
  }) => {
    edgeLogger.security('Rate limit exceeded', {
      event: 'rate_limit_exceeded',
      ...data
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
    edgeLogger.security('XSS attempt detected', {
      event: 'xss_attempt',
      ...data
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
    edgeLogger.security('SQL injection attempt detected', {
      event: 'sql_injection_attempt',
      ...data
    })
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Obtiene información del cliente desde el request (compatible con Edge Runtime)
 */
export function getClientInfo(request: Request): {
  ip: string
  userAgent: string
  referer?: string
} {
  // En Edge Runtime, no podemos usar request.headers como Map
  // Necesitamos acceder a los headers de forma diferente
  
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

// ============================================================================
// EXPORTAR
// ============================================================================

export default edgeLogger
