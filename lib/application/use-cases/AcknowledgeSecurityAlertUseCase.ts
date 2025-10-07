import { UserService } from '../services/UserService'
import { SecurityAlert } from '../../domain/entities/SecurityAlert'
import { UserId } from '../../domain/value-objects/UserId'
import { AlertId } from '../../domain/value-objects/AlertId'

/**
 * Use Case: AcknowledgeSecurityAlertUseCase
 * 
 * Caso de uso para aceptar una alerta de seguridad.
 */

export interface AcknowledgeSecurityAlertRequest {
  userId: string
  alertId: string
  tenantId?: string
  acknowledgedBy: string
}

export interface AcknowledgeSecurityAlertResponse {
  success: boolean
  message: string
  alert: SecurityAlert
}

export class AcknowledgeSecurityAlertUseCase {
  constructor(
    private readonly userService: UserService
  ) {}

  async execute(request: AcknowledgeSecurityAlertRequest): Promise<AcknowledgeSecurityAlertResponse> {
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

    // 5. Validar alert ID
    const alertId = AlertId.fromString(request.alertId)

    // 6. Obtener alerta
    const alert = await this.getSecurityAlert(alertId, tenantId)
    if (!alert) {
      throw new Error('Security alert not found')
    }

    // 7. Aceptar alerta
    const acknowledgedAlert = alert.acknowledge(request.acknowledgedBy)

    // 8. Guardar alerta actualizada
    await this.saveSecurityAlert(acknowledgedAlert)

    // 9. Retornar respuesta
    return {
      success: true,
      message: 'Security alert acknowledged successfully',
      alert: acknowledgedAlert
    }
  }

  private async getSecurityAlert(alertId: AlertId, tenantId: any): Promise<SecurityAlert | null> {
    // TODO: Implementar obtención de alerta desde repositorio
    // Por ahora retornamos null para simular que no existe
    return null
  }

  private async saveSecurityAlert(alert: SecurityAlert): Promise<void> {
    // TODO: Implementar guardado de alerta en repositorio
  }
}
