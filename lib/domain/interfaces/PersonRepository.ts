import { Person } from '../entities/Person'
import { PersonId } from '../value-objects/PersonId'
import { TenantId } from '../value-objects/TenantId'
import { ConfigurationId } from '../value-objects/ConfigurationId'

export interface PersonFilters {
  name?: string
  identificationNumber?: string
  personTypeId?: string
  category?: 'PHYSICAL' | 'LEGAL'
  isActive?: boolean
  limit?: number
  offset?: number
}

export interface IPersonRepository {
  // Operaciones básicas
  findById(id: PersonId, tenantId: TenantId): Promise<Person | null>
  findByTenant(tenantId: TenantId, filters?: PersonFilters): Promise<Person[]>
  findActiveByTenant(tenantId: TenantId): Promise<Person[]>
  save(person: Person): Promise<Person>
  delete(id: PersonId, tenantId: TenantId): Promise<void>
  exists(id: PersonId, tenantId: TenantId): Promise<boolean>
  
  // Operaciones de búsqueda
  findByIdentification(
    tenantId: TenantId, 
    identificationType: string, 
    identificationNumber: string
  ): Promise<Person | null>
  
  findByPersonType(
    tenantId: TenantId, 
    personTypeId: ConfigurationId
  ): Promise<Person[]>
  
  searchByName(
    tenantId: TenantId, 
    name: string
  ): Promise<Person[]>
  
  // Operaciones de conteo
  countByTenant(tenantId: TenantId, filters?: PersonFilters): Promise<number>
  countActiveByTenant(tenantId: TenantId): Promise<number>
  countByPersonType(tenantId: TenantId, personTypeId: ConfigurationId): Promise<number>
  
  // Operaciones de validación
  existsIdentification(
    tenantId: TenantId,
    identificationType: string,
    identificationNumber: string,
    excludePersonId?: PersonId
  ): Promise<boolean>
}
