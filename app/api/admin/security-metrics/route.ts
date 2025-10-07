import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSecurityMetrics, getAlertSystem } from "@/lib/logging/alerts"
import { appLogger } from "@/lib/logging/logger"
import fs from 'fs/promises'
import path from 'path'

// ============================================================================
// GET /api/admin/security-metrics - Obtener métricas de seguridad
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el usuario sea admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 })
    }

    if (!profile.is_admin) {
      return NextResponse.json({ error: "Acceso denegado - se requieren permisos de administrador" }, { status: 403 })
    }

    // Obtener métricas de seguridad
    const securityMetrics = await getSecurityMetricsData()
    
    // Logear acceso a métricas de seguridad
    appLogger.info('Security metrics accessed', {
      userId: user.id,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      data: securityMetrics,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    appLogger.error('Error getting security metrics', { error: error.message })
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// ============================================================================
// FUNCIONES DE MÉTRICAS
// ============================================================================

async function getSecurityMetricsData() {
  const alertSystem = getAlertSystem()
  
  // Métricas de alertas
  const alertMetrics = getSecurityMetrics()
  
  // Métricas de logs
  const logMetrics = await getLogMetrics()
  
  // Métricas de rate limiting
  const rateLimitMetrics = await getRateLimitMetrics()
  
  // Métricas de autenticación
  const authMetrics = await getAuthMetrics()
  
  // Métricas de archivos
  const fileMetrics = await getFileMetrics()

  return {
    alerts: alertMetrics,
    logs: logMetrics,
    rateLimiting: rateLimitMetrics,
    authentication: authMetrics,
    files: fileMetrics,
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }
  }
}

async function getLogMetrics() {
  try {
    const logsDir = path.join(process.cwd(), 'logs')
    const today = new Date().toISOString().split('T')[0]
    
    const metrics = {
      totalLogs: 0,
      securityLogs: 0,
      errorLogs: 0,
      auditLogs: 0,
      logFiles: [] as any[]
    }

    // Leer archivos de log del día actual
    const logFiles = [
      `general-${today}.log`,
      `security-${today}.log`,
      `error-${today}.log`,
      `audit-${today}.log`
    ]

    for (const logFile of logFiles) {
      const filePath = path.join(logsDir, logFile)
      
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const lines = content.split('\n').filter(line => line.trim())
        
        metrics.totalLogs += lines.length
        
        if (logFile.includes('security')) {
          metrics.securityLogs = lines.length
        } else if (logFile.includes('error')) {
          metrics.errorLogs = lines.length
        } else if (logFile.includes('audit')) {
          metrics.auditLogs = lines.length
        }

        metrics.logFiles.push({
          name: logFile,
          size: content.length,
          lines: lines.length,
          lastModified: (await fs.stat(filePath)).mtime
        })
      } catch (error) {
        // Archivo no existe
        metrics.logFiles.push({
          name: logFile,
          size: 0,
          lines: 0,
          lastModified: null
        })
      }
    }

    return metrics
  } catch (error) {
    appLogger.error('Error getting log metrics', { error: error.message })
    return {
      totalLogs: 0,
      securityLogs: 0,
      errorLogs: 0,
      auditLogs: 0,
      logFiles: []
    }
  }
}

async function getRateLimitMetrics() {
  try {
    const logsDir = path.join(process.cwd(), 'logs')
    const today = new Date().toISOString().split('T')[0]
    const securityLogFile = path.join(logsDir, `security-${today}.log`)
    
    let rateLimitEvents = 0
    const ipCounts: Record<string, number> = {}
    const endpointCounts: Record<string, number> = {}

    try {
      const content = await fs.readFile(securityLogFile, 'utf-8')
      const lines = content.split('\n').filter(line => line.trim())
      
      lines.forEach(line => {
        try {
          const logEntry = JSON.parse(line)
          if (logEntry.event === 'rate_limit_exceeded') {
            rateLimitEvents++
            
            // Contar por IP
            if (logEntry.ip) {
              ipCounts[logEntry.ip] = (ipCounts[logEntry.ip] || 0) + 1
            }
            
            // Contar por endpoint
            if (logEntry.endpoint) {
              endpointCounts[logEntry.endpoint] = (endpointCounts[logEntry.endpoint] || 0) + 1
            }
          }
        } catch (e) {
          // Ignorar líneas que no son JSON válido
        }
      })
    } catch (error) {
      // Archivo no existe
    }

    // Top IPs y endpoints
    const topIPs = Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }))

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }))

    return {
      totalEvents: rateLimitEvents,
      topIPs,
      topEndpoints,
      uniqueIPs: Object.keys(ipCounts).length,
      uniqueEndpoints: Object.keys(endpointCounts).length
    }
  } catch (error) {
    appLogger.error('Error getting rate limit metrics', { error: error.message })
    return {
      totalEvents: 0,
      topIPs: [],
      topEndpoints: [],
      uniqueIPs: 0,
      uniqueEndpoints: 0
    }
  }
}

async function getAuthMetrics() {
  try {
    const logsDir = path.join(process.cwd(), 'logs')
    const today = new Date().toISOString().split('T')[0]
    const securityLogFile = path.join(logsDir, `security-${today}.log`)
    
    let totalAttempts = 0
    let successfulAttempts = 0
    let failedAttempts = 0
    const ipCounts: Record<string, { success: number, failed: number }> = {}

    try {
      const content = await fs.readFile(securityLogFile, 'utf-8')
      const lines = content.split('\n').filter(line => line.trim())
      
      lines.forEach(line => {
        try {
          const logEntry = JSON.parse(line)
          if (logEntry.event === 'auth_attempt') {
            totalAttempts++
            
            if (logEntry.success) {
              successfulAttempts++
            } else {
              failedAttempts++
            }
            
            // Contar por IP
            if (logEntry.ip) {
              if (!ipCounts[logEntry.ip]) {
                ipCounts[logEntry.ip] = { success: 0, failed: 0 }
              }
              
              if (logEntry.success) {
                ipCounts[logEntry.ip].success++
              } else {
                ipCounts[logEntry.ip].failed++
              }
            }
          }
        } catch (e) {
          // Ignorar líneas que no son JSON válido
        }
      })
    } catch (error) {
      // Archivo no existe
    }

    // Top IPs con más intentos fallidos
    const topFailedIPs = Object.entries(ipCounts)
      .filter(([, counts]) => counts.failed > 0)
      .sort(([,a], [,b]) => b.failed - a.failed)
      .slice(0, 10)
      .map(([ip, counts]) => ({ ip, ...counts }))

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      successRate: totalAttempts > 0 ? (successfulAttempts / totalAttempts * 100).toFixed(2) : 0,
      topFailedIPs,
      uniqueIPs: Object.keys(ipCounts).length
    }
  } catch (error) {
    appLogger.error('Error getting auth metrics', { error: error.message })
    return {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      successRate: 0,
      topFailedIPs: [],
      uniqueIPs: 0
    }
  }
}

async function getFileMetrics() {
  try {
    const logsDir = path.join(process.cwd(), 'logs')
    const today = new Date().toISOString().split('T')[0]
    const securityLogFile = path.join(logsDir, `security-${today}.log`)
    
    let totalFileAccess = 0
    let uploads = 0
    let downloads = 0
    let deletes = 0
    const userCounts: Record<string, number> = {}
    const fileTypeCounts: Record<string, number> = {}

    try {
      const content = await fs.readFile(securityLogFile, 'utf-8')
      const lines = content.split('\n').filter(line => line.trim())
      
      lines.forEach(line => {
        try {
          const logEntry = JSON.parse(line)
          if (logEntry.event === 'file_access') {
            totalFileAccess++
            
            // Contar por acción
            if (logEntry.action === 'upload') uploads++
            else if (logEntry.action === 'download') downloads++
            else if (logEntry.action === 'delete') deletes++
            
            // Contar por usuario
            if (logEntry.userId) {
              userCounts[logEntry.userId] = (userCounts[logEntry.userId] || 0) + 1
            }
            
            // Contar por tipo de archivo
            if (logEntry.filename) {
              const extension = logEntry.filename.split('.').pop()?.toLowerCase()
              if (extension) {
                fileTypeCounts[extension] = (fileTypeCounts[extension] || 0) + 1
              }
            }
          }
        } catch (e) {
          // Ignorar líneas que no son JSON válido
        }
      })
    } catch (error) {
      // Archivo no existe
    }

    // Top usuarios y tipos de archivo
    const topUsers = Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }))

    const topFileTypes = Object.entries(fileTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }))

    return {
      totalFileAccess,
      uploads,
      downloads,
      deletes,
      topUsers,
      topFileTypes,
      uniqueUsers: Object.keys(userCounts).length
    }
  } catch (error) {
    appLogger.error('Error getting file metrics', { error: error.message })
    return {
      totalFileAccess: 0,
      uploads: 0,
      downloads: 0,
      deletes: 0,
      topUsers: [],
      topFileTypes: [],
      uniqueUsers: 0
    }
  }
}
