import { FiscalAddress } from '../entities/FiscalAddress'
import { FiscalAddressId } from '../value-objects/FiscalAddressId'
import { PersonId } from '../value-objects/PersonId'
import { TenantId } from '../value-objects/TenantId'

export interface FiscalAddressFilters {
  city?: string
  province?: string
  country?: string
  postalCode?: string
  isActive?: boolean
}

export interface IFiscalAddressRepository {
  // Operaciones básicas
  findById(id: FiscalAddressId, tenantId: TenantId): Promise<FiscalAddress | null>
  findByPerson(personId: PersonId, tenantId: TenantId): Promise<FiscalAddress | null>
  findActiveByPerson(personId: PersonId, tenantId: TenantId): Promise<FiscalAddress | null>
  save(fiscalAddress: FiscalAddress): Promise<FiscalAddress>
  delete(id: FiscalAddressId, tenantId: TenantId): Promise<void>
  exists(id: FiscalAddressId, tenantId: TenantId): Promise<boolean>
  
  // Operaciones de búsqueda
  findByCity(city: string, tenantId: TenantId): Promise<FiscalAddress[]>
  findByProvince(province: string, tenantId: TenantId): Promise<FiscalAddress[]>
  findByCountry(country: string, tenantId: TenantId): Promise<FiscalAddress[]>
  findByPostalCode(postalCode: string, tenantId: TenantId): Promise<FiscalAddress[]>
  searchByAddress(address: string, tenantId: TenantId): Promise<FiscalAddress[]>
  
  // Operaciones de conteo
  countByPerson(personId: PersonId, tenantId: TenantId): Promise<number>
  countByCity(city: string, tenantId: TenantId): Promise<number>
  countByProvince(province: string, tenantId: TenantId): Promise<number>
  countByCountry(country: string, tenantId: TenantId): Promise<number>
  
  // Operaciones de validación
  existsForPerson(personId: PersonId, tenantId: TenantId): Promise<boolean>
}
