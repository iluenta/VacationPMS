import { ConfigurationValue } from '../entities/ConfigurationValue'
import { ConfigurationValueId } from '../value-objects/ConfigurationValueId'
import { ConfigurationId } from '../value-objects/ConfigurationId'
import { TenantId } from '../value-objects/TenantId'

/**
 * Interface: ConfigurationValueRepository
 * 
 * Define el contrato para el repositorio de valores de configuración.
 */

export interface ConfigurationValueFilters {
  isActive?: boolean
  value?: string
  label?: string
  limit?: number
  offset?: number
}

export interface ConfigurationValueRepository {
  /**
   * Busca un valor de configuración por su ID
   */
  findById(id: ConfigurationValueId, tenantId: TenantId): Promise<ConfigurationValue | null>

  /**
   * Busca valores de configuración por tipo de configuración
   */
  findByConfigurationType(configurationTypeId: ConfigurationId, tenantId: TenantId, filters?: ConfigurationValueFilters): Promise<ConfigurationValue[]>

  /**
   * Busca valores activos por tipo de configuración
   */
  findActiveByConfigurationType(configurationTypeId: ConfigurationId, tenantId: TenantId): Promise<ConfigurationValue[]>

  /**
   * Busca un valor por su valor y tipo de configuración
   */
  findByValue(value: string, configurationTypeId: ConfigurationId, tenantId: TenantId): Promise<ConfigurationValue | null>

  /**
   * Guarda un valor de configuración (crear o actualizar)
   */
  save(configurationValue: ConfigurationValue): Promise<ConfigurationValue>

  /**
   * Elimina un valor de configuración
   */
  delete(id: ConfigurationValueId, tenantId: TenantId): Promise<void>

  /**
   * Verifica si un valor de configuración existe
   */
  exists(id: ConfigurationValueId, tenantId: TenantId): Promise<boolean>

  /**
   * Verifica si existe un valor con el mismo valor en el tipo de configuración
   */
  existsByValue(value: string, configurationTypeId: ConfigurationId, tenantId: TenantId, excludeId?: ConfigurationValueId): Promise<boolean>

  /**
   * Cuenta valores por tipo de configuración
   */
  countByConfigurationType(configurationTypeId: ConfigurationId, tenantId: TenantId, filters?: ConfigurationValueFilters): Promise<number>

  /**
   * Cuenta valores activos por tipo de configuración
   */
  countActiveByConfigurationType(configurationTypeId: ConfigurationId, tenantId: TenantId): Promise<number>

  /**
   * Obtiene el siguiente orden de clasificación disponible
   */
  getNextSortOrder(configurationTypeId: ConfigurationId, tenantId: TenantId): Promise<number>

  /**
   * Reordena los valores de un tipo de configuración
   */
  reorderValues(configurationTypeId: ConfigurationId, tenantId: TenantId, valueIds: ConfigurationValueId[]): Promise<void>
}
