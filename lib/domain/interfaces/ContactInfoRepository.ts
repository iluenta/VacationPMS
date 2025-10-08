import { ContactInfo } from '../entities/ContactInfo'
import { ContactInfoId } from '../value-objects/ContactInfoId'
import { PersonId } from '../value-objects/PersonId'
import { TenantId } from '../value-objects/TenantId'

export interface ContactInfoFilters {
  contactName?: string
  phone?: string
  email?: string
  isPrimary?: boolean
  isActive?: boolean
  limit?: number
  offset?: number
}

export interface IContactInfoRepository {
  // Operaciones básicas
  findById(id: ContactInfoId, tenantId: TenantId): Promise<ContactInfo | null>
  findByPerson(personId: PersonId, tenantId: TenantId, filters?: ContactInfoFilters): Promise<ContactInfo[]>
  findActiveByPerson(personId: PersonId, tenantId: TenantId): Promise<ContactInfo[]>
  findPrimaryByPerson(personId: PersonId, tenantId: TenantId): Promise<ContactInfo | null>
  save(contactInfo: ContactInfo): Promise<ContactInfo>
  delete(id: ContactInfoId, tenantId: TenantId): Promise<void>
  exists(id: ContactInfoId, tenantId: TenantId): Promise<boolean>
  
  // Operaciones de búsqueda
  findByEmail(email: string, tenantId: TenantId): Promise<ContactInfo[]>
  findByPhone(phone: string, tenantId: TenantId): Promise<ContactInfo[]>
  searchByContactName(name: string, tenantId: TenantId): Promise<ContactInfo[]>
  
  // Operaciones de conteo
  countByPerson(personId: PersonId, tenantId: TenantId, filters?: ContactInfoFilters): Promise<number>
  countActiveByPerson(personId: PersonId, tenantId: TenantId): Promise<number>
  countPrimaryByPerson(personId: PersonId, tenantId: TenantId): Promise<number>
  
  // Operaciones de gestión de contactos primarios
  setAsPrimary(id: ContactInfoId, tenantId: TenantId): Promise<void>
  unsetPrimaryForPerson(personId: PersonId, tenantId: TenantId): Promise<void>
  
  // Operaciones de validación
  existsEmail(email: string, tenantId: TenantId, excludeContactId?: ContactInfoId): Promise<boolean>
  existsPhone(phone: string, tenantId: TenantId, excludeContactId?: ContactInfoId): Promise<boolean>
}