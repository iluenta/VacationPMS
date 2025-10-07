import { ConfigurationValueRepository } from '../../domain/interfaces/ConfigurationValueRepository'
import { UserService } from '../services/UserService'
import { ConfigurationValue } from '../../domain/entities/ConfigurationValue'
import { UserId } from '../../domain/value-objects/UserId'
import { ConfigurationValueId } from '../../domain/value-objects/ConfigurationValueId'

/**
 * Use Case: UpdateConfigurationValueUseCase
 * 
 * Caso de uso para actualizar un valor de configuración existente.
 */

export interface UpdateConfigurationValueRequest {
  userId: string
  configurationValueId: string
  tenantId?: string
  updates: {
    value?: string
    label?: string
    description?: string
    isActive?: boolean
    sortOrder?: number
  }
}

export interface UpdateConfigurationValueResponse {
  configurationValue: ConfigurationValue
}

export class UpdateConfigurationValueUseCase {
  constructor(
    private readonly configurationValueRepository: ConfigurationValueRepository,
    private readonly userService: UserService
  ) {}

  async execute(request: UpdateConfigurationValueRequest): Promise<UpdateConfigurationValueResponse> {
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

    // 4. Obtener valor de configuración existente
    const configurationValueId = ConfigurationValueId.fromString(request.configurationValueId)
    const existingValue = await this.configurationValueRepository.findById(configurationValueId, tenantId)
    
    if (!existingValue) {
      throw new Error('Configuration value not found')
    }

    // 5. Validar datos de entrada
    this.validateInput(request.updates)

    // 6. Verificar duplicados si se actualiza el valor
    if (request.updates.value && request.updates.value !== existingValue.value) {
      const duplicateExists = await this.configurationValueRepository.existsByValue(
        request.updates.value,
        existingValue.configurationTypeId,
        tenantId,
        configurationValueId
      )
      if (duplicateExists) {
        throw new Error('A configuration value with this value already exists')
      }
    }

    // 7. Aplicar actualizaciones
    let updatedValue = existingValue

    if (request.updates.value !== undefined) {
      updatedValue = updatedValue.updateValue(request.updates.value)
    }

    if (request.updates.label !== undefined) {
      updatedValue = updatedValue.updateLabel(request.updates.label)
    }

    if (request.updates.description !== undefined) {
      updatedValue = updatedValue.updateDescription(request.updates.description)
    }

    if (request.updates.isActive !== undefined) {
      updatedValue = request.updates.isActive ? updatedValue.activate() : updatedValue.deactivate()
    }

    if (request.updates.sortOrder !== undefined) {
      updatedValue = updatedValue.updateSortOrder(request.updates.sortOrder)
    }

    // 8. Guardar cambios
    const savedValue = await this.configurationValueRepository.save(updatedValue)

    // 9. Retornar respuesta
    return {
      configurationValue: savedValue
    }
  }

  private validateInput(updates: UpdateConfigurationValueRequest['updates']): void {
    if (updates.value !== undefined) {
      if (!updates.value || updates.value.trim().length === 0) {
        throw new Error('Configuration value cannot be empty')
      }
      if (updates.value.length > 255) {
        throw new Error('Configuration value cannot exceed 255 characters')
      }
    }

    if (updates.label !== undefined) {
      if (!updates.label || updates.label.trim().length === 0) {
        throw new Error('Configuration value label cannot be empty')
      }
      if (updates.label.length > 100) {
        throw new Error('Configuration value label cannot exceed 100 characters')
      }
    }

    if (updates.description !== undefined) {
      if (updates.description && updates.description.length > 500) {
        throw new Error('Configuration value description cannot exceed 500 characters')
      }
    }

    if (updates.sortOrder !== undefined && (updates.sortOrder < 0 || updates.sortOrder > 999)) {
      throw new Error('Configuration value sort order must be between 0 and 999')
    }
  }
}
