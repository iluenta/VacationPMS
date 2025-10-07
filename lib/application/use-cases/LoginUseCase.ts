import { UserService } from '../services/UserService'
import { SessionRepository } from '../../domain/interfaces/SessionRepository'
import { User } from '../../domain/entities/User'
import { Session } from '../../domain/entities/Session'
import { UserId } from '../../domain/value-objects/UserId'
import { SessionId } from '../../domain/value-objects/SessionId'
import { TenantId } from '../../domain/value-objects/TenantId'

/**
 * Use Case: LoginUseCase
 * 
 * Caso de uso para autenticar un usuario en el sistema.
 */

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
  userAgent: string
  ipAddress: string
}

export interface LoginResponse {
  user: User
  session: Session
  accessToken: string
  refreshToken: string
  expiresIn: number
  requires2FA: boolean
}

export class LoginUseCase {
  constructor(
    private readonly userService: UserService,
    private readonly sessionRepository: SessionRepository
  ) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {
    // 1. Validar datos de entrada
    this.validateInput(request)

    // 2. Buscar usuario por email
    const user = await this.userService.getUserByEmail(request.email)
    if (!user) {
      throw new Error('Invalid credentials')
    }

    // 3. Verificar que el usuario esté activo
    if (!user.isActive) {
      throw new Error('User account is disabled')
    }

    // 4. Verificar contraseña
    // TODO: Implementar verificación de contraseña en UserService
    const isPasswordValid = true // Placeholder
    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    // 5. Verificar si requiere 2FA
    // TODO: Implementar verificación de 2FA en UserService
    const requires2FA = false // Placeholder

    // 6. Crear sesión
    const session = await this.createSession(user, request)

    // 7. Generar tokens
    const tokens = await this.generateTokens(user, session)

    // 8. Retornar respuesta
    return {
      user,
      session,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      requires2FA
    }
  }

  private validateInput(request: LoginRequest): void {
    if (!request.email || request.email.trim().length === 0) {
      throw new Error('Email is required')
    }

    if (!request.password || request.password.trim().length === 0) {
      throw new Error('Password is required')
    }

    if (!request.userAgent || request.userAgent.trim().length === 0) {
      throw new Error('User agent is required')
    }

    if (!request.ipAddress || request.ipAddress.trim().length === 0) {
      throw new Error('IP address is required')
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(request.email)) {
      throw new Error('Invalid email format')
    }
  }

  private async createSession(user: User, request: LoginRequest): Promise<Session> {
    const sessionId = SessionId.fromString(crypto.randomUUID())
    const now = new Date()
    const expiresAt = new Date(now.getTime() + (request.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)) // 30 días o 1 día

    const session = new Session(
      sessionId,
      user.id,
      user.tenantId || TenantId.fromString('default-tenant'), // Fallback para tenant
      request.userAgent,
      request.ipAddress,
      true,
      now,
      now,
      expiresAt
    )

    return await this.sessionRepository.save(session)
  }

  private async generateTokens(user: User, session: Session): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  }> {
    // Simular generación de tokens
    // En una implementación real, aquí se usaría JWT
    const accessToken = `access_${user.id.getValue()}_${session.id.getValue()}_${Date.now()}`
    const refreshToken = `refresh_${user.id.getValue()}_${session.id.getValue()}_${Date.now()}`
    const expiresIn = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)

    return {
      accessToken,
      refreshToken,
      expiresIn
    }
  }
}
