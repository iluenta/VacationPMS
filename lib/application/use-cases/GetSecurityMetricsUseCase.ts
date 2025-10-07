import { UserService } from '../services/UserService'
import { SecurityAlert } from '../../domain/entities/SecurityAlert'
import { UserId } from '../../domain/value-objects/UserId'

/**
 * Use Case: GetSecurityMetricsUseCase
 * 
 * Caso de uso para obtener métricas de seguridad del sistema.
 */

export interface GetSecurityMetricsRequest {
  userId: string
  tenantId?: string
}

export interface GetSecurityMetricsResponse {
  totalAlerts: number
  activeAlerts: number
  criticalAlerts: number
  alertsBySeverity: {
    low: number
    medium: number
    high: number
    critical: number
  }
  alertsByType: Record<string, number>
  recentAlerts: SecurityAlert[]
  systemHealth: {
    uptime: number
    memoryUsage: number
    cpuUsage: number
    diskUsage: number
  }
  securityEvents: {
    loginAttempts: number
    failedLogins: number
    blockedIPs: number
    rateLimitHits: number
  }
}

export class GetSecurityMetricsUseCase {
  constructor(
    private readonly userService: UserService
  ) {}

  async execute(request: GetSecurityMetricsRequest): Promise<GetSecurityMetricsResponse> {
    // 1. Validar y obtener usuario
    const userId = UserId.fromString(request.userId)
    const user = await this.userService.getUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // 2. Verificar que el usuario es administrador
    if (!user.isAdmin) {
      throw new Error('Admin access required')
    }

    // 3. Determinar tenant ID
    const tenantId = await this.userService.determineTenantId(user, request.tenantId)

    // 4. Validar acceso al tenant
    const hasAccess = await this.userService.validateUserAccess(userId, tenantId)
    if (!hasAccess) {
      throw new Error('User does not have access to this tenant')
    }

    // 5. Obtener métricas de seguridad
    const metrics = await this.getSecurityMetrics(tenantId)

    // 6. Retornar respuesta
    return metrics
  }

  private async getSecurityMetrics(tenantId: any): Promise<GetSecurityMetricsResponse> {
    // Simular obtención de métricas
    // En una implementación real, aquí se consultarían los logs y la base de datos
    
    return {
      totalAlerts: 42,
      activeAlerts: 8,
      criticalAlerts: 2,
      alertsBySeverity: {
        low: 15,
        medium: 20,
        high: 5,
        critical: 2
      },
      alertsByType: {
        'rate_limit_exceeded': 25,
        'failed_login': 10,
        'suspicious_activity': 5,
        'unauthorized_access': 2
      },
      recentAlerts: [], // TODO: Implementar obtención de alertas recientes
      systemHealth: {
        uptime: 86400, // 24 horas en segundos
        memoryUsage: 75.5,
        cpuUsage: 45.2,
        diskUsage: 60.8
      },
      securityEvents: {
        loginAttempts: 1250,
        failedLogins: 45,
        blockedIPs: 12,
        rateLimitHits: 89
      }
    }
  }
}
