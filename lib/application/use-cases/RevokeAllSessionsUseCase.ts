import { SessionRepository } from '../../domain/interfaces/SessionRepository'
import { UserService } from '../services/UserService'
import { UserId } from '../../domain/value-objects/UserId'

/**
 * Use Case: RevokeAllSessionsUseCase
 * 
 * Caso de uso para revocar todas las sesiones de un usuario.
 */

export interface RevokeAllSessionsRequest {
  userId: string
  tenantId?: string
  confirm: boolean
}

export interface RevokeAllSessionsResponse {
  success: boolean
  message: string
  revokedCount: number
}

export class RevokeAllSessionsUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly userService: UserService
  ) {}

  async execute(request: RevokeAllSessionsRequest): Promise<RevokeAllSessionsResponse> {
    // 1. Validar confirmación
    if (!request.confirm) {
      throw new Error('Confirmation is required to revoke all sessions')
    }

    // 2. Validar y obtener usuario
    const userId = UserId.fromString(request.userId)
    const user = await this.userService.getUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // 3. Determinar tenant ID
    const tenantId = await this.userService.determineTenantId(user, request.tenantId)

    // 4. Validar acceso al tenant
    const hasAccess = await this.userService.validateUserAccess(userId, tenantId)
    if (!hasAccess) {
      throw new Error('User does not have access to this tenant')
    }

    // 5. Obtener sesiones activas para contar
    const activeSessions = await this.sessionRepository.findActiveByUserId(userId, tenantId)
    const revokedCount = activeSessions.length

    // 6. Revocar todas las sesiones
    await this.sessionRepository.deleteByUserId(userId, tenantId)

    // 7. Retornar respuesta
    return {
      success: true,
      message: `All sessions revoked successfully. ${revokedCount} sessions were terminated.`,
      revokedCount
    }
  }
}
