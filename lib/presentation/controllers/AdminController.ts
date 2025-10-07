import { NextRequest, NextResponse } from 'next/server'
import { GetSecurityMetricsUseCase } from '../../application/use-cases/GetSecurityMetricsUseCase'
import { GetSecurityAlertsUseCase } from '../../application/use-cases/GetSecurityAlertsUseCase'
import { AcknowledgeSecurityAlertUseCase } from '../../application/use-cases/AcknowledgeSecurityAlertUseCase'
import { SecurityMetricsDto, SecurityAlertDto, SecurityAlertListDto, AcknowledgeAlertRequestDto, AcknowledgeAlertResponseDto } from '../../application/dto/AdminDto'
import { SecurityAlert } from '../../domain/entities/SecurityAlert'

/**
 * Controller: AdminController
 * 
 * Controlador para manejar las peticiones HTTP relacionadas con administración.
 * Se encarga de extraer datos del request, llamar a los casos de uso y formatear respuestas.
 */

export class AdminController {
  constructor(
    private readonly getSecurityMetricsUseCase: GetSecurityMetricsUseCase,
    private readonly getSecurityAlertsUseCase: GetSecurityAlertsUseCase,
    private readonly acknowledgeSecurityAlertUseCase: AcknowledgeSecurityAlertUseCase
  ) {}

  /**
   * Maneja la petición GET /api/admin/security-metrics
   */
  async getSecurityMetrics(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)

      // 2. Ejecutar caso de uso
      const result = await this.getSecurityMetricsUseCase.execute({
        userId,
        tenantId
      })

      // 3. Mapear a DTO
      const response: SecurityMetricsDto = {
        totalAlerts: result.totalAlerts,
        activeAlerts: result.activeAlerts,
        criticalAlerts: result.criticalAlerts,
        alertsBySeverity: result.alertsBySeverity,
        alertsByType: result.alertsByType,
        recentAlerts: result.recentAlerts.map(this.mapAlertToDto),
        systemHealth: result.systemHealth,
        securityEvents: result.securityEvents,
        lastUpdated: new Date().toISOString()
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
   * Maneja la petición GET /api/admin/security-alerts
   */
  async getSecurityAlerts(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const filters = this.extractAlertFilters(request)

      // 2. Ejecutar caso de uso
      const result = await this.getSecurityAlertsUseCase.execute({
        userId,
        tenantId,
        filters
      })

      // 3. Mapear a DTO
      const response: SecurityAlertListDto = {
        alerts: result.alerts.map(this.mapAlertToDto),
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
   * Maneja la petición POST /api/admin/security-alerts/[alertId]/acknowledge
   */
  async acknowledgeSecurityAlert(request: NextRequest, alertId: string): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const body = await this.extractAcknowledgeBody(request)

      // 2. Ejecutar caso de uso
      const result = await this.acknowledgeSecurityAlertUseCase.execute({
        userId,
        alertId,
        tenantId,
        acknowledgedBy: body.acknowledgedBy
      })

      // 3. Mapear a DTO
      const response: AcknowledgeAlertResponseDto = {
        success: result.success,
        message: result.message,
        alert: this.mapAlertToDto(result.alert)
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
   * Extrae filtros de alertas del request
   */
  private extractAlertFilters(request: NextRequest): any {
    const url = new URL(request.url)
    const filters: any = {}

    // Filtros de query params
    if (url.searchParams.has('severity')) {
      filters.severity = url.searchParams.get('severity')
    }

    if (url.searchParams.has('status')) {
      filters.status = url.searchParams.get('status')
    }

    if (url.searchParams.has('type')) {
      filters.type = url.searchParams.get('type')
    }

    if (url.searchParams.has('source')) {
      filters.source = url.searchParams.get('source')
    }

    if (url.searchParams.has('dateFrom')) {
      filters.dateFrom = url.searchParams.get('dateFrom')
    }

    if (url.searchParams.has('dateTo')) {
      filters.dateTo = url.searchParams.get('dateTo')
    }

    // Paginación
    if (url.searchParams.has('page')) {
      filters.page = parseInt(url.searchParams.get('page') || '1')
    }

    if (url.searchParams.has('limit')) {
      filters.limit = parseInt(url.searchParams.get('limit') || '20')
    }

    return filters
  }

  /**
   * Extrae el body del request para aceptar alerta
   */
  private async extractAcknowledgeBody(request: NextRequest): Promise<AcknowledgeAlertRequestDto> {
    const body = await request.json()
    
    // Validar que el body tenga los campos requeridos
    if (!body.acknowledgedBy) {
      throw new Error('Missing required field: acknowledgedBy')
    }

    return body as AcknowledgeAlertRequestDto
  }

  /**
   * Mapea una entidad SecurityAlert a DTO
   */
  private mapAlertToDto(alert: SecurityAlert): SecurityAlertDto {
    return {
      id: alert.id.getValue(),
      tenantId: alert.tenantId.getValue(),
      type: alert.type,
      severity: alert.severity,
      status: alert.status,
      title: alert.title,
      description: alert.description,
      details: alert.details,
      source: alert.source,
      count: alert.count,
      firstOccurrence: alert.firstOccurrence.toISOString(),
      lastOccurrence: alert.lastOccurrence.toISOString(),
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
      acknowledgedAt: alert.acknowledgedAt?.toISOString(),
      acknowledgedBy: alert.acknowledgedBy,
      resolvedAt: alert.resolvedAt?.toISOString(),
      resolvedBy: alert.resolvedBy
    }
  }

  /**
   * Maneja errores y retorna respuestas HTTP apropiadas
   */
  private handleError(error: any): NextResponse {
    console.error('[AdminController] Error:', error)

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

    if (error.message === 'Admin access required') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    if (error.message === 'User does not have access to this tenant') {
      return NextResponse.json({
        success: false,
        error: 'Forbidden'
      }, { status: 403 })
    }

    if (error.message === 'Security alert not found') {
      return NextResponse.json({
        success: false,
        error: 'Security alert not found'
      }, { status: 404 })
    }

    if (error.message.includes('is required') || 
        error.message.includes('Missing required field')) {
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
