export interface ContactInfoDto {
  id: string
  personId: string
  tenantId: string
  contactName: string
  phone: string | null
  email: string | null
  position: string | null
  isPrimary: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  // Campos calculados
  displayName: string
  contactDisplay: string
  hasPhone: boolean
  hasEmail: boolean
}

export interface CreateContactInfoDto {
  contactName: string
  phone?: string
  email?: string
  position?: string
  isPrimary?: boolean
}

export interface UpdateContactInfoDto {
  contactName?: string
  phone?: string
  email?: string
  position?: string
  isPrimary?: boolean
}

export interface ContactInfoListDto {
  contactInfos: ContactInfoDto[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ContactInfoFiltersDto {
  contactName?: string
  phone?: string
  email?: string
  isPrimary?: boolean
  isActive?: boolean
  page?: number
  limit?: number
}
