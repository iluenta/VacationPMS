import { ConfigurationService } from '../services/ConfigurationService'
import { UserService } from '../services/UserService'
import { ConfigurationType } from '../../domain/entities/ConfigurationType'
import { UserId } from '../../domain/value-objects/UserId'
import { TenantId } from '../../domain/value-objects/TenantId'
import { ConfigurationFilters } from '../../domain/interfaces/ConfigurationRepository'

/**
 * Use Case: GetConfigurationsUseCase
 * 
 * Caso de uso para obtener configuraciones.
 * Orquesta la lógica de negocio para listar configuraciones.
 */

export interface GetConfigurationsRequest {
  userId: string
  tenantId?: string
  filters?: {
    isActive?: boolean
    name?: string
    limit?: number
    offset?: number
  }
}

export interface GetConfigurationsResponse {
  configurations: ConfigurationType[]
  total: number
  limit: number
  offset: number
}

export class GetConfigurationsUseCase {
  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly userService: UserService
  ) {}

  async execute(request: GetConfigurationsRequest): Promise<GetConfigurationsResponse> {
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
    const filters: ConfigurationFilters = {
      isActive: request.filters?.isActive,
      name: request.filters?.name,
      limit: request.filters?.limit || 50,
      offset: request.filters?.offset || 0
    }

    // 5. Obtener configuraciones
    const configurations = await this.configurationService.getConfigurationsByTenant(tenantId, filters)

    // 6. Obtener total para paginación
    const total = await this.configurationService.countConfigurationsByTenant(tenantId, filters)

    // 7. Retornar respuesta
    const page = Math.floor(filters.offset! / filters.limit!) + 1
    const hasMore = (filters.offset! + filters.limit!) < total
    
    return {
      configurations,
      total,
      page,
      limit: filters.limit!,
      offset: filters.offset!,
      hasMore
    }
  }
}
