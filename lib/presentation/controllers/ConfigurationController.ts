import { NextRequest, NextResponse } from 'next/server'
import { GetConfigurationsUseCase } from '../../application/use-cases/GetConfigurationsUseCase'
import { CreateConfigurationUseCase } from '../../application/use-cases/CreateConfigurationUseCase'
import { GetConfigurationByIdUseCase } from '../../application/use-cases/GetConfigurationByIdUseCase'
import { UpdateConfigurationUseCase } from '../../application/use-cases/UpdateConfigurationUseCase'
import { DeleteConfigurationUseCase } from '../../application/use-cases/DeleteConfigurationUseCase'
import { ConfigurationDto, CreateConfigurationDto, ConfigurationListDto, UpdateConfigurationDto } from '../../application/dto/ConfigurationDto'
import { ConfigurationType } from '../../domain/entities/ConfigurationType'

/**
 * Controller: ConfigurationController
 * 
 * Controlador para manejar las peticiones HTTP relacionadas con configuraciones.
 * Se encarga de extraer datos del request, llamar a los casos de uso y formatear respuestas.
 */

export class ConfigurationController {
  constructor(
    private readonly getConfigurationsUseCase: GetConfigurationsUseCase,
    private readonly createConfigurationUseCase: CreateConfigurationUseCase,
    private readonly getConfigurationByIdUseCase: GetConfigurationByIdUseCase,
    private readonly updateConfigurationUseCase: UpdateConfigurationUseCase,
    private readonly deleteConfigurationUseCase: DeleteConfigurationUseCase
  ) {}

  /**
   * Maneja la petición GET /api/configurations
   */
  async getConfigurations(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const filters = this.extractFilters(request)

      // 2. Ejecutar caso de uso
      const result = await this.getConfigurationsUseCase.execute({
        userId,
        tenantId,
        filters
      })

      // 3. Mapear a DTO
      const response: ConfigurationListDto = {
        configurations: result.configurations.map(this.mapToDto),
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }

      // 4. Retornar respuesta
      return NextResponse.json({
        success: true,
        data: response
      })

    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Maneja la petición POST /api/configurations
   */
  async createConfiguration(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const body = await this.extractBody(request)

      // 2. Ejecutar caso de uso
      const result = await this.createConfigurationUseCase.execute({
        userId,
        tenantId,
        name: body.name,
        description: body.description,
        icon: body.icon,
        color: body.color,
        sortOrder: body.sortOrder
      })

      // 3. Mapear a DTO
      const response: ConfigurationDto = this.mapToDto(result.configuration)

      // 4. Retornar respuesta
      return NextResponse.json({
        success: true,
        data: response
      }, { status: 201 })

    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Maneja la petición GET /api/configurations/[id]
   */
  async getConfigurationById(request: NextRequest, configurationId: string): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)

      // 2. Ejecutar caso de uso
      const result = await this.getConfigurationByIdUseCase.execute({
        userId,
        configurationId,
        tenantId
      })

      // 3. Mapear a DTO
      const response: ConfigurationDto = this.mapToDto(result.configuration)

      // 4. Retornar respuesta
      return NextResponse.json({
        success: true,
        data: response
      })

    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Maneja la petición PUT /api/configurations/[id]
   */
  async updateConfiguration(request: NextRequest, configurationId: string): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const body = await this.extractUpdateBody(request)

      // 2. Ejecutar caso de uso
      const result = await this.updateConfigurationUseCase.execute({
        userId,
        configurationId,
        tenantId,
        updates: body
      })

      // 3. Mapear a DTO
      const response: ConfigurationDto = this.mapToDto(result.configuration)

      // 4. Retornar respuesta
      return NextResponse.json({
        success: true,
        data: response
      })

    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Maneja la petición DELETE /api/configurations/[id]
   */
  async deleteConfiguration(request: NextRequest, configurationId: string): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)

      // 2. Ejecutar caso de uso
      const result = await this.deleteConfigurationUseCase.execute({
        userId,
        configurationId,
        tenantId
      })

      // 3. Retornar respuesta
      return NextResponse.json({
        success: true,
        message: result.message
      })

    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Extrae el ID del usuario del request (desde JWT o session)
   */
  private async extractUserId(request: NextRequest): Promise<string> {
    // TODO: Implementar extracción del userId desde JWT
    // Por ahora, usar un valor por defecto para testing
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    // Simular extracción del userId desde JWT
    // En una implementación real, esto vendría del JWT token
    return 'user-id-placeholder'
  }

  /**
   * Extrae el tenant ID del request (desde headers o query params)
   */
  private extractTenantId(request: NextRequest): string | undefined {
    const headerTenantId = request.headers.get('x-tenant-id')
    if (headerTenantId) {
      return headerTenantId
    }

    const url = new URL(request.url)
    return url.searchParams.get('tenant_id') || undefined
  }

  /**
   * Extrae los filtros del request (desde query params)
   */
  private extractFilters(request: NextRequest): {
    isActive?: boolean
    name?: string
    limit?: number
    offset?: number
  } {
    const url = new URL(request.url)
    const filters: any = {}

    const isActive = url.searchParams.get('is_active')
    if (isActive !== null) {
      filters.isActive = isActive === 'true'
    }

    const name = url.searchParams.get('name')
    if (name) {
      filters.name = name
    }

    const limit = url.searchParams.get('limit')
    if (limit) {
      filters.limit = parseInt(limit, 10)
    }

    const offset = url.searchParams.get('offset')
    if (offset) {
      filters.offset = parseInt(offset, 10)
    }

    return filters
  }

  /**
   * Extrae el body del request para crear configuración
   */
  private async extractBody(request: NextRequest): Promise<CreateConfigurationDto> {
    const body = await request.json()
    
    // Validar que el body tenga los campos requeridos
    if (!body.name || !body.description || !body.icon || !body.color) {
      throw new Error('Missing required fields: name, description, icon, color')
    }

    return body as CreateConfigurationDto
  }

  /**
   * Extrae el body del request para actualizar configuración
   */
  private async extractUpdateBody(request: NextRequest): Promise<UpdateConfigurationDto> {
    const body = await request.json()
    return body as UpdateConfigurationDto
  }

  /**
   * Mapea una entidad ConfigurationType a DTO
   */
  private mapToDto(configuration: ConfigurationType): ConfigurationDto {
    return {
      id: configuration.id.getValue(),
      name: configuration.name,
      description: configuration.description,
      icon: configuration.icon,
      color: configuration.color,
      isActive: configuration.isActive,
      sortOrder: configuration.sortOrder,
      tenantId: configuration.tenantId.getValue(),
      createdAt: configuration.createdAt.toISOString(),
      updatedAt: configuration.updatedAt.toISOString()
    }
  }

  /**
   * Maneja errores y retorna respuestas HTTP apropiadas
   */
  private handleError(error: any): NextResponse {
    console.error('[ConfigurationController] Error:', error)

    // Mapear errores específicos a códigos HTTP
    if (error.message === 'Authorization header required') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    if (error.message === 'User not found') {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    if (error.message === 'User does not have access to this tenant') {
      return NextResponse.json({
        success: false,
        error: 'Access denied'
      }, { status: 403 })
    }

    if (error.message === 'Configuration with this name already exists in this tenant') {
      return NextResponse.json({
        success: false,
        error: 'Configuration name already exists'
      }, { status: 409 })
    }

    if (error.message.includes('required') || error.message.includes('cannot exceed')) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 })
    }

    // Error genérico
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
