import { ConfigurationService } from '../services/ConfigurationService'
import { UserService } from '../services/UserService'
import { ConfigurationType } from '../../domain/entities/ConfigurationType'
import { UserId } from '../../domain/value-objects/UserId'
import { TenantId } from '../../domain/value-objects/TenantId'

/**
 * Use Case: CreateConfigurationUseCase
 * 
 * Caso de uso para crear configuraciones.
 * Orquesta la lógica de negocio para crear nuevas configuraciones.
 */

export interface CreateConfigurationRequest {
  userId: string
  tenantId?: string
  name: string
  description: string
  icon: string
  color: string
  sortOrder?: number
}

export interface CreateConfigurationResponse {
  configuration: ConfigurationType
}

export class CreateConfigurationUseCase {
  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly userService: UserService
  ) {}

  async execute(request: CreateConfigurationRequest): Promise<CreateConfigurationResponse> {
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

    // 5. Crear configuración
    const configuration = await this.configurationService.createConfiguration(
      request.name,
      request.description,
      request.icon,
      request.color,
      tenantId,
      request.sortOrder
    )

    // 6. Retornar respuesta
    return {
      configuration
    }
  }

  private validateInput(request: CreateConfigurationRequest): void {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('Configuration name is required')
    }

    if (request.name.length > 100) {
      throw new Error('Configuration name cannot exceed 100 characters')
    }

    if (!request.description || request.description.trim().length === 0) {
      throw new Error('Configuration description is required')
    }

    if (request.description.length > 500) {
      throw new Error('Configuration description cannot exceed 500 characters')
    }

    if (!request.icon || request.icon.trim().length === 0) {
      throw new Error('Configuration icon is required')
    }

    if (!request.color || request.color.trim().length === 0) {
      throw new Error('Configuration color is required')
    }

    // Validar formato de color hexadecimal
    const colorRegex = /^#[0-9A-F]{6}$/i
    if (!colorRegex.test(request.color)) {
      throw new Error('Configuration color must be a valid hexadecimal color')
    }

    if (request.sortOrder !== undefined && (request.sortOrder < 0 || request.sortOrder > 999)) {
      throw new Error('Configuration sort order must be between 0 and 999')
    }
  }
}
