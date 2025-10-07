import { SessionRepository } from '../../domain/interfaces/SessionRepository'
import { UserService } from '../services/UserService'
import { Session } from '../../domain/entities/Session'
import { UserId } from '../../domain/value-objects/UserId'

/**
 * Use Case: GetUserSessionsUseCase
 * 
 * Caso de uso para obtener las sesiones activas de un usuario.
 */

export interface GetUserSessionsRequest {
  userId: string
  tenantId?: string
  currentSessionId?: string
  filters?: {
    isActive?: boolean
    page?: number
    limit?: number
  }
}

export interface GetUserSessionsResponse {
  sessions: Session[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export class GetUserSessionsUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly userService: UserService
  ) {}

  async execute(request: GetUserSessionsRequest): Promise<GetUserSessionsResponse> {
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

    // 4. Preparar filtros
    const filters = {
      isActive: request.filters?.isActive,
      limit: request.filters?.limit || 20,
      offset: request.filters?.page ? (request.filters.page - 1) * (request.filters.limit || 20) : 0
    }

    // 5. Obtener sesiones
    const sessions = await this.sessionRepository.findByUserId(userId, tenantId, filters)

    // 6. Obtener total
    const total = await this.sessionRepository.countByUserId(userId, tenantId, filters)

    // 7. Calcular paginación
    const page = request.filters?.page || 1
    const limit = request.filters?.limit || 20
    const hasMore = (page * limit) < total

    // 8. Retornar respuesta
    return {
      sessions,
      total,
      page,
      limit,
      hasMore
    }
  }
}
