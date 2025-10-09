import { IPersonRepository, PersonFilters } from '../../domain/interfaces/PersonRepository'
import { Person } from '../../domain/entities/Person'
import { PersonId } from '../../domain/value-objects/PersonId'
import { TenantId } from '../../domain/value-objects/TenantId'
import { ConfigurationId } from '../../domain/value-objects/ConfigurationId'

export class SupabasePersonRepository implements IPersonRepository {
  constructor(private supabase: any) {}

  async findById(id: PersonId, tenantId: TenantId): Promise<Person | null> {
    const { data, error } = await this.supabase
      .from('persons')
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

  async findByTenant(tenantId: TenantId, filters?: PersonFilters): Promise<Person[]> {
    console.log('💾 [REPOSITORY] findByTenant called with:', {
      tenantId: tenantId.getValue(),
      filters
    })

    let query = this.supabase
      .from('persons')
      .select(`
        *,
        person_contact_infos!left(
          id,
          contact_name,
          phone,
          email,
          position,
          is_primary,
          is_active
        )
      `)
      .eq('tenant_id', tenantId.getValue())
      .eq('person_contact_infos.is_primary', true)

    // Aplicar filtros
    if (filters?.name) {
      query = query.or(`first_name.ilike.%${filters.name}%,last_name.ilike.%${filters.name}%,business_name.ilike.%${filters.name}%,person_contact_infos.phone.ilike.%${filters.name}%,person_contact_infos.email.ilike.%${filters.name}%`)
    }

    if (filters?.identificationNumber) {
      query = query.ilike('identification_number', `%${filters.identificationNumber}%`)
    }

    if (filters?.personTypeId) {
      query = query.eq('person_type_id', filters.personTypeId)
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    // Ordenar por nombre (first_name para físicos, business_name para legales)
    query = query.order('first_name', { ascending: true, nullsFirst: false })
                 .order('business_name', { ascending: true, nullsFirst: false })

    // Aplicar paginación
    if (filters?.limit) {
      const offset = filters.offset || 0
      query = query.range(offset, offset + filters.limit - 1)
    }

    console.log('🔍 [REPOSITORY] About to execute query with:', {
      table: 'persons',
      tenantId: tenantId.getValue(),
      hasFilters: !!filters,
      willOrder: true,
      willRange: !!filters?.limit
    })

    const { data, error } = await query

    console.log('💾 [REPOSITORY] Supabase response:', {
      hasData: !!data,
      dataLength: data?.length || 0,
      hasError: !!error,
      errorMessage: error?.message,
      errorCode: error?.code,
      firstRow: data?.[0] ? {
        id: data[0].id,
        first_name: data[0].first_name,
        last_name: data[0].last_name,
        tenant_id: data[0].tenant_id
      } : null
    })

    if (error) {
      console.error('❌ [REPOSITORY] Database error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    if (!data) {
      console.log('⚠️ [REPOSITORY] No data returned')
      return []
    }

    console.log('✅ [REPOSITORY] Returning', data.length, 'persons')
    return data.map((row: any) => this.mapToEntityWithContact(row))
  }

  async countByTenant(tenantId: TenantId, filters?: PersonFilters): Promise<number> {
    let query = this.supabase
      .from('persons')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId.getValue())

    // Aplicar los mismos filtros que en findByTenant
    if (filters?.name) {
      query = query.or(`first_name.ilike.%${filters.name}%,last_name.ilike.%${filters.name}%,business_name.ilike.%${filters.name}%,person_contact_infos.phone.ilike.%${filters.name}%,person_contact_infos.email.ilike.%${filters.name}%`)
    }

    if (filters?.identificationNumber) {
      query = query.ilike('identification_number', `%${filters.identificationNumber}%`)
    }

    if (filters?.personTypeId) {
      query = query.eq('person_type_id', filters.personTypeId)
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return count || 0
  }

  async save(person: Person): Promise<Person> {
    const data = this.mapToDatabase(person)

    const { data: result, error } = await this.supabase
      .from('persons')
      .upsert(data)
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return this.mapToEntity(result)
  }

  async delete(id: PersonId, tenantId: TenantId): Promise<void> {
    const { error } = await this.supabase
      .from('persons')
      .delete()
      .eq('id', id.getValue())
      .eq('tenant_id', tenantId.getValue())

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
  }

  async existsIdentificationNumber(identificationNumber: string, tenantId: TenantId): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('persons')
      .select('id')
      .eq('identification_number', identificationNumber)
      .eq('tenant_id', tenantId.getValue())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return false // No rows returned
      }
      throw new Error(`Database error: ${error.message}`)
    }

    return !!data
  }

  async findByIdentificationNumber(identificationNumber: string, tenantId: TenantId): Promise<Person | null> {
    const { data, error } = await this.supabase
      .from('persons')
      .select('*')
      .eq('identification_number', identificationNumber)
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

  private mapToEntity(data: any): Person {
    console.log('🔄 [REPOSITORY] Mapping data to Person entity:', {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      hasContactInfo: !!data.contact_info
    })
    
    const person = new Person(
      PersonId.fromString(data.id),
      TenantId.fromString(data.tenant_id),
      ConfigurationId.fromString(data.person_type_id),
      data.first_name,
      data.last_name || null,
      data.business_name || null,
      data.identification_type,
      data.identification_number,
      data.person_category,
      data.is_active,
      new Date(data.created_at),
      new Date(data.updated_at)
    )
    
    // El contacto principal se manejará en el DTO
    
    console.log('✅ [REPOSITORY] Person entity created:', {
      hasGetId: typeof person.getId === 'function',
      hasGetFullName: typeof person.getFullName === 'function',
      idValue: person.getId().getValue(),
      hasPrimaryContact: !!(person as any).primaryContact
    })
    
    return person
  }

  private mapToEntityWithContact(data: any): Person {
    const person = this.mapToEntity(data)
    
    // Añadir información del contacto principal al objeto para uso posterior
    if (data.person_contact_infos && data.person_contact_infos.length > 0) {
      const primaryContact = data.person_contact_infos[0]
      ;(person as any).primaryContact = {
        id: primaryContact.id,
        contactName: primaryContact.contact_name,
        phone: primaryContact.phone,
        email: primaryContact.email,
        position: primaryContact.position,
        isPrimary: primaryContact.is_primary,
        isActive: primaryContact.is_active
      }
    }
    
    return person
  }

  private mapToDatabase(person: Person): any {
    return {
      id: person.getId().getValue(),
      tenant_id: person.getTenantId().getValue(),
      person_type_id: person.getPersonTypeId().getValue(),
      first_name: person.getFirstName(),
      last_name: person.getLastName(),
      business_name: person.getBusinessName(),
      identification_number: person.getIdentificationNumber(),
      identification_type: person.getIdentificationType(),
      person_category: person.getPersonCategory(),
      is_active: person.getIsActive(),
      created_at: person.getCreatedAt().toISOString(),
      updated_at: person.getUpdatedAt().toISOString()
    }
  }

  // Métodos faltantes de la interfaz
  async findActiveByTenant(tenantId: TenantId): Promise<Person[]> {
    return this.findByTenant(tenantId, { isActive: true })
  }

  async exists(id: PersonId, tenantId: TenantId): Promise<boolean> {
    const person = await this.findById(id, tenantId)
    return person !== null
  }

  async findByIdentification(
    tenantId: TenantId, 
    identificationType: string, 
    identificationNumber: string
  ): Promise<Person | null> {
    const { data, error } = await this.supabase
      .from('persons')
      .select('*')
      .eq('tenant_id', tenantId.getValue())
      .eq('identification_type', identificationType)
      .eq('identification_number', identificationNumber)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Database error: ${error.message}`)
    }

    if (!data) {
      return null
    }

    return this.mapToEntity(data)
  }

  async findByPersonType(
    tenantId: TenantId, 
    personTypeId: ConfigurationId
  ): Promise<Person[]> {
    const { data, error } = await this.supabase
      .from('persons')
      .select('*')
      .eq('tenant_id', tenantId.getValue())
      .eq('person_type_id', personTypeId.getValue())

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    if (!data) {
      return []
    }

    return data.map(this.mapToEntity)
  }

  async searchByName(tenantId: TenantId, name: string): Promise<Person[]> {
    const { data, error } = await this.supabase
      .from('persons')
      .select('*')
      .eq('tenant_id', tenantId.getValue())
      .or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%,business_name.ilike.%${name}%`)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    if (!data) {
      return []
    }

    return data.map(this.mapToEntity)
  }

  async countActiveByTenant(tenantId: TenantId): Promise<number> {
    return this.countByTenant(tenantId, { isActive: true })
  }

  async countByPersonType(tenantId: TenantId, personTypeId: ConfigurationId): Promise<number> {
    const { count, error } = await this.supabase
      .from('persons')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId.getValue())
      .eq('person_type_id', personTypeId.getValue())

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return count || 0
  }

  async existsIdentification(
    tenantId: TenantId,
    identificationType: string,
    identificationNumber: string,
    excludePersonId?: PersonId
  ): Promise<boolean> {
    let query = this.supabase
      .from('persons')
      .select('id')
      .eq('tenant_id', tenantId.getValue())
      .eq('identification_type', identificationType)
      .eq('identification_number', identificationNumber)

    if (excludePersonId) {
      query = query.neq('id', excludePersonId.getValue())
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return false
      }
      throw new Error(`Database error: ${error.message}`)
    }

    return !!data
  }
}
