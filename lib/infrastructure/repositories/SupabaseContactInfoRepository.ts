import { IContactInfoRepository } from '../../domain/interfaces/ContactInfoRepository'
import { ContactInfo } from '../../domain/entities/ContactInfo'
import { ContactInfoId } from '../../domain/value-objects/ContactInfoId'
import { PersonId } from '../../domain/value-objects/PersonId'
import { TenantId } from '../../domain/value-objects/TenantId'

export interface ContactInfoFilters {
  contactName?: string
  phone?: string
  email?: string
  isPrimary?: boolean
  isActive?: boolean
  limit?: number
  offset?: number
}

export class SupabaseContactInfoRepository implements IContactInfoRepository {
  constructor(private supabase: any) {}

  async findById(id: ContactInfoId, tenantId: TenantId): Promise<ContactInfo | null> {
    const { data, error } = await this.supabase
      .from('person_contact_infos')
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

  async findByPerson(personId: PersonId, tenantId: TenantId, filters?: ContactInfoFilters): Promise<ContactInfo[]> {
    let query = this.supabase
      .from('person_contact_infos')
      .select('*')
      .eq('person_id', personId.getValue())
      .eq('tenant_id', tenantId.getValue())

    // Aplicar filtros
    if (filters?.contactName) {
      query = query.ilike('contact_name', `%${filters.contactName}%`)
    }

    if (filters?.phone) {
      query = query.ilike('phone', `%${filters.phone}%`)
    }

    if (filters?.email) {
      query = query.ilike('email', `%${filters.email}%`)
    }

    if (filters?.isPrimary !== undefined) {
      query = query.eq('is_primary', filters.isPrimary)
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    // Ordenar por primario primero, luego por nombre
    query = query.order('is_primary', { ascending: false })
    query = query.order('contact_name', { ascending: true })

    // Aplicar paginación
    if (filters?.limit) {
      const offset = filters.offset || 0
      query = query.range(offset, offset + filters.limit - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    if (!data) {
      return []
    }

    return data.map(this.mapToEntity)
  }

  async countByPerson(personId: PersonId, tenantId: TenantId, filters?: ContactInfoFilters): Promise<number> {
    let query = this.supabase
      .from('person_contact_infos')
      .select('id', { count: 'exact', head: true })
      .eq('person_id', personId.getValue())
      .eq('tenant_id', tenantId.getValue())

    // Aplicar filtros
    if (filters?.contactName) {
      query = query.ilike('contact_name', `%${filters.contactName}%`)
    }

    if (filters?.phone) {
      query = query.ilike('phone', `%${filters.phone}%`)
    }

    if (filters?.email) {
      query = query.ilike('email', `%${filters.email}%`)
    }

    if (filters?.isPrimary !== undefined) {
      query = query.eq('is_primary', filters.isPrimary)
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

  async save(contactInfo: ContactInfo): Promise<ContactInfo> {
    const data = this.mapToDatabase(contactInfo)

    const { data: result, error } = await this.supabase
      .from('person_contact_infos')
      .upsert(data)
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return this.mapToEntity(result)
  }

  async delete(id: ContactInfoId, tenantId: TenantId): Promise<boolean> {
    const { error } = await this.supabase
      .from('person_contact_infos')
      .delete()
      .eq('id', id.getValue())
      .eq('tenant_id', tenantId.getValue())

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return true
  }

  async existsEmail(email: string, tenantId: TenantId): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('person_contact_infos')
      .select('id')
      .eq('email', email)
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

  async existsPhone(phone: string, tenantId: TenantId): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('person_contact_infos')
      .select('id')
      .eq('phone', phone)
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

  async unsetPrimaryForPerson(personId: PersonId, tenantId: TenantId): Promise<void> {
    const { error } = await this.supabase
      .from('person_contact_infos')
      .update({ is_primary: false })
      .eq('person_id', personId.getValue())
      .eq('tenant_id', tenantId.getValue())
      .eq('is_primary', true)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
  }

  private mapToEntity(data: any): ContactInfo {
    return new ContactInfo(
      ContactInfoId.fromString(data.id),
      PersonId.fromString(data.person_id),
      TenantId.fromString(data.tenant_id),
      data.contact_name,
      data.phone || null,
      data.email || null,
      data.position || null,
      data.is_primary,
      data.is_active,
      new Date(data.created_at),
      new Date(data.updated_at)
    )
  }

  private mapToDatabase(contactInfo: ContactInfo): any {
    return {
      id: contactInfo.getId().getValue(),
      person_id: contactInfo.getPersonId().getValue(),
      tenant_id: contactInfo.getTenantId().getValue(),
      contact_name: contactInfo.getContactName(),
      phone: contactInfo.getPhone(),
      email: contactInfo.getEmail(),
      position: contactInfo.getPosition(),
      is_primary: contactInfo.getIsPrimary(),
      is_active: contactInfo.getIsActive(),
      created_at: contactInfo.getCreatedAt().toISOString(),
      updated_at: contactInfo.getUpdatedAt().toISOString()
    }
  }
}
