import { ConfigurationValueRepository } from '../../domain/interfaces/ConfigurationValueRepository'
import { UserService } from '../services/UserService'
import { ConfigurationValue } from '../../domain/entities/ConfigurationValue'
import { UserId } from '../../domain/value-objects/UserId'
import { ConfigurationId } from '../../domain/value-objects/ConfigurationId'
import { ConfigurationValueId } from '../../domain/value-objects/ConfigurationValueId'
import { TenantId } from '../../domain/value-objects/TenantId'

/**
 * Use Case: CreateConfigurationValueUseCase
 * 
 * Caso de uso para crear un nuevo valor de configuración.
 */

export interface CreateConfigurationValueRequest {
  userId: string
  configurationTypeId: string
  tenantId?: string
  value: string
  label: string
  description?: string
  isActive?: boolean
  sortOrder?: number
}

export interface CreateConfigurationValueResponse {
  configurationValue: ConfigurationValue
}

export class CreateConfigurationValueUseCase {
  constructor(
    private readonly configurationValueRepository: ConfigurationValueRepository,
    private readonly userService: UserService
  ) {}

  async execute(request: CreateConfigurationValueRequest): Promise<CreateConfigurationValueResponse> {
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
    this.validateInput(request)

    // 5. Validar configuración existe
    const configurationTypeId = ConfigurationId.fromString(request.configurationTypeId)
    // TODO: Verificar que la configuración existe

    // 6. Verificar que no existe un valor duplicado
    const existingValue = await this.configurationValueRepository.findByValue(
      request.value,
      configurationTypeId,
      tenantId
    )
    if (existingValue) {
      throw new Error('A configuration value with this value already exists')
    }

    // 7. Obtener siguiente orden si no se especifica
    let sortOrder = request.sortOrder
    if (sortOrder === undefined) {
      sortOrder = await this.configurationValueRepository.getNextSortOrder(configurationTypeId, tenantId)
    }

    // 8. Crear entidad
    const configurationValue = new ConfigurationValue(
      ConfigurationValueId.fromString(crypto.randomUUID()),
      configurationTypeId,
      request.value.trim(),
      request.label.trim(),
      request.description?.trim() || '',
      request.isActive !== false, // Default to true
      sortOrder,
      tenantId,
      new Date(),
      new Date()
    )

    // 9. Guardar
    const savedConfigurationValue = await this.configurationValueRepository.save(configurationValue)

    // 10. Retornar respuesta
    return {
      configurationValue: savedConfigurationValue
    }
  }

  private validateInput(request: CreateConfigurationValueRequest): void {
    if (!request.value || request.value.trim().length === 0) {
      throw new Error('Configuration value cannot be empty')
    }

    if (request.value.length > 255) {
      throw new Error('Configuration value cannot exceed 255 characters')
    }

    if (!request.label || request.label.trim().length === 0) {
      throw new Error('Configuration value label cannot be empty')
    }

    if (request.label.length > 100) {
      throw new Error('Configuration value label cannot exceed 100 characters')
    }

    if (request.description && request.description.length > 500) {
      throw new Error('Configuration value description cannot exceed 500 characters')
    }

    if (request.sortOrder !== undefined && (request.sortOrder < 0 || request.sortOrder > 999)) {
      throw new Error('Configuration value sort order must be between 0 and 999')
    }
  }
}
