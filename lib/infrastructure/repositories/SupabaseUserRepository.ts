import { SupabaseClient } from '@supabase/supabase-js'
import { UserRepository } from '../../domain/interfaces/UserRepository'
import { User } from '../../domain/entities/User'
import { UserId } from '../../domain/value-objects/UserId'
import { TenantId } from '../../domain/value-objects/TenantId'

/**
 * Implementation: SupabaseUserRepository
 * 
 * Implementación concreta del repositorio de usuarios usando Supabase.
 * Maneja la persistencia y recuperación de datos de usuarios.
 */

export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: UserId): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id.getValue())
      .single()

    if (error || !data) {
      return null
    }

    return this.mapToEntity(data)
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) {
      return null
    }

    return this.mapToEntity(data)
  }

  async findByTenant(tenantId: TenantId): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId.getValue())
      .order('name')

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return data.map(this.mapToEntity)
  }

  async findAll(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .order('name')

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return data.map(this.mapToEntity)
  }

  async save(user: User): Promise<User> {
    const userData = this.mapToDatabase(user)
    
    const { data, error } = await this.supabase
      .from('users')
      .upsert(userData)
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  async delete(id: UserId): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', id.getValue())

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
  }

  async exists(id: UserId): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('id', id.getValue())
      .single()

    return !error && !!data
  }

  async existsByEmail(email: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    return !error && !!data
  }

  async findActiveByTenant(tenantId: TenantId): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId.getValue())
      .eq('is_active', true)
      .order('name')

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return data.map(this.mapToEntity)
  }

  async findAdmins(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('is_admin', true)
      .order('name')

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return data.map(this.mapToEntity)
  }

  async countByTenant(tenantId: TenantId): Promise<number> {
    const { count, error } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId.getValue())

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return count || 0
  }

  async countActiveByTenant(tenantId: TenantId): Promise<number> {
    const { count, error } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId.getValue())
      .eq('is_active', true)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return count || 0
  }

  /**
   * Mapea datos de la base de datos a entidad User
   */
  private mapToEntity(data: any): User {
    return User.fromPlainObject({
      id: data.id,
      email: data.email,
      name: data.name || data.email.split('@')[0] || 'Usuario', // Usar email como nombre por defecto
      tenantId: data.tenant_id,
      isAdmin: data.is_admin || false,
      isActive: data.is_active !== false,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    })
  }

  /**
   * Mapea entidad User a datos de la base de datos
   */
  private mapToDatabase(user: User): any {
    return {
      id: user.id.getValue(),
      email: user.email,
      name: user.name,
      tenant_id: user.tenantId?.getValue() || null,
      is_admin: user.isAdmin,
      is_active: user.isActive,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString()
    }
  }
}
