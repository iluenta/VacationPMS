import { ConfigurationValueRepository } from '../../domain/interfaces/ConfigurationValueRepository'
import { UserService } from '../services/UserService'
import { UserId } from '../../domain/value-objects/UserId'
import { ConfigurationValueId } from '../../domain/value-objects/ConfigurationValueId'

/**
 * Use Case: DeleteConfigurationValueUseCase
 * 
 * Caso de uso para eliminar un valor de configuración.
 */

export interface DeleteConfigurationValueRequest {
  userId: string
  configurationValueId: string
  tenantId?: string
}

export interface DeleteConfigurationValueResponse {
  success: boolean
  message: string
}

export class DeleteConfigurationValueUseCase {
  constructor(
    private readonly configurationValueRepository: ConfigurationValueRepository,
    private readonly userService: UserService
  ) {}

  async execute(request: DeleteConfigurationValueRequest): Promise<DeleteConfigurationValueResponse> {
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

    // 4. Verificar que el valor de configuración existe
    const configurationValueId = ConfigurationValueId.fromString(request.configurationValueId)
    const exists = await this.configurationValueRepository.exists(configurationValueId, tenantId)
    if (!exists) {
      throw new Error('Configuration value not found')
    }

    // 5. Eliminar valor de configuración
    await this.configurationValueRepository.delete(configurationValueId, tenantId)

    // 6. Retornar respuesta
    return {
      success: true,
      message: 'Configuration value deleted successfully'
    }
  }
}
