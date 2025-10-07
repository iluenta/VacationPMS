import { AlertId } from '../value-objects/AlertId'
import { TenantId } from '../value-objects/TenantId'

/**
 * Entity: SecurityAlert
 * 
 * Representa una alerta de seguridad en el sistema con toda su lógica de negocio.
 */

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export class SecurityAlert {
  constructor(
    public readonly id: AlertId,
    public readonly tenantId: TenantId,
    public readonly type: string,
    public readonly severity: AlertSeverity,
    public readonly status: AlertStatus,
    public readonly title: string,
    public readonly description: string,
    public readonly details: Record<string, any>,
    public readonly source: string,
    public readonly count: number,
    public readonly firstOccurrence: Date,
    public readonly lastOccurrence: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly acknowledgedAt?: Date,
    public readonly acknowledgedBy?: string,
    public readonly resolvedAt?: Date,
    public readonly resolvedBy?: string
  ) {
    this.validate()
  }

  /**
   * Valida las reglas de negocio de la alerta de seguridad
   */
  private validate(): void {
    if (!this.type || this.type.trim().length === 0) {
      throw new Error('Security alert type cannot be empty')
    }

    if (this.type.length > 100) {
      throw new Error('Security alert type cannot exceed 100 characters')
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Security alert title cannot be empty')
    }

    if (this.title.length > 200) {
      throw new Error('Security alert title cannot exceed 200 characters')
    }

    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Security alert description cannot be empty')
    }

    if (this.description.length > 1000) {
      throw new Error('Security alert description cannot exceed 1000 characters')
    }

    if (!this.source || this.source.trim().length === 0) {
      throw new Error('Security alert source cannot be empty')
    }

    if (this.source.length > 100) {
      throw new Error('Security alert source cannot exceed 100 characters')
    }

    if (this.count < 1) {
      throw new Error('Security alert count must be at least 1')
    }

    if (this.lastOccurrence < this.firstOccurrence) {
      throw new Error('Security alert last occurrence cannot be before first occurrence')
    }

    if (this.acknowledgedAt && this.acknowledgedAt < this.firstOccurrence) {
      throw new Error('Security alert acknowledged date cannot be before first occurrence')
    }

    if (this.resolvedAt && this.resolvedAt < this.firstOccurrence) {
      throw new Error('Security alert resolved date cannot be before first occurrence')
    }

    if (this.resolvedAt && this.acknowledgedAt && this.resolvedAt < this.acknowledgedAt) {
      throw new Error('Security alert resolved date cannot be before acknowledged date')
    }
  }

  /**
   * Acepta la alerta
   */
  public acknowledge(acknowledgedBy: string): SecurityAlert {
    if (this.status === AlertStatus.ACKNOWLEDGED) {
      return this
    }

    if (this.status === AlertStatus.RESOLVED || this.status === AlertStatus.DISMISSED) {
      throw new Error('Cannot acknowledge a resolved or dismissed alert')
    }

    return new SecurityAlert(
      this.id,
      this.tenantId,
      this.type,
      this.severity,
      AlertStatus.ACKNOWLEDGED,
      this.title,
      this.description,
      this.details,
      this.source,
      this.count,
      this.firstOccurrence,
      this.lastOccurrence,
      this.createdAt,
      new Date(),
      new Date(),
      acknowledgedBy,
      this.resolvedAt,
      this.resolvedBy
    )
  }

  /**
   * Resuelve la alerta
   */
  public resolve(resolvedBy: string): SecurityAlert {
    if (this.status === AlertStatus.RESOLVED) {
      return this
    }

    if (this.status === AlertStatus.DISMISSED) {
      throw new Error('Cannot resolve a dismissed alert')
    }

    return new SecurityAlert(
      this.id,
      this.tenantId,
      this.type,
      this.severity,
      AlertStatus.RESOLVED,
      this.title,
      this.description,
      this.details,
      this.source,
      this.count,
      this.firstOccurrence,
      this.lastOccurrence,
      this.createdAt,
      new Date(),
      this.acknowledgedAt,
      this.acknowledgedBy,
      new Date(),
      resolvedBy
    )
  }

  /**
   * Descarta la alerta
   */
  public dismiss(): SecurityAlert {
    if (this.status === AlertStatus.DISMISSED) {
      return this
    }

    if (this.status === AlertStatus.RESOLVED) {
      throw new Error('Cannot dismiss a resolved alert')
    }

    return new SecurityAlert(
      this.id,
      this.tenantId,
      this.type,
      this.severity,
      AlertStatus.DISMISSED,
      this.title,
      this.description,
      this.details,
      this.source,
      this.count,
      this.firstOccurrence,
      this.lastOccurrence,
      this.createdAt,
      new Date(),
      this.acknowledgedAt,
      this.acknowledgedBy,
      this.resolvedAt,
      this.resolvedBy
    )
  }

  /**
   * Incrementa el contador de ocurrencias
   */
  public incrementCount(): SecurityAlert {
    return new SecurityAlert(
      this.id,
      this.tenantId,
      this.type,
      this.severity,
      this.status,
      this.title,
      this.description,
      this.details,
      this.source,
      this.count + 1,
      this.firstOccurrence,
      new Date(),
      this.createdAt,
      new Date(),
      this.acknowledgedAt,
      this.acknowledgedBy,
      this.resolvedAt,
      this.resolvedBy
    )
  }

  /**
   * Verifica si la alerta pertenece a un tenant específico
   */
  public belongsToTenant(tenantId: TenantId): boolean {
    return this.tenantId.equals(tenantId)
  }

  /**
   * Verifica si la alerta es crítica
   */
  public isCritical(): boolean {
    return this.severity === AlertSeverity.CRITICAL
  }

  /**
   * Verifica si la alerta está activa
   */
  public isActive(): boolean {
    return this.status === AlertStatus.ACTIVE
  }

  /**
   * Verifica si la alerta está resuelta
   */
  public isResolved(): boolean {
    return this.status === AlertStatus.RESOLVED
  }

  /**
   * Convierte la entidad a un objeto plano (para serialización)
   */
  public toPlainObject(): any {
    return {
      id: this.id.getValue(),
      tenantId: this.tenantId.getValue(),
      type: this.type,
      severity: this.severity,
      status: this.status,
      title: this.title,
      description: this.description,
      details: this.details,
      source: this.source,
      count: this.count,
      firstOccurrence: this.firstOccurrence,
      lastOccurrence: this.lastOccurrence,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      acknowledgedAt: this.acknowledgedAt,
      acknowledgedBy: this.acknowledgedBy,
      resolvedAt: this.resolvedAt,
      resolvedBy: this.resolvedBy
    }
  }

  /**
   * Crea una instancia de SecurityAlert desde un objeto plano
   */
  public static fromPlainObject(data: any): SecurityAlert {
    return new SecurityAlert(
      AlertId.fromString(data.id),
      TenantId.fromString(data.tenantId),
      data.type,
      data.severity as AlertSeverity,
      data.status as AlertStatus,
      data.title,
      data.description,
      data.details || {},
      data.source,
      data.count || 1,
      new Date(data.firstOccurrence),
      new Date(data.lastOccurrence),
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.acknowledgedAt ? new Date(data.acknowledgedAt) : undefined,
      data.acknowledgedBy,
      data.resolvedAt ? new Date(data.resolvedAt) : undefined,
      data.resolvedBy
    )
  }
}
