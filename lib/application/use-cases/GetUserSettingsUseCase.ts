import { IUserSettingsRepository } from '../../domain/repositories/IUserSettingsRepository'
import { UserId } from '../../domain/value-objects/UserId'
import { UserSettingsDto } from '../dto/UserSettingsDto'
import { UserSettings } from '../../domain/entities/UserSettings'

export class GetUserSettingsUseCase {
  constructor(
    private readonly userSettingsRepository: IUserSettingsRepository
  ) {}

  async execute(userId: string): Promise<UserSettingsDto | null> {
    try {
      console.log('🎯 [USE CASE] Getting user settings for user:', userId)

      const userIdVO = new UserId(userId)
      
      // Buscar configuraciones del usuario
      let userSettings = await this.userSettingsRepository.findByUserId(userIdVO)
      
      // Si no existen, crear configuraciones por defecto
      if (!userSettings) {
        console.log('🎯 [USE CASE] User settings not found, creating default settings')
        userSettings = UserSettings.create({ userId: userIdVO })
        await this.userSettingsRepository.save(userSettings)
      }

      console.log('✅ [USE CASE] User settings retrieved successfully')

      return userSettings.toDto()
    } catch (error) {
      console.error('❌ [USE CASE] Error getting user settings:', error)
      throw error
    }
  }
}
