import { ConfigurationService } from '../services/ConfigurationService'
import { UserService } from '../services/UserService'
import { ConfigurationType } from '../../domain/entities/ConfigurationType'
import { UserId } from '../../domain/value-objects/UserId'
import { ConfigurationId } from '../../domain/value-objects/ConfigurationId'

/**
 * Use Case: UpdateConfigurationUseCase
 * 
 * Caso de uso para actualizar una configuración existente.
 */

export interface UpdateConfigurationRequest {
  userId: string
  configurationId: string
  tenantId?: string
  updates: {
    name?: string
    description?: string
    icon?: string
    color?: string
    isActive?: boolean
    sortOrder?: number
  }
}

export interface UpdateConfigurationResponse {
  configuration: ConfigurationType
}

export class UpdateConfigurationUseCase {
  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly userService: UserService
  ) {}

  async execute(request: UpdateConfigurationRequest): Promise<UpdateConfigurationResponse> {
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

    // 4. Validar datos de entrada
    this.validateInput(request.updates)

    // 5. Actualizar configuración
    const configurationId = ConfigurationId.fromString(request.configurationId)
    const configuration = await this.configurationService.updateConfiguration(
      configurationId,
      tenantId,
      request.updates
    )

    // 6. Retornar respuesta
    return {
      configuration
    }
  }

  private validateInput(updates: UpdateConfigurationRequest['updates']): void {
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('Configuration name cannot be empty')
      }
      if (updates.name.length > 100) {
        throw new Error('Configuration name cannot exceed 100 characters')
      }
    }

    if (updates.description !== undefined) {
      if (!updates.description || updates.description.trim().length === 0) {
        throw new Error('Configuration description cannot be empty')
      }
      if (updates.description.length > 500) {
        throw new Error('Configuration description cannot exceed 500 characters')
      }
    }

    if (updates.icon !== undefined) {
      if (!updates.icon || updates.icon.trim().length === 0) {
        throw new Error('Configuration icon cannot be empty')
      }
    }

    if (updates.color !== undefined) {
      if (!updates.color || updates.color.trim().length === 0) {
        throw new Error('Configuration color cannot be empty')
      }
      // Validar formato de color hexadecimal
      const colorRegex = /^#[0-9A-F]{6}$/i
      if (!colorRegex.test(updates.color)) {
        throw new Error('Configuration color must be a valid hexadecimal color')
      }
    }

    if (updates.sortOrder !== undefined && (updates.sortOrder < 0 || updates.sortOrder > 999)) {
      throw new Error('Configuration sort order must be between 0 and 999')
    }
  }
}
