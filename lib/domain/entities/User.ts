import { UserId } from '../value-objects/UserId'
import { TenantId } from '../value-objects/TenantId'

/**
 * Entity: User
 * 
 * Representa un usuario en el sistema con toda su lógica de negocio.
 * Es una entidad raíz que puede contener otras entidades y value objects.
 */

export class User {
  constructor(
    public readonly id: UserId,
    public readonly email: string,
    public readonly name: string,
    public readonly tenantId: TenantId | null,
    public readonly isAdmin: boolean,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate()
  }

  /**
   * Valida las reglas de negocio del usuario
   */
  private validate(): void {
    if (!this.email || this.email.trim().length === 0) {
      throw new Error('User email cannot be empty')
    }

    if (!this.name || this.name.trim().length === 0) {
      throw new Error('User name cannot be empty')
    }

    if (this.name.length > 100) {
      throw new Error('User name cannot exceed 100 characters')
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(this.email)) {
      throw new Error('User email must be valid')
    }

    // Regla de negocio: Los usuarios admin pueden no tener tenant
    if (!this.isAdmin && !this.tenantId) {
      throw new Error('Non-admin users must have a tenant assigned')
    }
  }

  /**
   * Verifica si el usuario puede acceder a un tenant específico
   */
  public canAccessTenant(tenantId: TenantId): boolean {
    // Los admins pueden acceder a cualquier tenant
    if (this.isAdmin) {
      return true
    }

    // Los usuarios regulares solo pueden acceder a su propio tenant
    return this.tenantId?.equals(tenantId) ?? false
  }

  /**
   * Verifica si el usuario tiene permisos de administrador
   */
  public hasAdminPrivileges(): boolean {
    return this.isAdmin
  }

  /**
   * Activa el usuario
   */
  public activate(): User {
    if (this.isActive) {
      return this
    }

    return new User(
      this.id,
      this.email,
      this.name,
      this.tenantId,
      this.isAdmin,
      true,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Desactiva el usuario
   */
  public deactivate(): User {
    if (!this.isActive) {
      return this
    }

    return new User(
      this.id,
      this.email,
      this.name,
      this.tenantId,
      this.isAdmin,
      false,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Actualiza el nombre del usuario
   */
  public updateName(newName: string): User {
    if (!newName || newName.trim().length === 0) {
      throw new Error('User name cannot be empty')
    }

    return new User(
      this.id,
      this.email,
      newName.trim(),
      this.tenantId,
      this.isAdmin,
      this.isActive,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Cambia el tenant del usuario (solo para usuarios no admin)
   */
  public changeTenant(newTenantId: TenantId): User {
    if (this.isAdmin) {
      throw new Error('Admin users cannot change tenant')
    }

    return new User(
      this.id,
      this.email,
      this.name,
      newTenantId,
      this.isAdmin,
      this.isActive,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Verifica si el usuario pertenece a un tenant específico
   */
  public belongsToTenant(tenantId: TenantId): boolean {
    return this.tenantId?.equals(tenantId) || false
  }

  /**
   * Convierte la entidad a un objeto plano (para serialización)
   */
  public toPlainObject(): any {
    return {
      id: this.id.getValue(),
      email: this.email,
      name: this.name,
      tenantId: this.tenantId?.getValue() || null,
      isAdmin: this.isAdmin,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  /**
   * Crea una instancia de User desde un objeto plano
   */
  public static fromPlainObject(data: any): User {
    return new User(
      UserId.fromString(data.id),
      data.email,
      data.name,
      data.tenantId ? TenantId.fromString(data.tenantId) : null,
      data.isAdmin || false,
      data.isActive !== false, // Default to true
      new Date(data.createdAt),
      new Date(data.updatedAt)
    )
  }
}
