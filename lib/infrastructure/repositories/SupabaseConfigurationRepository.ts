import { SupabaseClient } from '@supabase/supabase-js'
import { ConfigurationRepository, ConfigurationFilters } from '../../domain/interfaces/ConfigurationRepository'
import { ConfigurationType } from '../../domain/entities/ConfigurationType'
import { ConfigurationId } from '../../domain/value-objects/ConfigurationId'
import { TenantId } from '../../domain/value-objects/TenantId'

/**
 * Implementation: SupabaseConfigurationRepository
 * 
 * Implementación concreta del repositorio de configuraciones usando Supabase.
 * Maneja la persistencia y recuperación de datos de configuraciones.
 */

export class SupabaseConfigurationRepository implements ConfigurationRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: ConfigurationId, tenantId: TenantId): Promise<ConfigurationType | null> {
    const { data, error } = await this.supabase
      .from('configuration_types')
      .select('*')
      .eq('id', id.getValue())
      .eq('tenant_id', tenantId.getValue())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows returned
      }
      throw new Error(`Database error: ${error.message}`)
    }

    if (!data) {
      return null
    }

    return this.mapToEntity(data)
  }

  async findByTenant(tenantId: TenantId, filters?: ConfigurationFilters): Promise<ConfigurationType[]> {
    let query = this.supabase
      .from('configuration_types')
      .select('*')
      .eq('tenant_id', tenantId.getValue())

    // Aplicar filtros
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    if (filters?.name) {
      query = query.ilike('name', `%${filters.name}%`)
    }

    // Aplicar paginación
    if (filters?.limit && filters?.offset !== undefined) {
      query = query.range(filters.offset, filters.offset + filters.limit - 1)
    }

    const { data, error } = await query
      .order('sort_order')
      .order('name')

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    if (!data) {
      return []
    }

    return data.map(this.mapToEntity)
  }

  async findActiveByTenant(tenantId: TenantId): Promise<ConfigurationType[]> {
    const { data, error } = await this.supabase
      .from('configuration_types')
      .select('*')
      .eq('tenant_id', tenantId.getValue())
      .eq('is_active', true)
      .order('sort_order')
      .order('name')

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return data.map(this.mapToEntity)
  }

  async findByName(name: string, tenantId: TenantId): Promise<ConfigurationType | null> {
    const { data, error } = await this.supabase
      .from('configuration_types')
      .select('*')
      .eq('name', name)
      .eq('tenant_id', tenantId.getValue())
      .single()

    if (error || !data) {
      return null
    }

    return this.mapToEntity(data)
  }

  async save(configuration: ConfigurationType): Promise<ConfigurationType> {
    const configData = this.mapToDatabase(configuration)
    
    const { data, error } = await this.supabase
      .from('configuration_types')
      .upsert(configData)
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  async delete(id: ConfigurationId, tenantId: TenantId): Promise<void> {
    const { error } = await this.supabase
      .from('configuration_types')
      .delete()
      .eq('id', id.getValue())
      .eq('tenant_id', tenantId.getValue())

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
  }

  async exists(id: ConfigurationId, tenantId: TenantId): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('configuration_types')
      .select('id')
      .eq('id', id.getValue())
      .eq('tenant_id', tenantId.getValue())
      .single()

    return !error && !!data
  }

  async existsByName(name: string, tenantId: TenantId, excludeId?: ConfigurationId): Promise<boolean> {
    let query = this.supabase
      .from('configuration_types')
      .select('id')
      .eq('name', name)
      .eq('tenant_id', tenantId.getValue())

    if (excludeId) {
      query = query.neq('id', excludeId.getValue())
    }

    const { data, error } = await query.single()

    return !error && !!data
  }

  async countByTenant(tenantId: TenantId, filters?: ConfigurationFilters): Promise<number> {
    let query = this.supabase
      .from('configuration_types')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId.getValue())

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    if (filters?.name) {
      query = query.ilike('name', `%${filters.name}%`)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return count || 0
  }

  async countActiveByTenant(tenantId: TenantId): Promise<number> {
    const { count, error } = await this.supabase
      .from('configuration_types')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId.getValue())
      .eq('is_active', true)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return count || 0
  }

  async getNextSortOrder(tenantId: TenantId): Promise<number> {
    const { data, error } = await this.supabase
      .from('configuration_types')
      .select('sort_order')
      .eq('tenant_id', tenantId.getValue())
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Database error: ${error.message}`)
    }

    return data ? data.sort_order + 1 : 0
  }

  async reorderConfigurations(tenantId: TenantId, configurationIds: ConfigurationId[]): Promise<void> {
    // Actualizar el orden de cada configuración
    for (let i = 0; i < configurationIds.length; i++) {
      const { error } = await this.supabase
        .from('configuration_types')
        .update({ sort_order: i })
        .eq('id', configurationIds[i].getValue())
        .eq('tenant_id', tenantId.getValue())

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
    }
  }

  /**
   * Mapea datos de la base de datos a entidad ConfigurationType
   */
  private mapToEntity(data: any): ConfigurationType {
    return ConfigurationType.fromPlainObject({
      id: data.id,
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      isActive: data.is_active !== false,
      sortOrder: data.sort_order || 0,
      tenantId: data.tenant_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    })
  }

  /**
   * Mapea entidad ConfigurationType a datos de la base de datos
   */
  private mapToDatabase(configuration: ConfigurationType): any {
    return {
      id: configuration.id.getValue(),
      name: configuration.name,
      description: configuration.description,
      icon: configuration.icon,
      color: configuration.color,
      is_active: configuration.isActive,
      sort_order: configuration.sortOrder,
      tenant_id: configuration.tenantId.getValue(),
      created_at: configuration.createdAt.toISOString(),
      updated_at: configuration.updatedAt.toISOString()
    }
  }
}
