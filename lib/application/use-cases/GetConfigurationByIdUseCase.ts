import { ConfigurationService } from '../services/ConfigurationService'
import { UserService } from '../services/UserService'
import { ConfigurationType } from '../../domain/entities/ConfigurationType'
import { UserId } from '../../domain/value-objects/UserId'
import { ConfigurationId } from '../../domain/value-objects/ConfigurationId'

/**
 * Use Case: GetConfigurationByIdUseCase
 * 
 * Caso de uso para obtener una configuración específica por su ID.
 */

export interface GetConfigurationByIdRequest {
  userId: string
  configurationId: string
  tenantId?: string
}

export interface GetConfigurationByIdResponse {
  configuration: ConfigurationType
}

export class GetConfigurationByIdUseCase {
  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly userService: UserService
  ) {}

  async execute(request: GetConfigurationByIdRequest): Promise<GetConfigurationByIdResponse> {
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

    // 4. Obtener configuración
    const configurationId = ConfigurationId.fromString(request.configurationId)
    const configuration = await this.configurationService.getConfigurationById(configurationId, tenantId)
    
    if (!configuration) {
      throw new Error('Configuration not found')
    }

    // 5. Retornar respuesta
    return {
      configuration
    }
  }
}
