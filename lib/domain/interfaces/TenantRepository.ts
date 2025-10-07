import { TenantId } from '../value-objects/TenantId'

/**
 * Interface: TenantRepository
 * 
 * Define el contrato para el repositorio de tenants.
 * Implementa el patrón Repository para abstraer el acceso a datos.
 */

export interface Tenant {
  id: TenantId
  name: string
  description: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TenantRepository {
  /**
   * Busca un tenant por su ID
   */
  findById(id: TenantId): Promise<Tenant | null>

  /**
   * Busca un tenant por su nombre
   */
  findByName(name: string): Promise<Tenant | null>

  /**
   * Busca todos los tenants
   */
  findAll(): Promise<Tenant[]>

  /**
   * Busca tenants activos
   */
  findActive(): Promise<Tenant[]>

  /**
   * Guarda un tenant (crear o actualizar)
   */
  save(tenant: Tenant): Promise<Tenant>

  /**
   * Elimina un tenant
   */
  delete(id: TenantId): Promise<void>

  /**
   * Verifica si un tenant existe
   */
  exists(id: TenantId): Promise<boolean>

  /**
   * Verifica si existe un tenant con el mismo nombre
   */
  existsByName(name: string, excludeId?: TenantId): Promise<boolean>

  /**
   * Cuenta todos los tenants
   */
  count(): Promise<number>

  /**
   * Cuenta tenants activos
   */
  countActive(): Promise<number>
}
