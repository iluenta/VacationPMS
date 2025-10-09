import { IUserRepository } from '../../domain/repositories/IUserRepository'
import { IUserSettingsRepository } from '../../domain/repositories/IUserSettingsRepository'
import { UserId } from '../../domain/value-objects/UserId'
import { PasswordPolicyManager } from '../../auth/password-policies'
import { createClient } from '../../supabase/server'

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userSettingsRepository: IUserSettingsRepository
  ) {}

  async execute(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      console.log('🎯 [USE CASE] Changing password for user:', userId)

      const userIdVO = new UserId(userId)
      
      // Obtener usuario
      const user = await this.userRepository.findById(userIdVO)
      if (!user) {
        throw new Error('User not found')
      }

      const userEmail = typeof user.email === 'string' ? user.email : user.email.getValue()
      
      // Validar contraseña actual usando Supabase Auth
      const supabase = await createClient()
      
      // Intentar autenticar con la contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword
      })

      if (signInError) {
        console.log('⚠️ [USE CASE] Current password is incorrect')
        throw new Error('La contraseña actual es incorrecta')
      }

      console.log('✅ [USE CASE] Current password verified')

      // Validar nueva contraseña contra políticas
      const passwordValidation = PasswordPolicyManager.validatePassword(
        newPassword,
        {
          email: userEmail,
          name: user.fullName || ''
        }
      )

      if (!passwordValidation.isValid) {
        // Error de validación - loguear como info, no como error
        console.log('⚠️ [USE CASE] Password validation failed:', passwordValidation.errors.join(', '))
        throw new Error(passwordValidation.errors.join(', '))
      }

      // Cambiar contraseña usando Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('❌ [USE CASE] Supabase Auth error:', error)
        throw new Error(error.message)
      }

      console.log('✅ [USE CASE] Password changed successfully')

      return true
    } catch (error) {
      // El error ya fue logueado arriba con el nivel apropiado
      throw error
    }
  }
}
