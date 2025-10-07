import { Session } from '../entities/Session'
import { SessionId } from '../value-objects/SessionId'
import { UserId } from '../value-objects/UserId'
import { TenantId } from '../value-objects/TenantId'

/**
 * Interface: SessionRepository
 * 
 * Define el contrato para el repositorio de sesiones.
 */

export interface SessionFilters {
  isActive?: boolean
  userId?: string
  tenantId?: string
  limit?: number
  offset?: number
}

export interface SessionRepository {
  /**
   * Busca una sesión por su ID
   */
  findById(id: SessionId, tenantId: TenantId): Promise<Session | null>

  /**
   * Busca sesiones por usuario
   */
  findByUserId(userId: UserId, tenantId: TenantId, filters?: SessionFilters): Promise<Session[]>

  /**
   * Busca sesiones activas por usuario
   */
  findActiveByUserId(userId: UserId, tenantId: TenantId): Promise<Session[]>

  /**
   * Busca sesiones por tenant
   */
  findByTenantId(tenantId: TenantId, filters?: SessionFilters): Promise<Session[]>

  /**
   * Guarda una sesión (crear o actualizar)
   */
  save(session: Session): Promise<Session>

  /**
   * Elimina una sesión
   */
  delete(id: SessionId, tenantId: TenantId): Promise<void>

  /**
   * Elimina todas las sesiones de un usuario
   */
  deleteByUserId(userId: UserId, tenantId: TenantId): Promise<void>

  /**
   * Elimina sesiones expiradas
   */
  deleteExpired(tenantId: TenantId): Promise<number>

  /**
   * Verifica si una sesión existe
   */
  exists(id: SessionId, tenantId: TenantId): Promise<boolean>

  /**
   * Cuenta sesiones por usuario
   */
  countByUserId(userId: UserId, tenantId: TenantId, filters?: SessionFilters): Promise<number>

  /**
   * Cuenta sesiones activas por usuario
   */
  countActiveByUserId(userId: UserId, tenantId: TenantId): Promise<number>

  /**
   * Cuenta sesiones por tenant
   */
  countByTenantId(tenantId: TenantId, filters?: SessionFilters): Promise<number>

  /**
   * Busca sesiones sospechosas
   */
  findSuspiciousSessions(userId: UserId, tenantId: TenantId, currentIp: string): Promise<Session[]>

  /**
   * Actualiza la última actividad de una sesión
   */
  updateLastActivity(id: SessionId, tenantId: TenantId): Promise<void>
}
