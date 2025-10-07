import { User } from '../entities/User'
import { UserId } from '../value-objects/UserId'
import { TenantId } from '../value-objects/TenantId'

/**
 * Interface: UserRepository
 * 
 * Define el contrato para el repositorio de usuarios.
 * Implementa el patrón Repository para abstraer el acceso a datos.
 */

export interface UserRepository {
  /**
   * Busca un usuario por su ID
   */
  findById(id: UserId): Promise<User | null>

  /**
   * Busca un usuario por su email
   */
  findByEmail(email: string): Promise<User | null>

  /**
   * Busca usuarios por tenant
   */
  findByTenant(tenantId: TenantId): Promise<User[]>

  /**
   * Busca todos los usuarios (solo para admins)
   */
  findAll(): Promise<User[]>

  /**
   * Guarda un usuario (crear o actualizar)
   */
  save(user: User): Promise<User>

  /**
   * Elimina un usuario
   */
  delete(id: UserId): Promise<void>

  /**
   * Verifica si un usuario existe
   */
  exists(id: UserId): Promise<boolean>

  /**
   * Verifica si un email ya está en uso
   */
  existsByEmail(email: string): Promise<boolean>

  /**
   * Busca usuarios activos por tenant
   */
  findActiveByTenant(tenantId: TenantId): Promise<User[]>

  /**
   * Busca usuarios admin
   */
  findAdmins(): Promise<User[]>

  /**
   * Cuenta usuarios por tenant
   */
  countByTenant(tenantId: TenantId): Promise<number>

  /**
   * Cuenta usuarios activos por tenant
   */
  countActiveByTenant(tenantId: TenantId): Promise<number>
}
