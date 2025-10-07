import { SessionId } from '../value-objects/SessionId'
import { UserId } from '../value-objects/UserId'
import { TenantId } from '../value-objects/TenantId'

/**
 * Entity: Session
 * 
 * Representa una sesión de usuario en el sistema con toda su lógica de negocio.
 */

export class Session {
  constructor(
    public readonly id: SessionId,
    public readonly userId: UserId,
    public readonly tenantId: TenantId,
    public readonly userAgent: string,
    public readonly ipAddress: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly lastActivityAt: Date,
    public readonly expiresAt: Date
  ) {
    this.validate()
  }

  /**
   * Valida las reglas de negocio de la sesión
   */
  private validate(): void {
    if (!this.userAgent || this.userAgent.trim().length === 0) {
      throw new Error('Session user agent cannot be empty')
    }

    if (this.userAgent.length > 500) {
      throw new Error('Session user agent cannot exceed 500 characters')
    }

    if (!this.ipAddress || this.ipAddress.trim().length === 0) {
      throw new Error('Session IP address cannot be empty')
    }

    // Validar formato de IP (básico)
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    if (!ipRegex.test(this.ipAddress)) {
      throw new Error('Session IP address must be a valid IPv4 or IPv6 address')
    }

    if (this.expiresAt <= this.createdAt) {
      throw new Error('Session expiration date must be after creation date')
    }

    if (this.lastActivityAt < this.createdAt) {
      throw new Error('Session last activity date cannot be before creation date')
    }
  }

  /**
   * Activa la sesión
   */
  public activate(): Session {
    if (this.isActive) {
      return this
    }

    return new Session(
      this.id,
      this.userId,
      this.tenantId,
      this.userAgent,
      this.ipAddress,
      true,
      this.createdAt,
      new Date(),
      this.expiresAt
    )
  }

  /**
   * Desactiva la sesión
   */
  public deactivate(): Session {
    if (!this.isActive) {
      return this
    }

    return new Session(
      this.id,
      this.userId,
      this.tenantId,
      this.userAgent,
      this.ipAddress,
      false,
      this.createdAt,
      this.lastActivityAt,
      this.expiresAt
    )
  }

  /**
   * Actualiza la última actividad
   */
  public updateLastActivity(): Session {
    return new Session(
      this.id,
      this.userId,
      this.tenantId,
      this.userAgent,
      this.ipAddress,
      this.isActive,
      this.createdAt,
      new Date(),
      this.expiresAt
    )
  }

  /**
   * Extiende la expiración de la sesión
   */
  public extendExpiration(newExpiresAt: Date): Session {
    if (newExpiresAt <= this.createdAt) {
      throw new Error('Session expiration date must be after creation date')
    }

    return new Session(
      this.id,
      this.userId,
      this.tenantId,
      this.userAgent,
      this.ipAddress,
      this.isActive,
      this.createdAt,
      this.lastActivityAt,
      newExpiresAt
    )
  }

  /**
   * Verifica si la sesión ha expirado
   */
  public isExpired(): boolean {
    return new Date() > this.expiresAt
  }

  /**
   * Verifica si la sesión pertenece a un usuario específico
   */
  public belongsToUser(userId: UserId): boolean {
    return this.userId.equals(userId)
  }

  /**
   * Verifica si la sesión pertenece a un tenant específico
   */
  public belongsToTenant(tenantId: TenantId): boolean {
    return this.tenantId.equals(tenantId)
  }

  /**
   * Verifica si la sesión es sospechosa (IP diferente, etc.)
   */
  public isSuspicious(currentIp: string): boolean {
    return this.ipAddress !== currentIp
  }

  /**
   * Convierte la entidad a un objeto plano (para serialización)
   */
  public toPlainObject(): any {
    return {
      id: this.id.getValue(),
      userId: this.userId.getValue(),
      tenantId: this.tenantId.getValue(),
      userAgent: this.userAgent,
      ipAddress: this.ipAddress,
      isActive: this.isActive,
      createdAt: this.createdAt,
      lastActivityAt: this.lastActivityAt,
      expiresAt: this.expiresAt
    }
  }

  /**
   * Crea una instancia de Session desde un objeto plano
   */
  public static fromPlainObject(data: any): Session {
    return new Session(
      SessionId.fromString(data.id),
      UserId.fromString(data.userId),
      TenantId.fromString(data.tenantId),
      data.userAgent,
      data.ipAddress,
      data.isActive !== false, // Default to true
      new Date(data.createdAt),
      new Date(data.lastActivityAt),
      new Date(data.expiresAt)
    )
  }
}
