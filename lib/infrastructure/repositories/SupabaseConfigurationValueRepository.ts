import { SupabaseClient } from '@supabase/supabase-js'
import { ConfigurationValueRepository, ConfigurationValueFilters } from '../../domain/interfaces/ConfigurationValueRepository'
import { ConfigurationValue } from '../../domain/entities/ConfigurationValue'
import { ConfigurationValueId } from '../../domain/value-objects/ConfigurationValueId'
import { ConfigurationId } from '../../domain/value-objects/ConfigurationId'
import { TenantId } from '../../domain/value-objects/TenantId'

/**
 * Implementation: SupabaseConfigurationValueRepository
 * 
 * Implementación concreta del repositorio de valores de configuración usando Supabase.
 */

export class SupabaseConfigurationValueRepository implements ConfigurationValueRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: ConfigurationValueId, tenantId: TenantId): Promise<ConfigurationValue | null> {
    const { data, error } = await this.supabase
      .from('configuration_values')
      .select('*')
      .eq('id', id.getValue())
      .eq('tenant_id', tenantId.getValue())
      .single()

    if (error || !data) {
      return null
    }

    return this.mapToEntity(data)
  }

  async findByConfigurationType(configurationTypeId: ConfigurationId, tenantId: TenantId, filters?: ConfigurationValueFilters): Promise<ConfigurationValue[]> {
    let query = this.supabase
      .from('configuration_values')
      .select('*')
      .eq('configuration_type_id', configurationTypeId.getValue())
      .eq('tenant_id', tenantId.getValue())

    // Aplicar filtros
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    if (filters?.value) {
      query = query.ilike('value', `%${filters.value}%`)
    }

    if (filters?.label) {
      query = query.ilike('label', `%${filters.label}%`)
    }

    // Aplicar paginación
    if (filters?.limit && filters?.offset !== undefined) {
      query = query.range(filters.offset, filters.offset + filters.limit - 1)
    }

    const { data, error } = await query
      .order('sort_order')
      .order('label')

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return data.map(this.mapToEntity)
  }

  async findActiveByConfigurationType(configurationTypeId: ConfigurationId, tenantId: TenantId): Promise<ConfigurationValue[]> {
    const { data, error } = await this.supabase
      .from('configuration_values')
      .select('*')
      .eq('configuration_type_id', configurationTypeId.getValue())
      .eq('tenant_id', tenantId.getValue())
      .eq('is_active', true)
      .order('sort_order')
      .order('label')

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return data.map(this.mapToEntity)
  }

  async findByValue(value: string, configurationTypeId: ConfigurationId, tenantId: TenantId): Promise<ConfigurationValue | null> {
    const { data, error } = await this.supabase
      .from('configuration_values')
      .select('*')
      .eq('value', value)
      .eq('configuration_type_id', configurationTypeId.getValue())
      .eq('tenant_id', tenantId.getValue())
      .single()

    if (error || !data) {
      return null
    }

    return this.mapToEntity(data)
  }

  async save(configurationValue: ConfigurationValue): Promise<ConfigurationValue> {
    const valueData = this.mapToDatabase(configurationValue)
    
    const { data, error } = await this.supabase
      .from('configuration_values')
      .upsert(valueData)
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  async delete(id: ConfigurationValueId, tenantId: TenantId): Promise<void> {
    const { error } = await this.supabase
      .from('configuration_values')
      .delete()
      .eq('id', id.getValue())
      .eq('tenant_id', tenantId.getValue())

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
  }

  async exists(id: ConfigurationValueId, tenantId: TenantId): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('configuration_values')
      .select('id')
      .eq('id', id.getValue())
      .eq('tenant_id', tenantId.getValue())
      .single()

    return !error && !!data
  }

  async existsByValue(value: string, configurationTypeId: ConfigurationId, tenantId: TenantId, excludeId?: ConfigurationValueId): Promise<boolean> {
    let query = this.supabase
      .from('configuration_values')
      .select('id')
      .eq('value', value)
      .eq('configuration_type_id', configurationTypeId.getValue())
      .eq('tenant_id', tenantId.getValue())

    if (excludeId) {
      query = query.neq('id', excludeId.getValue())
    }

    const { data, error } = await query.single()

    return !error && !!data
  }

  async countByConfigurationType(configurationTypeId: ConfigurationId, tenantId: TenantId, filters?: ConfigurationValueFilters): Promise<number> {
    let query = this.supabase
      .from('configuration_values')
      .select('*', { count: 'exact', head: true })
      .eq('configuration_type_id', configurationTypeId.getValue())
      .eq('tenant_id', tenantId.getValue())

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    if (filters?.value) {
      query = query.ilike('value', `%${filters.value}%`)
    }

    if (filters?.label) {
      query = query.ilike('label', `%${filters.label}%`)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return count || 0
  }

  async countActiveByConfigurationType(configurationTypeId: ConfigurationId, tenantId: TenantId): Promise<number> {
    const { count, error } = await this.supabase
      .from('configuration_values')
      .select('*', { count: 'exact', head: true })
      .eq('configuration_type_id', configurationTypeId.getValue())
      .eq('tenant_id', tenantId.getValue())
      .eq('is_active', true)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return count || 0
  }

  async getNextSortOrder(configurationTypeId: ConfigurationId, tenantId: TenantId): Promise<number> {
    const { data, error } = await this.supabase
      .from('configuration_values')
      .select('sort_order')
      .eq('configuration_type_id', configurationTypeId.getValue())
      .eq('tenant_id', tenantId.getValue())
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Database error: ${error.message}`)
    }

    return data ? data.sort_order + 1 : 0
  }

  async reorderValues(configurationTypeId: ConfigurationId, tenantId: TenantId, valueIds: ConfigurationValueId[]): Promise<void> {
    // Actualizar el orden de cada valor
    for (let i = 0; i < valueIds.length; i++) {
      const { error } = await this.supabase
        .from('configuration_values')
        .update({ sort_order: i })
        .eq('id', valueIds[i].getValue())
        .eq('configuration_type_id', configurationTypeId.getValue())
        .eq('tenant_id', tenantId.getValue())

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
    }
  }

  /**
   * Mapea datos de la base de datos a entidad ConfigurationValue
   */
  private mapToEntity(data: any): ConfigurationValue {
    return ConfigurationValue.fromPlainObject({
      id: data.id,
      configurationTypeId: data.configuration_type_id,
      value: data.value,
      label: data.label,
      description: data.description || '',
      isActive: data.is_active !== false,
      sortOrder: data.sort_order || 0,
      tenantId: data.tenant_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    })
  }

  /**
   * Mapea entidad ConfigurationValue a datos de la base de datos
   */
  private mapToDatabase(configurationValue: ConfigurationValue): any {
    return {
      id: configurationValue.id.getValue(),
      configuration_type_id: configurationValue.configurationTypeId.getValue(),
      value: configurationValue.value,
      label: configurationValue.label,
      description: configurationValue.description,
      is_active: configurationValue.isActive,
      sort_order: configurationValue.sortOrder,
      tenant_id: configurationValue.tenantId.getValue(),
      created_at: configurationValue.createdAt.toISOString(),
      updated_at: configurationValue.updatedAt.toISOString()
    }
  }
}
