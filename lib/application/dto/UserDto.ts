/**
 * DTO: UserDto
 * 
 * Data Transfer Object para usuarios.
 * Representa los datos que se transfieren entre capas.
 */

export interface UserDto {
  id: string
  email: string
  name: string
  tenantId: string | null
  isAdmin: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserDto {
  email: string
  name: string
  tenantId?: string
  isAdmin?: boolean
}

export interface UpdateUserDto {
  name?: string
  tenantId?: string
  isAdmin?: boolean
  isActive?: boolean
}

export interface UserFiltersDto {
  tenantId?: string
  isActive?: boolean
  isAdmin?: boolean
  limit?: number
  offset?: number
}

export interface UserListDto {
  users: UserDto[]
  total: number
  limit: number
  offset: number
}
