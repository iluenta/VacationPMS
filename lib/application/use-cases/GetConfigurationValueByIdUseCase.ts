import { ConfigurationValueRepository } from '../../domain/interfaces/ConfigurationValueRepository'
import { UserService } from '../services/UserService'
import { ConfigurationValue } from '../../domain/entities/ConfigurationValue'
import { UserId } from '../../domain/value-objects/UserId'
import { ConfigurationValueId } from '../../domain/value-objects/ConfigurationValueId'

/**
 * Use Case: GetConfigurationValueByIdUseCase
 * 
 * Caso de uso para obtener un valor de configuración específico por su ID.
 */

export interface GetConfigurationValueByIdRequest {
  userId: string
  configurationValueId: string
  tenantId?: string
}

export interface GetConfigurationValueByIdResponse {
  configurationValue: ConfigurationValue
}

export class GetConfigurationValueByIdUseCase {
  constructor(
    private readonly configurationValueRepository: ConfigurationValueRepository,
    private readonly userService: UserService
  ) {}

  async execute(request: GetConfigurationValueByIdRequest): Promise<GetConfigurationValueByIdResponse> {
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

    // 4. Obtener valor de configuración
    const configurationValueId = ConfigurationValueId.fromString(request.configurationValueId)
    const configurationValue = await this.configurationValueRepository.findById(configurationValueId, tenantId)
    
    if (!configurationValue) {
      throw new Error('Configuration value not found')
    }

    // 5. Retornar respuesta
    return {
      configurationValue
    }
  }
}
