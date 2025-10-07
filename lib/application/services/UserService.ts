import { UserRepository } from '../../domain/interfaces/UserRepository'
import { User } from '../../domain/entities/User'
import { UserId } from '../../domain/value-objects/UserId'
import { TenantId } from '../../domain/value-objects/TenantId'

/**
 * Service: UserService
 * 
 * Servicio de aplicación para manejar la lógica de negocio de usuarios.
 * Orquesta las operaciones entre repositorios y entidades.
 */

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Obtiene un usuario por su ID
   */
  async getUserById(id: UserId): Promise<User | null> {
    return await this.userRepository.findById(id)
  }

  /**
   * Obtiene un usuario por su email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email)
  }

  /**
   * Valida si un usuario puede acceder a un tenant específico
   */
  async validateUserAccess(userId: UserId, tenantId: TenantId): Promise<boolean> {
    const user = await this.getUserById(userId)
    if (!user) {
      return false
    }

    return user.canAccessTenant(tenantId)
  }

  /**
   * Determina el tenant ID que debe usar un usuario
   */
  async determineTenantId(user: User, requestedTenantId?: string): Promise<TenantId> {
    // Si el usuario es admin y se especifica un tenant, usarlo
    if (user.isAdmin && requestedTenantId) {
      return TenantId.fromString(requestedTenantId)
    }

    // Si el usuario no es admin, usar su tenant asignado
    if (!user.isAdmin && user.tenantId) {
      return user.tenantId
    }

    // Si es admin sin tenant especificado, lanzar error
    if (user.isAdmin && !requestedTenantId) {
      throw new Error('Admin users must specify a tenant')
    }

    // Usuario sin tenant asignado
    throw new Error('User does not have a tenant assigned')
  }

  /**
   * Obtiene usuarios por tenant
   */
  async getUsersByTenant(tenantId: TenantId): Promise<User[]> {
    return await this.userRepository.findByTenant(tenantId)
  }

  /**
   * Obtiene usuarios activos por tenant
   */
  async getActiveUsersByTenant(tenantId: TenantId): Promise<User[]> {
    return await this.userRepository.findActiveByTenant(tenantId)
  }

  /**
   * Obtiene todos los usuarios (solo para admins)
   */
  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll()
  }

  /**
   * Crea un nuevo usuario
   */
  async createUser(
    email: string,
    name: string,
    tenantId?: TenantId,
    isAdmin: boolean = false
  ): Promise<User> {
    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findByEmail(email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Crear nueva entidad User
    const user = new User(
      UserId.fromString(crypto.randomUUID()),
      email,
      name,
      tenantId || null,
      isAdmin,
      true, // isActive
      new Date(),
      new Date()
    )

    // Guardar en repositorio
    return await this.userRepository.save(user)
  }

  /**
   * Actualiza un usuario
   */
  async updateUser(userId: UserId, updates: Partial<{
    name: string
    tenantId: TenantId
    isAdmin: boolean
    isActive: boolean
  }>): Promise<User> {
    const user = await this.getUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    let updatedUser = user

    // Aplicar actualizaciones
    if (updates.name !== undefined) {
      updatedUser = updatedUser.updateName(updates.name)
    }

    if (updates.tenantId !== undefined) {
      updatedUser = updatedUser.changeTenant(updates.tenantId)
    }

    if (updates.isActive !== undefined) {
      updatedUser = updates.isActive 
        ? updatedUser.activate() 
        : updatedUser.deactivate()
    }

    // Guardar cambios
    return await this.userRepository.save(updatedUser)
  }

  /**
   * Elimina un usuario
   */
  async deleteUser(userId: UserId): Promise<void> {
    const user = await this.getUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    await this.userRepository.delete(userId)
  }

  /**
   * Cuenta usuarios por tenant
   */
  async countUsersByTenant(tenantId: TenantId): Promise<number> {
    return await this.userRepository.countByTenant(tenantId)
  }

  /**
   * Cuenta usuarios activos por tenant
   */
  async countActiveUsersByTenant(tenantId: TenantId): Promise<number> {
    return await this.userRepository.countActiveByTenant(tenantId)
  }
}
