import { IFiscalAddressRepository } from '../../domain/interfaces/FiscalAddressRepository'
import { FiscalAddress } from '../../domain/entities/FiscalAddress'
import { FiscalAddressId } from '../../domain/value-objects/FiscalAddressId'
import { PersonId } from '../../domain/value-objects/PersonId'
import { TenantId } from '../../domain/value-objects/TenantId'

export class SupabaseFiscalAddressRepository implements IFiscalAddressRepository {
  constructor(private supabase: any) {}

  async findById(id: FiscalAddressId, tenantId: TenantId): Promise<FiscalAddress | null> {
    const { data, error } = await this.supabase
      .from('person_fiscal_addresses')
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

  async findByPerson(personId: PersonId, tenantId: TenantId): Promise<FiscalAddress | null> {
    const { data, error } = await this.supabase
      .from('person_fiscal_addresses')
      .select('*')
      .eq('person_id', personId.getValue())
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

  async save(fiscalAddress: FiscalAddress): Promise<FiscalAddress> {
    const data = this.mapToDatabase(fiscalAddress)

    const { data: result, error } = await this.supabase
      .from('person_fiscal_addresses')
      .upsert(data)
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return this.mapToEntity(result)
  }

  async delete(id: FiscalAddressId, tenantId: TenantId): Promise<boolean> {
    const { error } = await this.supabase
      .from('person_fiscal_addresses')
      .delete()
      .eq('id', id.getValue())
      .eq('tenant_id', tenantId.getValue())

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return true
  }

  private mapToEntity(data: any): FiscalAddress {
    return new FiscalAddress(
      FiscalAddressId.fromString(data.id),
      PersonId.fromString(data.person_id),
      TenantId.fromString(data.tenant_id),
      data.street,
      data.number || null,
      data.floor || null,
      data.door || null,
      data.postal_code,
      data.city,
      data.province || null,
      data.country,
      data.is_active,
      new Date(data.created_at),
      new Date(data.updated_at)
    )
  }

  private mapToDatabase(fiscalAddress: FiscalAddress): any {
    return {
      id: fiscalAddress.getId().getValue(),
      person_id: fiscalAddress.getPersonId().getValue(),
      tenant_id: fiscalAddress.getTenantId().getValue(),
      street: fiscalAddress.getStreet(),
      number: fiscalAddress.getNumber(),
      floor: fiscalAddress.getFloor(),
      door: fiscalAddress.getDoor(),
      postal_code: fiscalAddress.getPostalCode(),
      city: fiscalAddress.getCity(),
      province: fiscalAddress.getProvince(),
      country: fiscalAddress.getCountry(),
      is_active: fiscalAddress.getIsActive(),
      created_at: fiscalAddress.getCreatedAt().toISOString(),
      updated_at: fiscalAddress.getUpdatedAt().toISOString()
    }
  }
}
