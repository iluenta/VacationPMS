import { ConfigurationService } from '../services/ConfigurationService'
import { UserService } from '../services/UserService'
import { UserId } from '../../domain/value-objects/UserId'
import { ConfigurationId } from '../../domain/value-objects/ConfigurationId'

/**
 * Use Case: DeleteConfigurationUseCase
 * 
 * Caso de uso para eliminar una configuración.
 */

export interface DeleteConfigurationRequest {
  userId: string
  configurationId: string
  tenantId?: string
}

export interface DeleteConfigurationResponse {
  success: boolean
  message: string
}

export class DeleteConfigurationUseCase {
  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly userService: UserService
  ) {}

  async execute(request: DeleteConfigurationRequest): Promise<DeleteConfigurationResponse> {
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

    // 4. Verificar que la configuración existe
    const configurationId = ConfigurationId.fromString(request.configurationId)
    const exists = await this.configurationService.configurationExists(configurationId, tenantId)
    if (!exists) {
      throw new Error('Configuration not found')
    }

    // 5. Eliminar configuración
    await this.configurationService.deleteConfiguration(configurationId, tenantId)

    // 6. Retornar respuesta
    return {
      success: true,
      message: 'Configuration deleted successfully'
    }
  }
}
