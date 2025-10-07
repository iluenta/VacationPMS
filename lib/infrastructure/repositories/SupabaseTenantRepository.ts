import { SupabaseClient } from '@supabase/supabase-js'
import { TenantRepository, Tenant } from '../../domain/interfaces/TenantRepository'
import { TenantId } from '../../domain/value-objects/TenantId'

/**
 * Implementation: SupabaseTenantRepository
 * 
 * Implementación concreta del repositorio de tenants usando Supabase.
 * Maneja la persistencia y recuperación de datos de tenants.
 */

export class SupabaseTenantRepository implements TenantRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: TenantId): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('id', id.getValue())
      .single()

    if (error || !data) {
      return null
    }

    return this.mapToEntity(data)
  }

  async findByName(name: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('name', name)
      .single()

    if (error || !data) {
      return null
    }

    return this.mapToEntity(data)
  }

  async findAll(): Promise<Tenant[]> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .order('name')

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return data.map(this.mapToEntity)
  }

  async findActive(): Promise<Tenant[]> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return data.map(this.mapToEntity)
  }

  async save(tenant: Tenant): Promise<Tenant> {
    const tenantData = this.mapToDatabase(tenant)
    
    const { data, error } = await this.supabase
      .from('tenants')
      .upsert(tenantData)
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  async delete(id: TenantId): Promise<void> {
    const { error } = await this.supabase
      .from('tenants')
      .delete()
      .eq('id', id.getValue())

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
  }

  async exists(id: TenantId): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('id')
      .eq('id', id.getValue())
      .single()

    return !error && !!data
  }

  async existsByName(name: string, excludeId?: TenantId): Promise<boolean> {
    let query = this.supabase
      .from('tenants')
      .select('id')
      .eq('name', name)

    if (excludeId) {
      query = query.neq('id', excludeId.getValue())
    }

    const { data, error } = await query.single()

    return !error && !!data
  }

  async count(): Promise<number> {
    const { count, error } = await this.supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return count || 0
  }

  async countActive(): Promise<number> {
    const { count, error } = await this.supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return count || 0
  }

  /**
   * Mapea datos de la base de datos a entidad Tenant
   */
  private mapToEntity(data: any): Tenant {
    return {
      id: TenantId.fromString(data.id),
      name: data.name,
      description: data.description || '',
      isActive: data.is_active !== false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  /**
   * Mapea entidad Tenant a datos de la base de datos
   */
  private mapToDatabase(tenant: Tenant): any {
    return {
      id: tenant.id.getValue(),
      name: tenant.name,
      description: tenant.description,
      is_active: tenant.isActive,
      created_at: tenant.createdAt.toISOString(),
      updated_at: tenant.updatedAt.toISOString()
    }
  }
}
