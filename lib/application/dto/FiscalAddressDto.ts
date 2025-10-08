export interface FiscalAddressDto {
  id: string
  personId: string
  tenantId: string
  street: string
  number: string | null
  floor: string | null
  door: string | null
  postalCode: string
  city: string
  province: string | null
  country: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  // Campos calculados
  fullAddress: string
  shortAddress: string
  location: string
  isInSpain: boolean
}

export interface CreateFiscalAddressDto {
  street: string
  number?: string
  floor?: string
  door?: string
  postalCode: string
  city: string
  province?: string
  country?: string
}

export interface UpdateFiscalAddressDto {
  street?: string
  number?: string
  floor?: string
  door?: string
  postalCode?: string
  city?: string
  province?: string
  country?: string
}

export interface FiscalAddressFiltersDto {
  city?: string
  province?: string
  country?: string
  postalCode?: string
  isActive?: boolean
}
