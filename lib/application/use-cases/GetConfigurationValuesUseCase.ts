import { ConfigurationValueRepository } from '../../domain/interfaces/ConfigurationValueRepository'
import { UserService } from '../services/UserService'
import { ConfigurationValue } from '../../domain/entities/ConfigurationValue'
import { UserId } from '../../domain/value-objects/UserId'
import { ConfigurationId } from '../../domain/value-objects/ConfigurationId'
import { ConfigurationValueFilters } from '../../domain/interfaces/ConfigurationValueRepository'

/**
 * Use Case: GetConfigurationValuesUseCase
 * 
 * Caso de uso para obtener valores de configuración por tipo de configuración.
 */

export interface GetConfigurationValuesRequest {
  userId: string
  configurationTypeId: string
  tenantId?: string
  filters?: {
    isActive?: boolean
    value?: string
    label?: string
    page?: number
    limit?: number
  }
}

export interface GetConfigurationValuesResponse {
  values: ConfigurationValue[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export class GetConfigurationValuesUseCase {
  constructor(
    private readonly configurationValueRepository: ConfigurationValueRepository,
    private readonly userService: UserService
  ) {}

  async execute(request: GetConfigurationValuesRequest): Promise<GetConfigurationValuesResponse> {
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

    // 4. Validar configuración existe
    const configurationTypeId = ConfigurationId.fromString(request.configurationTypeId)
    // TODO: Verificar que la configuración existe

    // 5. Preparar filtros
    const filters: ConfigurationValueFilters = {
      isActive: request.filters?.isActive,
      value: request.filters?.value,
      label: request.filters?.label,
      limit: request.filters?.limit || 50,
      offset: request.filters?.page ? (request.filters.page - 1) * (request.filters.limit || 50) : 0
    }

    // 6. Obtener valores
    const values = await this.configurationValueRepository.findByConfigurationType(
      configurationTypeId,
      tenantId,
      filters
    )

    // 7. Obtener total
    const total = await this.configurationValueRepository.countByConfigurationType(
      configurationTypeId,
      tenantId,
      filters
    )

    // 8. Calcular paginación
    const page = request.filters?.page || 1
    const limit = request.filters?.limit || 50
    const hasMore = (page * limit) < total

    // 9. Retornar respuesta
    return {
      values,
      total,
      page,
      limit,
      hasMore
    }
  }
}
