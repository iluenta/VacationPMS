import { UserSettings } from '../entities/UserSettings'
import { UserSettingsId } from '../value-objects/UserSettingsId'
import { UserId } from '../value-objects/UserId'
import { UserSettingsFilters } from '../../application/dto/UserSettingsDto'

export interface IUserSettingsRepository {
  // Operaciones básicas CRUD
  save(userSettings: UserSettings): Promise<UserSettings>
  findById(id: UserSettingsId): Promise<UserSettings | null>
  findByUserId(userId: UserId): Promise<UserSettings | null>
  update(userSettings: UserSettings): Promise<UserSettings>
  delete(id: UserSettingsId): Promise<void>

  // Operaciones de búsqueda y filtrado
  findAll(filters?: UserSettingsFilters): Promise<UserSettings[]>
  count(filters?: UserSettingsFilters): Promise<number>

  // Operaciones específicas de negocio
  existsByUserId(userId: UserId): Promise<boolean>
  createDefaultForUser(userId: UserId): Promise<UserSettings>
  
  // Operaciones de configuración específicas
  updateLanguage(userId: UserId, language: string): Promise<UserSettings>
  updateNotificationSettings(userId: UserId, settings: {
    email?: boolean
    push?: boolean
    sms?: boolean
  }): Promise<UserSettings>
  updateSecuritySettings(userId: UserId, settings: {
    autoLogoutMinutes?: number
    sessionTimeout?: boolean
    loginNotifications?: boolean
    twoFactorEnabled?: boolean
  }): Promise<UserSettings>
}
