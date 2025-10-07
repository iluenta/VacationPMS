import { ConfigurationType } from '../entities/ConfigurationType'
import { ConfigurationId } from '../value-objects/ConfigurationId'
import { TenantId } from '../value-objects/TenantId'

/**
 * Interface: ConfigurationRepository
 * 
 * Define el contrato para el repositorio de configuraciones.
 * Implementa el patrón Repository para abstraer el acceso a datos.
 */

export interface ConfigurationFilters {
  isActive?: boolean
  name?: string
  limit?: number
  offset?: number
}

export interface ConfigurationRepository {
  /**
   * Busca una configuración por su ID
   */
  findById(id: ConfigurationId, tenantId: TenantId): Promise<ConfigurationType | null>

  /**
   * Busca configuraciones por tenant con filtros opcionales
   */
  findByTenant(tenantId: TenantId, filters?: ConfigurationFilters): Promise<ConfigurationType[]>

  /**
   * Busca configuraciones activas por tenant
   */
  findActiveByTenant(tenantId: TenantId): Promise<ConfigurationType[]>

  /**
   * Busca una configuración por nombre y tenant
   */
  findByName(name: string, tenantId: TenantId): Promise<ConfigurationType | null>

  /**
   * Guarda una configuración (crear o actualizar)
   */
  save(configuration: ConfigurationType): Promise<ConfigurationType>

  /**
   * Elimina una configuración
   */
  delete(id: ConfigurationId, tenantId: TenantId): Promise<void>

  /**
   * Verifica si una configuración existe
   */
  exists(id: ConfigurationId, tenantId: TenantId): Promise<boolean>

  /**
   * Verifica si existe una configuración con el mismo nombre en el tenant
   */
  existsByName(name: string, tenantId: TenantId, excludeId?: ConfigurationId): Promise<boolean>

  /**
   * Cuenta configuraciones por tenant
   */
  countByTenant(tenantId: TenantId, filters?: ConfigurationFilters): Promise<number>

  /**
   * Cuenta configuraciones activas por tenant
   */
  countActiveByTenant(tenantId: TenantId): Promise<number>

  /**
   * Obtiene el siguiente orden de clasificación disponible
   */
  getNextSortOrder(tenantId: TenantId): Promise<number>

  /**
   * Reordena las configuraciones de un tenant
   */
  reorderConfigurations(tenantId: TenantId, configurationIds: ConfigurationId[]): Promise<void>
}
