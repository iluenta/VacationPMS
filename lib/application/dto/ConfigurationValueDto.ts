/**
 * DTOs: ConfigurationValueDto
 * 
 * Data Transfer Objects para valores de configuración.
 * Define las estructuras de datos que se transfieren entre capas.
 */

export interface ConfigurationValueDto {
  id: string
  configurationTypeId: string
  value: string
  label: string
  description: string
  isActive: boolean
  sortOrder: number
  tenantId: string
  createdAt: string
  updatedAt: string
}

export interface CreateConfigurationValueDto {
  value: string
  label: string
  description?: string
  isActive?: boolean
  sortOrder?: number
}

export interface UpdateConfigurationValueDto {
  value?: string
  label?: string
  description?: string
  isActive?: boolean
  sortOrder?: number
}

export interface ConfigurationValueListDto {
  values: ConfigurationValueDto[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ConfigurationValueFiltersDto {
  isActive?: boolean
  value?: string
  label?: string
  page?: number
  limit?: number
}