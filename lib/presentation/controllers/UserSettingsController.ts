import { NextRequest, NextResponse } from 'next/server'
import { GetUserSettingsUseCase } from '../../application/use-cases/GetUserSettingsUseCase'
import { UpdateUserSettingsUseCase } from '../../application/use-cases/UpdateUserSettingsUseCase'
import { ChangePasswordUseCase } from '../../application/use-cases/ChangePasswordUseCase'
import { requireAuthenticatedUser } from '../middleware/get-authenticated-user'
import { UpdateUserSettingsDto } from '../../application/dto/UserSettingsDto'

export class UserSettingsController {
  constructor(
    private readonly getUserSettingsUseCase: GetUserSettingsUseCase,
    private readonly updateUserSettingsUseCase: UpdateUserSettingsUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase
  ) {}

  async getUserSettings(request: NextRequest): Promise<NextResponse> {
    try {
      console.log('🔧 [CONTROLLER] Getting user settings')

      // Obtener usuario autenticado
      const userId = await requireAuthenticatedUser(request)

      console.log('🔧 [CONTROLLER] User authenticated:', userId)

      // Ejecutar use case
      const settings = await this.getUserSettingsUseCase.execute(userId)

      console.log('🔧 [CONTROLLER] Sending response:', { success: true })

      return NextResponse.json({
        success: true,
        data: settings
      })
    } catch (error: any) {
      console.error('❌ [CONTROLLER] Error getting user settings:', error)
      
      if (error.message === 'Authorization header required') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Internal server error', message: error.message },
        { status: 500 }
      )
    }
  }

  async updateUserSettings(request: NextRequest): Promise<NextResponse> {
    try {
      console.log('🔧 [CONTROLLER] Updating user settings')

      // Obtener usuario autenticado
      const userId = await requireAuthenticatedUser(request)

      // Parsear body
      const data: UpdateUserSettingsDto = await request.json()
      console.log('🔧 [CONTROLLER] Update data:', data)

      // Ejecutar use case
      const updatedSettings = await this.updateUserSettingsUseCase.execute(userId, data)

      console.log('🔧 [CONTROLLER] Sending response:', { success: true })

      return NextResponse.json({
        success: true,
        data: updatedSettings
      })
    } catch (error: any) {
      console.error('❌ [CONTROLLER] Error updating user settings:', error)
      
      if (error.message === 'Authorization header required') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Internal server error', message: error.message },
        { status: 500 }
      )
    }
  }

  async changePassword(request: NextRequest): Promise<NextResponse> {
    try {
      console.log('🔧 [CONTROLLER] Changing password')

      // Obtener usuario autenticado
      const userId = await requireAuthenticatedUser(request)

      // Parsear body
      const body = await request.json()
      console.log('🔧 [CONTROLLER] Password change data:', { 
        hasCurrentPassword: !!body.currentPassword,
        hasNewPassword: !!body.newPassword,
        hasConfirmPassword: !!body.confirmPassword
      })

      // Validar datos de entrada
      if (!body.currentPassword || !body.newPassword || !body.confirmPassword) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields', message: 'Current password, new password, and confirmation are required' },
          { status: 400 }
        )
      }

      if (body.newPassword !== body.confirmPassword) {
        return NextResponse.json(
          { success: false, error: 'New passwords do not match' },
          { status: 400 }
        )
      }

      // Ejecutar use case
      const success = await this.changePasswordUseCase.execute(
        userId,
        body.currentPassword,
        body.newPassword
      )

      console.log('✅ [CONTROLLER] Password changed successfully')

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully'
      })
    } catch (error: any) {
      // Diferenciar entre errores de validación y errores del sistema
      const isValidationError = error.message && (
        error.message.includes('La contraseña') ||
        error.message.includes('Password') ||
        error.message.includes('User not found')
      )
      
      if (isValidationError) {
        // Errores de validación - no loguear como error
        console.log('⚠️ [CONTROLLER] Password validation failed:', error.message)
      } else {
        // Errores del sistema - sí loguear
        console.error('❌ [CONTROLLER] System error changing password:', error)
      }
      
      if (error.message === 'Authorization header required') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to change password', message: error.message },
        { status: 400 }
      )
    }
  }
}
