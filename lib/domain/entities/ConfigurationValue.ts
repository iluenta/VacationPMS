import { ConfigurationValueId } from '../value-objects/ConfigurationValueId'
import { ConfigurationId } from '../value-objects/ConfigurationId'
import { TenantId } from '../value-objects/TenantId'

/**
 * Entity: ConfigurationValue
 * 
 * Representa un valor de configuración en el sistema con toda su lógica de negocio.
 */

export class ConfigurationValue {
  constructor(
    public readonly id: ConfigurationValueId,
    public readonly configurationTypeId: ConfigurationId,
    public readonly value: string,
    public readonly label: string,
    public readonly description: string,
    public readonly isActive: boolean,
    public readonly sortOrder: number,
    public readonly tenantId: TenantId,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate()
  }

  /**
   * Valida las reglas de negocio del valor de configuración
   */
  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new Error('Configuration value cannot be empty')
    }

    if (this.value.length > 255) {
      throw new Error('Configuration value cannot exceed 255 characters')
    }

    if (!this.label || this.label.trim().length === 0) {
      throw new Error('Configuration value label cannot be empty')
    }

    if (this.label.length > 100) {
      throw new Error('Configuration value label cannot exceed 100 characters')
    }

    if (this.description && this.description.length > 500) {
      throw new Error('Configuration value description cannot exceed 500 characters')
    }

    if (this.sortOrder < 0 || this.sortOrder > 999) {
      throw new Error('Configuration value sort order must be between 0 and 999')
    }
  }

  /**
   * Activa el valor de configuración
   */
  public activate(): ConfigurationValue {
    if (this.isActive) {
      return this
    }

    return new ConfigurationValue(
      this.id,
      this.configurationTypeId,
      this.value,
      this.label,
      this.description,
      true,
      this.sortOrder,
      this.tenantId,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Desactiva el valor de configuración
   */
  public deactivate(): ConfigurationValue {
    if (!this.isActive) {
      return this
    }

    return new ConfigurationValue(
      this.id,
      this.configurationTypeId,
      this.value,
      this.label,
      this.description,
      false,
      this.sortOrder,
      this.tenantId,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Actualiza el valor
   */
  public updateValue(newValue: string): ConfigurationValue {
    if (!newValue || newValue.trim().length === 0) {
      throw new Error('Configuration value cannot be empty')
    }

    if (newValue.length > 255) {
      throw new Error('Configuration value cannot exceed 255 characters')
    }

    return new ConfigurationValue(
      this.id,
      this.configurationTypeId,
      newValue.trim(),
      this.label,
      this.description,
      this.isActive,
      this.sortOrder,
      this.tenantId,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Actualiza la etiqueta
   */
  public updateLabel(newLabel: string): ConfigurationValue {
    if (!newLabel || newLabel.trim().length === 0) {
      throw new Error('Configuration value label cannot be empty')
    }

    if (newLabel.length > 100) {
      throw new Error('Configuration value label cannot exceed 100 characters')
    }

    return new ConfigurationValue(
      this.id,
      this.configurationTypeId,
      this.value,
      newLabel.trim(),
      this.description,
      this.isActive,
      this.sortOrder,
      this.tenantId,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Actualiza la descripción
   */
  public updateDescription(newDescription: string): ConfigurationValue {
    if (newDescription && newDescription.length > 500) {
      throw new Error('Configuration value description cannot exceed 500 characters')
    }

    return new ConfigurationValue(
      this.id,
      this.configurationTypeId,
      this.value,
      this.label,
      newDescription || '',
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
  public updateSortOrder(newSortOrder: number): ConfigurationValue {
    if (newSortOrder < 0 || newSortOrder > 999) {
      throw new Error('Configuration value sort order must be between 0 and 999')
    }

    return new ConfigurationValue(
      this.id,
      this.configurationTypeId,
      this.value,
      this.label,
      this.description,
      this.isActive,
      newSortOrder,
      this.tenantId,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Verifica si el valor pertenece a un tenant específico
   */
  public belongsToTenant(tenantId: TenantId): boolean {
    return this.tenantId.equals(tenantId)
  }

  /**
   * Verifica si el valor pertenece a un tipo de configuración específico
   */
  public belongsToConfigurationType(configurationTypeId: ConfigurationId): boolean {
    return this.configurationTypeId.equals(configurationTypeId)
  }

  /**
   * Convierte la entidad a un objeto plano (para serialización)
   */
  public toPlainObject(): any {
    return {
      id: this.id.getValue(),
      configurationTypeId: this.configurationTypeId.getValue(),
      value: this.value,
      label: this.label,
      description: this.description,
      isActive: this.isActive,
      sortOrder: this.sortOrder,
      tenantId: this.tenantId.getValue(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  /**
   * Crea una instancia de ConfigurationValue desde un objeto plano
   */
  public static fromPlainObject(data: any): ConfigurationValue {
    return new ConfigurationValue(
      ConfigurationValueId.fromString(data.id),
      ConfigurationId.fromString(data.configurationTypeId),
      data.value,
      data.label,
      data.description || '',
      data.isActive !== false, // Default to true
      data.sortOrder || 0,
      TenantId.fromString(data.tenantId),
      new Date(data.createdAt),
      new Date(data.updatedAt)
    )
  }
}
