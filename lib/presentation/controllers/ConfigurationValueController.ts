import { NextRequest, NextResponse } from 'next/server'
import { GetConfigurationValuesUseCase } from '../../application/use-cases/GetConfigurationValuesUseCase'
import { CreateConfigurationValueUseCase } from '../../application/use-cases/CreateConfigurationValueUseCase'
import { GetConfigurationValueByIdUseCase } from '../../application/use-cases/GetConfigurationValueByIdUseCase'
import { UpdateConfigurationValueUseCase } from '../../application/use-cases/UpdateConfigurationValueUseCase'
import { DeleteConfigurationValueUseCase } from '../../application/use-cases/DeleteConfigurationValueUseCase'
import { ConfigurationValueDto, CreateConfigurationValueDto, ConfigurationValueListDto, UpdateConfigurationValueDto } from '../../application/dto/ConfigurationValueDto'
import { ConfigurationValue } from '../../domain/entities/ConfigurationValue'

/**
 * Controller: ConfigurationValueController
 * 
 * Controlador para manejar las peticiones HTTP relacionadas con valores de configuración.
 * Se encarga de extraer datos del request, llamar a los casos de uso y formatear respuestas.
 */

export class ConfigurationValueController {
  constructor(
    private readonly getConfigurationValuesUseCase: GetConfigurationValuesUseCase,
    private readonly createConfigurationValueUseCase: CreateConfigurationValueUseCase,
    private readonly getConfigurationValueByIdUseCase: GetConfigurationValueByIdUseCase,
    private readonly updateConfigurationValueUseCase: UpdateConfigurationValueUseCase,
    private readonly deleteConfigurationValueUseCase: DeleteConfigurationValueUseCase
  ) {}

  /**
   * Maneja la petición GET /api/configurations/[id]/values
   */
  async getConfigurationValues(request: NextRequest, configurationTypeId: string): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const filters = this.extractFilters(request)

      // 2. Ejecutar caso de uso
      const result = await this.getConfigurationValuesUseCase.execute({
        userId,
        configurationTypeId,
        tenantId,
        filters
      })

      // 3. Mapear a DTO
      const response: ConfigurationValueListDto = {
        values: result.values.map(this.mapToDto),
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.hasMore
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
   * Maneja la petición POST /api/configurations/[id]/values
   */
  async createConfigurationValue(request: NextRequest, configurationTypeId: string): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const body = await this.extractBody(request)

      // 2. Ejecutar caso de uso
      const result = await this.createConfigurationValueUseCase.execute({
        userId,
        configurationTypeId,
        tenantId,
        value: body.value,
        label: body.label,
        description: body.description,
        isActive: body.isActive,
        sortOrder: body.sortOrder
      })

      // 3. Mapear a DTO
      const response: ConfigurationValueDto = this.mapToDto(result.configurationValue)

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
   * Maneja la petición GET /api/configurations/[id]/values/[valueId]
   */
  async getConfigurationValueById(request: NextRequest, configurationValueId: string): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)

      // 2. Ejecutar caso de uso
      const result = await this.getConfigurationValueByIdUseCase.execute({
        userId,
        configurationValueId,
        tenantId
      })

      // 3. Mapear a DTO
      const response: ConfigurationValueDto = this.mapToDto(result.configurationValue)

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
   * Maneja la petición PUT /api/configurations/[id]/values/[valueId]
   */
  async updateConfigurationValue(request: NextRequest, configurationValueId: string): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const body = await this.extractUpdateBody(request)

      // 2. Ejecutar caso de uso
      const result = await this.updateConfigurationValueUseCase.execute({
        userId,
        configurationValueId,
        tenantId,
        updates: body
      })

      // 3. Mapear a DTO
      const response: ConfigurationValueDto = this.mapToDto(result.configurationValue)

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
   * Maneja la petición DELETE /api/configurations/[id]/values/[valueId]
   */
  async deleteConfigurationValue(request: NextRequest, configurationValueId: string): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)

      // 2. Ejecutar caso de uso
      const result = await this.deleteConfigurationValueUseCase.execute({
        userId,
        configurationValueId,
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
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    // Simular extracción del userId desde JWT
    // En una implementación real, aquí se verificaría el JWT
    return 'user-123' // Placeholder
  }

  /**
   * Extrae el tenant ID del request (desde headers o query params)
   */
  private extractTenantId(request: NextRequest): string | undefined {
    const tenantId = request.headers.get('x-tenant-id') || 
                    new URL(request.url).searchParams.get('tenantId')
    return tenantId || undefined
  }

  /**
   * Extrae filtros del request
   */
  private extractFilters(request: NextRequest): any {
    const url = new URL(request.url)
    const filters: any = {}

    // Filtros de query params
    if (url.searchParams.has('isActive')) {
      filters.isActive = url.searchParams.get('isActive') === 'true'
    }

    if (url.searchParams.has('value')) {
      filters.value = url.searchParams.get('value')
    }

    if (url.searchParams.has('label')) {
      filters.label = url.searchParams.get('label')
    }

    // Paginación
    if (url.searchParams.has('page')) {
      filters.page = parseInt(url.searchParams.get('page') || '1')
    }

    if (url.searchParams.has('limit')) {
      filters.limit = parseInt(url.searchParams.get('limit') || '50')
    }

    return filters
  }

  /**
   * Extrae el body del request para crear valor de configuración
   */
  private async extractBody(request: NextRequest): Promise<CreateConfigurationValueDto> {
    const body = await request.json()
    
    // Validar que el body tenga los campos requeridos
    if (!body.value || !body.label) {
      throw new Error('Missing required fields: value, label')
    }

    return body as CreateConfigurationValueDto
  }

  /**
   * Extrae el body del request para actualizar valor de configuración
   */
  private async extractUpdateBody(request: NextRequest): Promise<UpdateConfigurationValueDto> {
    const body = await request.json()
    return body as UpdateConfigurationValueDto
  }

  /**
   * Mapea una entidad ConfigurationValue a DTO
   */
  private mapToDto(configurationValue: ConfigurationValue): ConfigurationValueDto {
    return {
      id: configurationValue.id.getValue(),
      configurationTypeId: configurationValue.configurationTypeId.getValue(),
      value: configurationValue.value,
      label: configurationValue.label,
      description: configurationValue.description,
      isActive: configurationValue.isActive,
      sortOrder: configurationValue.sortOrder,
      tenantId: configurationValue.tenantId.getValue(),
      createdAt: configurationValue.createdAt.toISOString(),
      updatedAt: configurationValue.updatedAt.toISOString()
    }
  }

  /**
   * Maneja errores y retorna respuestas HTTP apropiadas
   */
  private handleError(error: any): NextResponse {
    console.error('[ConfigurationValueController] Error:', error)

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
        error: 'Forbidden'
      }, { status: 403 })
    }

    if (error.message === 'Configuration not found') {
      return NextResponse.json({
        success: false,
        error: 'Configuration not found'
      }, { status: 404 })
    }

    if (error.message === 'A configuration value with this value already exists') {
      return NextResponse.json({
        success: false,
        error: 'Configuration value already exists'
      }, { status: 409 })
    }

    if (error.message.includes('cannot be empty') || 
        error.message.includes('cannot exceed') ||
        error.message.includes('must be between')) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
