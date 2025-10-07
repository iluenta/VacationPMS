import { SessionRepository } from '../../domain/interfaces/SessionRepository'
import { UserService } from '../services/UserService'
import { SessionId } from '../../domain/value-objects/SessionId'
import { UserId } from '../../domain/value-objects/UserId'

/**
 * Use Case: RevokeSessionUseCase
 * 
 * Caso de uso para revocar una sesión específica.
 */

export interface RevokeSessionRequest {
  userId: string
  sessionId: string
  tenantId?: string
}

export interface RevokeSessionResponse {
  success: boolean
  message: string
}

export class RevokeSessionUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly userService: UserService
  ) {}

  async execute(request: RevokeSessionRequest): Promise<RevokeSessionResponse> {
    // 1. Validar y obtener usuario
    const userId = UserId.fromString(request.userId)
    const user = await this.userService.getUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // 2. Determinar tenant ID
    const tenantId = await this.userService.determineTenantId(user, request.tenantId)

    // 3. Validar acceso al tenant
    const hasAccess = await this.userService.validateUserAccess(userId, tenantId)
    if (!hasAccess) {
      throw new Error('User does not have access to this tenant')
    }

    // 4. Validar session ID
    const sessionId = SessionId.fromString(request.sessionId)

    // 5. Verificar que la sesión existe y pertenece al usuario
    const session = await this.sessionRepository.findById(sessionId, tenantId)
    if (!session) {
      throw new Error('Session not found')
    }

    if (!session.belongsToUser(userId)) {
      throw new Error('Session does not belong to user')
    }

    // 6. Revocar sesión
    await this.sessionRepository.delete(sessionId, tenantId)

    // 7. Retornar respuesta
    return {
      success: true,
      message: 'Session revoked successfully'
    }
  }
}
