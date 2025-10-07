/**
 * DTO: ConfigurationDto
 * 
 * Data Transfer Object para configuraciones.
 * Representa los datos que se transfieren entre capas.
 */

export interface ConfigurationDto {
  id: string
  name: string
  description: string
  icon: string
  color: string
  isActive: boolean
  sortOrder: number
  tenantId: string
  createdAt: string
  updatedAt: string
}

export interface CreateConfigurationDto {
  name: string
  description: string
  icon: string
  color: string
  sortOrder?: number
}

export interface UpdateConfigurationDto {
  name?: string
  description?: string
  icon?: string
  color?: string
  isActive?: boolean
  sortOrder?: number
}

export interface ConfigurationFiltersDto {
  isActive?: boolean
  name?: string
  limit?: number
  offset?: number
}

export interface ConfigurationListDto {
  configurations: ConfigurationDto[]
  total: number
  limit: number
  offset: number
}
