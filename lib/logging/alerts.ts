import cron from 'node-cron'
import { securityLogger, appLogger } from './logger'
import fs from 'fs/promises'
import path from 'path'

// ============================================================================
// CONFIGURACIÓN DE ALERTAS
// ============================================================================

interface AlertRule {
  id: string
  name: string
  description: string
  condition: (logs: any[]) => boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  cooldownMinutes: number
  lastTriggered?: Date
}

interface Alert {
  id: string
  ruleId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details: any
  timestamp: Date
  resolved?: boolean
  resolvedAt?: Date
}

// ============================================================================
// REGLAS DE ALERTAS
// ============================================================================

const alertRules: AlertRule[] = [
  {
    id: 'rate_limit_spike',
    name: 'Spike de Rate Limiting',
    description: 'Múltiples intentos de rate limiting en poco tiempo',
    condition: (logs) => {
      const rateLimitLogs = logs.filter(log => log.event === 'rate_limit_exceeded')
      const last5Minutes = new Date(Date.now() - 5 * 60 * 1000)
      const recentLogs = rateLimitLogs.filter(log => new Date(log.timestamp) > last5Minutes)
      
      // Agrupar por IP
      const ipCounts = recentLogs.reduce((acc, log) => {
        acc[log.ip] = (acc[log.ip] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      // Alertar si alguna IP tiene más de 10 intentos en 5 minutos
      return Object.values(ipCounts).some(count => count > 10)
    },
    severity: 'medium',
    cooldownMinutes: 15
  },
  
  {
    id: 'xss_attempts',
    name: 'Intentos de XSS',
    description: 'Múltiples intentos de XSS detectados',
    condition: (logs) => {
      const xssLogs = logs.filter(log => log.event === 'xss_attempt')
      const last10Minutes = new Date(Date.now() - 10 * 60 * 1000)
      const recentLogs = xssLogs.filter(log => new Date(log.timestamp) > last10Minutes)
      
      return recentLogs.length > 5
    },
    severity: 'high',
    cooldownMinutes: 30
  },
  
  {
    id: 'sql_injection_attempts',
    name: 'Intentos de SQL Injection',
    description: 'Múltiples intentos de SQL injection detectados',
    condition: (logs) => {
      const sqlLogs = logs.filter(log => log.event === 'sql_injection_attempt')
      const last10Minutes = new Date(Date.now() - 10 * 60 * 1000)
      const recentLogs = sqlLogs.filter(log => new Date(log.timestamp) > last10Minutes)
      
      return recentLogs.length > 3
    },
    severity: 'high',
    cooldownMinutes: 30
  },
  
  {
    id: 'failed_auth_spike',
    name: 'Spike de Autenticaciones Fallidas',
    description: 'Muchos intentos de autenticación fallidos',
    condition: (logs) => {
      const authLogs = logs.filter(log => log.event === 'auth_attempt' && !log.success)
      const last15Minutes = new Date(Date.now() - 15 * 60 * 1000)
      const recentLogs = authLogs.filter(log => new Date(log.timestamp) > last15Minutes)
      
      // Agrupar por IP
      const ipCounts = recentLogs.reduce((acc, log) => {
        acc[log.ip] = (acc[log.ip] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      // Alertar si alguna IP tiene más de 20 intentos fallidos en 15 minutos
      return Object.values(ipCounts).some(count => count > 20)
    },
    severity: 'high',
    cooldownMinutes: 30
  },
  
  {
    id: 'suspicious_file_access',
    name: 'Acceso Sospechoso a Archivos',
    description: 'Múltiples accesos a archivos desde la misma IP',
    condition: (logs) => {
      const fileLogs = logs.filter(log => log.event === 'file_access')
      const last30Minutes = new Date(Date.now() - 30 * 60 * 1000)
      const recentLogs = fileLogs.filter(log => new Date(log.timestamp) > last30Minutes)
      
      // Agrupar por IP
      const ipCounts = recentLogs.reduce((acc, log) => {
        acc[log.ip] = (acc[log.ip] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      // Alertar si alguna IP accede a más de 50 archivos en 30 minutos
      return Object.values(ipCounts).some(count => count > 50)
    },
    severity: 'medium',
    cooldownMinutes: 60
  },
  
  {
    id: 'admin_privilege_escalation',
    name: 'Escalación de Privilegios de Admin',
    description: 'Cambios sospechosos en permisos de administrador',
    condition: (logs) => {
      const permissionLogs = logs.filter(log => log.event === 'permission_change')
      const last60Minutes = new Date(Date.now() - 60 * 60 * 1000)
      const recentLogs = permissionLogs.filter(log => new Date(log.timestamp) > last60Minutes)
      
      // Alertar si hay más de 3 cambios de permisos en 1 hora
      return recentLogs.length > 3
    },
    severity: 'critical',
    cooldownMinutes: 120
  }
]

// ============================================================================
// SISTEMA DE ALERTAS
// ============================================================================

class AlertSystem {
  private alerts: Alert[] = []
  private alertsFile: string

  constructor() {
    this.alertsFile = path.join(process.cwd(), 'logs', 'alerts.json')
    this.loadAlerts()
    this.startMonitoring()
  }

  // Cargar alertas desde archivo
  private async loadAlerts() {
    try {
      const data = await fs.readFile(this.alertsFile, 'utf-8')
      this.alerts = JSON.parse(data)
    } catch (error) {
      // Archivo no existe o está corrupto, empezar con array vacío
      this.alerts = []
    }
  }

  // Guardar alertas en archivo
  private async saveAlerts() {
    try {
      await fs.mkdir(path.dirname(this.alertsFile), { recursive: true })
      await fs.writeFile(this.alertsFile, JSON.stringify(this.alerts, null, 2))
    } catch (error) {
      appLogger.error('Error saving alerts', { error: error.message })
    }
  }

  // Crear nueva alerta
  private createAlert(rule: AlertRule, details: any): Alert {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      severity: rule.severity,
      message: `${rule.name}: ${rule.description}`,
      details,
      timestamp: new Date(),
      resolved: false
    }

    this.alerts.push(alert)
    this.saveAlerts()

    // Logear la alerta
    appLogger.warn(`Security Alert: ${alert.message}`, {
      alertId: alert.id,
      severity: alert.severity,
      details: alert.details
    })

    return alert
  }

  // Verificar si una regla está en cooldown
  private isRuleInCooldown(rule: AlertRule): boolean {
    if (!rule.lastTriggered) return false
    
    const cooldownMs = rule.cooldownMinutes * 60 * 1000
    return Date.now() - rule.lastTriggered.getTime() < cooldownMs
  }

  // Evaluar reglas de alertas
  private async evaluateRules() {
    try {
      // Leer logs recientes (últimas 2 horas)
      const logsDir = path.join(process.cwd(), 'logs')
      const recentLogs: any[] = []

      // Leer archivos de log de seguridad
      const securityLogFile = path.join(logsDir, `security-${new Date().toISOString().split('T')[0]}.log`)
      
      try {
        const logContent = await fs.readFile(securityLogFile, 'utf-8')
        const logLines = logContent.split('\n').filter(line => line.trim())
        
        logLines.forEach(line => {
          try {
            const logEntry = JSON.parse(line)
            recentLogs.push(logEntry)
          } catch (e) {
            // Ignorar líneas que no son JSON válido
          }
        })
      } catch (error) {
        // Archivo de log no existe aún
      }

      // Evaluar cada regla
      for (const rule of alertRules) {
        if (this.isRuleInCooldown(rule)) {
          continue
        }

        if (rule.condition(recentLogs)) {
          // Crear alerta
          const alert = this.createAlert(rule, {
            logsCount: recentLogs.length,
            timeWindow: '2 hours',
            triggeredAt: new Date().toISOString()
          })

          // Actualizar último trigger
          rule.lastTriggered = new Date()

          // Enviar notificación (implementar según necesidades)
          await this.sendNotification(alert)
        }
      }
    } catch (error) {
      appLogger.error('Error evaluating alert rules', { error: error.message })
    }
  }

  // Enviar notificación de alerta
  private async sendNotification(alert: Alert) {
    // Implementar según necesidades (email, Slack, webhook, etc.)
    appLogger.info(`Alert notification sent`, {
      alertId: alert.id,
      severity: alert.severity,
      message: alert.message
    })

    // Por ahora, solo logear
    // TODO: Implementar notificaciones reales
  }

  // Iniciar monitoreo
  private startMonitoring() {
    // Evaluar reglas cada 5 minutos
    cron.schedule('*/5 * * * *', () => {
      this.evaluateRules()
    })

    appLogger.info('Security alert system started', {
      rulesCount: alertRules.length,
      monitoringInterval: '5 minutes'
    })
  }

  // Obtener alertas activas
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  // Obtener alertas por severidad
  getAlertsBySeverity(severity: Alert['severity']): Alert[] {
    return this.alerts.filter(alert => alert.severity === severity)
  }

  // Resolver alerta
  async resolveAlert(alertId: string, resolvedBy: string) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = new Date()
      
      await this.saveAlerts()
      
      appLogger.info('Alert resolved', {
        alertId: alert.id,
        resolvedBy,
        resolvedAt: alert.resolvedAt
      })
    }
  }

  // Obtener estadísticas de alertas
  getAlertStats() {
    const total = this.alerts.length
    const active = this.alerts.filter(a => !a.resolved).length
    const resolved = this.alerts.filter(a => a.resolved).length
    
    const bySeverity = this.alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      active,
      resolved,
      bySeverity,
      lastAlert: this.alerts.length > 0 ? this.alerts[this.alerts.length - 1].timestamp : null
    }
  }
}

// ============================================================================
// INSTANCIA SINGLETON
// ============================================================================

let alertSystemInstance: AlertSystem | null = null

export function getAlertSystem(): AlertSystem {
  if (!alertSystemInstance) {
    alertSystemInstance = new AlertSystem()
  }
  return alertSystemInstance
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Crear alerta manual
 */
export function createManualAlert(
  severity: Alert['severity'],
  message: string,
  details: any
): Alert {
  const alertSystem = getAlertSystem()
  const alert: Alert = {
    id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ruleId: 'manual',
    severity,
    message,
    details,
    timestamp: new Date(),
    resolved: false
  }

  alertSystem['alerts'].push(alert)
  alertSystem['saveAlerts']()

  appLogger.warn(`Manual Security Alert: ${message}`, {
    alertId: alert.id,
    severity: alert.severity,
    details: alert.details
  })

  return alert
}

/**
 * Obtener métricas de seguridad
 */
export function getSecurityMetrics() {
  const alertSystem = getAlertSystem()
  return {
    alerts: alertSystem.getAlertStats(),
    rules: alertRules.map(rule => ({
      id: rule.id,
      name: rule.name,
      severity: rule.severity,
      lastTriggered: rule.lastTriggered,
      inCooldown: alertSystem['isRuleInCooldown'](rule)
    }))
  }
}

// ============================================================================
// EXPORTAR
// ============================================================================

export { AlertSystem, Alert, AlertRule }
export default getAlertSystem
