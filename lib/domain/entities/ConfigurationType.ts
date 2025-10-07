import { ConfigurationId } from '../value-objects/ConfigurationId'
import { TenantId } from '../value-objects/TenantId'

/**
 * Entity: ConfigurationType
 * 
 * Representa un tipo de configuración en el sistema con toda su lógica de negocio.
 * Es una entidad que encapsula las reglas de negocio relacionadas con configuraciones.
 */

export class ConfigurationType {
  constructor(
    public readonly id: ConfigurationId,
    public readonly name: string,
    public readonly description: string,
    public readonly icon: string,
    public readonly color: string,
    public readonly isActive: boolean,
    public readonly sortOrder: number,
    public readonly tenantId: TenantId,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate()
  }

  /**
   * Valida las reglas de negocio de la configuración
   */
  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Configuration name cannot be empty')
    }

    if (this.name.length > 100) {
      throw new Error('Configuration name cannot exceed 100 characters')
    }

    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Configuration description cannot be empty')
    }

    if (this.description.length > 500) {
      throw new Error('Configuration description cannot exceed 500 characters')
    }

    if (!this.icon || this.icon.trim().length === 0) {
      throw new Error('Configuration icon cannot be empty')
    }

    if (!this.color || this.color.trim().length === 0) {
      throw new Error('Configuration color cannot be empty')
    }

    // Validar formato de color hexadecimal
    const colorRegex = /^#[0-9A-F]{6}$/i
    if (!colorRegex.test(this.color)) {
      throw new Error('Configuration color must be a valid hexadecimal color')
    }

    if (this.sortOrder < 0 || this.sortOrder > 999) {
      throw new Error('Configuration sort order must be between 0 and 999')
    }
  }

  /**
   * Activa la configuración
   */
  public activate(): ConfigurationType {
    if (this.isActive) {
      return this
    }

    return new ConfigurationType(
      this.id,
      this.name,
      this.description,
      this.icon,
      this.color,
      true,
      this.sortOrder,
      this.tenantId,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Desactiva la configuración
   */
  public deactivate(): ConfigurationType {
    if (!this.isActive) {
      return this
    }

    return new ConfigurationType(
      this.id,
      this.name,
      this.description,
      this.icon,
      this.color,
      false,
      this.sortOrder,
      this.tenantId,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Actualiza el nombre de la configuración
   */
  public updateName(newName: string): ConfigurationType {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Configuration name cannot be empty')
    }

    if (newName.length > 100) {
      throw new Error('Configuration name cannot exceed 100 characters')
    }

    return new ConfigurationType(
      this.id,
      newName.trim(),
      this.description,
      this.icon,
      this.color,
      this.isActive,
      this.sortOrder,
      this.tenantId,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Actualiza la descripción de la configuración
   */
  public updateDescription(newDescription: string): ConfigurationType {
    if (!newDescription || newDescription.trim().length === 0) {
      throw new Error('Configuration description cannot be empty')
    }

    if (newDescription.length > 500) {
      throw new Error('Configuration description cannot exceed 500 characters')
    }

    return new ConfigurationType(
      this.id,
      this.name,
      newDescription.trim(),
      this.icon,
      this.color,
      this.isActive,
      this.sortOrder,
      this.tenantId,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Actualiza el icono de la configuración
   */
  public updateIcon(newIcon: string): ConfigurationType {
    if (!newIcon || newIcon.trim().length === 0) {
      throw new Error('Configuration icon cannot be empty')
    }

    return new ConfigurationType(
      this.id,
      this.name,
      this.description,
      newIcon.trim(),
      this.color,
      this.isActive,
      this.sortOrder,
      this.tenantId,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Actualiza el color de la configuración
   */
  public updateColor(newColor: string): ConfigurationType {
    if (!newColor || newColor.trim().length === 0) {
      throw new Error('Configuration color cannot be empty')
    }

    // Validar formato de color hexadecimal
    const colorRegex = /^#[0-9A-F]{6}$/i
    if (!colorRegex.test(newColor)) {
      throw new Error('Configuration color must be a valid hexadecimal color')
    }

    return new ConfigurationType(
      this.id,
      this.name,
      this.description,
      this.icon,
      newColor.toUpperCase(),
      this.isActive,
      this.sortOrder,
      this.tenantId,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Actualiza el orden de clasificación
   */
  public updateSortOrder(newSortOrder: number): ConfigurationType {
    if (newSortOrder < 0 || newSortOrder > 999) {
      throw new Error('Configuration sort order must be between 0 and 999')
    }

    return new ConfigurationType(
      this.id,
      this.name,
      this.description,
      this.icon,
      this.color,
      this.isActive,
      newSortOrder,
      this.tenantId,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Verifica si la configuración pertenece a un tenant específico
   */
  public belongsToTenant(tenantId: TenantId): boolean {
    return this.tenantId.equals(tenantId)
  }

  /**
   * Convierte la entidad a un objeto plano (para serialización)
   */
  public toPlainObject(): any {
    return {
      id: this.id.getValue(),
      name: this.name,
      description: this.description,
      icon: this.icon,
      color: this.color,
      isActive: this.isActive,
      sortOrder: this.sortOrder,
      tenantId: this.tenantId.getValue(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  /**
   * Crea una instancia de ConfigurationType desde un objeto plano
   */
  public static fromPlainObject(data: any): ConfigurationType {
    return new ConfigurationType(
      ConfigurationId.fromString(data.id),
      data.name,
      data.description,
      data.icon,
      data.color,
      data.isActive !== false, // Default to true
      data.sortOrder || 0,
      TenantId.fromString(data.tenantId),
      new Date(data.createdAt),
      new Date(data.updatedAt)
    )
  }
}
