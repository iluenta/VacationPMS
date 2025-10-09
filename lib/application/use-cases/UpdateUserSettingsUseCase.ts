import { IUserSettingsRepository } from '../../domain/repositories/IUserSettingsRepository'
import { UserId } from '../../domain/value-objects/UserId'
import { UpdateUserSettingsDto, UserSettingsDto } from '../dto/UserSettingsDto'
import { UserSettings } from '../../domain/entities/UserSettings'

export class UpdateUserSettingsUseCase {
  constructor(
    private readonly userSettingsRepository: IUserSettingsRepository
  ) {}

  async execute(userId: string, data: UpdateUserSettingsDto): Promise<UserSettingsDto> {
    try {
      console.log('🎯 [USE CASE] Updating user settings for user:', userId)

      const userIdVO = new UserId(userId)
      
      // Buscar configuraciones existentes
      let userSettings = await this.userSettingsRepository.findByUserId(userIdVO)
      
      // Si no existen, crear configuraciones por defecto
      if (!userSettings) {
        console.log('🎯 [USE CASE] User settings not found, creating default settings')
        userSettings = UserSettings.create({ userId: userIdVO })
        await this.userSettingsRepository.save(userSettings)
      }

      // Actualizar usando el método update de la entidad
      userSettings.update(data)

      // Guardar cambios
      await this.userSettingsRepository.update(userSettings)

      console.log('✅ [USE CASE] User settings updated successfully')

      return userSettings.toDto()
    } catch (error) {
      console.error('❌ [USE CASE] Error updating user settings:', error)
      throw error
    }
  }
}
