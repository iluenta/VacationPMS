export interface PersonDto {
  id: string
  tenantId: string
  personTypeId: string
  firstName: string | null
  lastName: string | null
  businessName: string | null
  identificationType: 'DNI' | 'CIF' | 'NIE' | 'PASSPORT'
  identificationNumber: string
  personCategory: 'PHYSICAL' | 'LEGAL'
  isActive: boolean
  createdAt: string
  updatedAt: string
  // Campos calculados
  fullName: string
  displayName: string
  identificationDisplay: string
  // Contacto principal
  primaryContact?: {
    id: string
    contactName: string
    phone: string | null
    email: string | null
    position: string | null
    isPrimary: boolean
    isActive: boolean
  }
}

export interface CreatePersonDto {
  personTypeId: string
  personCategory: 'PHYSICAL' | 'LEGAL'
  identificationType: 'DNI' | 'CIF' | 'NIE' | 'PASSPORT'
  identificationNumber: string
  // Para personas físicas
  firstName?: string
  lastName?: string
  // Para personas jurídicas
  businessName?: string
  isActive?: boolean
}

export interface UpdatePersonDto {
  personTypeId?: string
  category?: 'PHYSICAL' | 'LEGAL'
  identification?: {
    type: 'DNI' | 'CIF' | 'NIE' | 'PASSPORT'
    number: string
  }
  firstName?: string
  lastName?: string
  businessName?: string
  isActive?: boolean
}

export interface PersonListDto {
  persons: PersonDto[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface PersonFiltersDto {
  name?: string
  identificationNumber?: string
  personTypeId?: string
  category?: 'PHYSICAL' | 'LEGAL'
  isActive?: boolean
  page?: number
  limit?: number
}
