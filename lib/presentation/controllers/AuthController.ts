import { NextRequest, NextResponse } from 'next/server'
import { LoginUseCase } from '../../application/use-cases/LoginUseCase'
import { GetUserSessionsUseCase } from '../../application/use-cases/GetUserSessionsUseCase'
import { RevokeSessionUseCase } from '../../application/use-cases/RevokeSessionUseCase'
import { RevokeAllSessionsUseCase } from '../../application/use-cases/RevokeAllSessionsUseCase'
import { LoginRequestDto, LoginResponseDto, SessionDto, SessionListDto, RevokeSessionRequestDto, RevokeSessionResponseDto, RevokeAllSessionsRequestDto, RevokeAllSessionsResponseDto } from '../../application/dto/AuthDto'
import { User } from '../../domain/entities/User'
import { Session } from '../../domain/entities/Session'

/**
 * Controller: AuthController
 * 
 * Controlador para manejar las peticiones HTTP relacionadas con autenticación.
 * Se encarga de extraer datos del request, llamar a los casos de uso y formatear respuestas.
 */

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getUserSessionsUseCase: GetUserSessionsUseCase,
    private readonly revokeSessionUseCase: RevokeSessionUseCase,
    private readonly revokeAllSessionsUseCase: RevokeAllSessionsUseCase
  ) {}

  /**
   * Maneja la petición POST /api/auth/login
   */
  async login(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const body = await this.extractLoginBody(request)
      const userAgent = this.extractUserAgent(request)
      const ipAddress = this.extractIpAddress(request)

      // 2. Ejecutar caso de uso
      const result = await this.loginUseCase.execute({
        email: body.email,
        password: body.password,
        rememberMe: body.rememberMe,
        userAgent,
        ipAddress
      })

      // 3. Mapear a DTO
      const response: LoginResponseDto = {
        user: this.mapUserToDto(result.user),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        requires2FA: result.requires2FA
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
   * Maneja la petición GET /api/auth/sessions
   */
  async getUserSessions(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const currentSessionId = this.extractCurrentSessionId(request)
      const filters = this.extractSessionFilters(request)

      // 2. Ejecutar caso de uso
      const result = await this.getUserSessionsUseCase.execute({
        userId,
        tenantId,
        currentSessionId,
        filters
      })

      // 3. Mapear a DTO
      const response: SessionListDto = {
        sessions: result.sessions.map(session => this.mapSessionToDto(session, currentSessionId)),
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
   * Maneja la petición DELETE /api/auth/sessions/[sessionId]
   */
  async revokeSession(request: NextRequest, sessionId: string): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)

      // 2. Ejecutar caso de uso
      const result = await this.revokeSessionUseCase.execute({
        userId,
        sessionId,
        tenantId
      })

      // 3. Mapear a DTO
      const response: RevokeSessionResponseDto = {
        success: result.success,
        message: result.message
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
   * Maneja la petición POST /api/auth/sessions/revoke-all
   */
  async revokeAllSessions(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const body = await this.extractRevokeAllBody(request)

      // 2. Ejecutar caso de uso
      const result = await this.revokeAllSessionsUseCase.execute({
        userId,
        tenantId,
        confirm: body.confirm
      })

      // 3. Mapear a DTO
      const response: RevokeAllSessionsResponseDto = {
        success: result.success,
        message: result.message,
        revokedCount: result.revokedCount
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
   * Extrae el body del request para login
   */
  private async extractLoginBody(request: NextRequest): Promise<LoginRequestDto> {
    const body = await request.json()
    
    // Validar que el body tenga los campos requeridos
    if (!body.email || !body.password) {
      throw new Error('Missing required fields: email, password')
    }

    return body as LoginRequestDto
  }

  /**
   * Extrae el body del request para revocar todas las sesiones
   */
  private async extractRevokeAllBody(request: NextRequest): Promise<RevokeAllSessionsRequestDto> {
    const body = await request.json()
    return body as RevokeAllSessionsRequestDto
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
   * Extrae el ID de la sesión actual del request
   */
  private extractCurrentSessionId(request: NextRequest): string | undefined {
    return request.headers.get('x-session-id') || undefined
  }

  /**
   * Extrae el User Agent del request
   */
  private extractUserAgent(request: NextRequest): string {
    return request.headers.get('user-agent') || 'Unknown'
  }

  /**
   * Extrae la IP del request
   */
  private extractIpAddress(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const remoteAddr = request.headers.get('x-vercel-forwarded-for')
    
    return forwarded?.split(',')[0] || realIp || remoteAddr || '127.0.0.1'
  }

  /**
   * Extrae filtros de sesión del request
   */
  private extractSessionFilters(request: NextRequest): any {
    const url = new URL(request.url)
    const filters: any = {}

    // Filtros de query params
    if (url.searchParams.has('isActive')) {
      filters.isActive = url.searchParams.get('isActive') === 'true'
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
   * Mapea una entidad User a DTO
   */
  private mapUserToDto(user: User): any {
    return {
      id: user.id.getValue(),
      email: user.email,
      name: user.name,
      tenantId: user.tenantId.getValue(),
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      has2FA: false, // TODO: Implementar 2FA
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }
  }

  /**
   * Mapea una entidad Session a DTO
   */
  private mapSessionToDto(session: Session, currentSessionId?: string): SessionDto {
    return {
      id: session.id.getValue(),
      userId: session.userId.getValue(),
      tenantId: session.tenantId.getValue(),
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      isActive: session.isActive,
      createdAt: session.createdAt.toISOString(),
      lastActivityAt: session.lastActivityAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      isCurrent: currentSessionId === session.id.getValue()
    }
  }

  /**
   * Maneja errores y retorna respuestas HTTP apropiadas
   */
  private handleError(error: any): NextResponse {
    console.error('[AuthController] Error:', error)

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

    if (error.message === 'Invalid credentials') {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 })
    }

    if (error.message === 'User account is disabled') {
      return NextResponse.json({
        success: false,
        error: 'Account disabled'
      }, { status: 403 })
    }

    if (error.message === 'Session not found') {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 })
    }

    if (error.message === 'Session does not belong to user') {
      return NextResponse.json({
        success: false,
        error: 'Forbidden'
      }, { status: 403 })
    }

    if (error.message === 'Confirmation is required to revoke all sessions') {
      return NextResponse.json({
        success: false,
        error: 'Confirmation required'
      }, { status: 400 })
    }

    if (error.message.includes('is required') || 
        error.message.includes('Missing required fields') ||
        error.message.includes('Invalid email format')) {
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
