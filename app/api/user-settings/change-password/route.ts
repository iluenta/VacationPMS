import { NextRequest, NextResponse } from 'next/server'
import { UserSettingsController } from '../../../../lib/presentation/controllers/UserSettingsController'
import { GetUserSettingsUseCase } from '../../../../lib/application/use-cases/GetUserSettingsUseCase'
import { UpdateUserSettingsUseCase } from '../../../../lib/application/use-cases/UpdateUserSettingsUseCase'
import { ChangePasswordUseCase } from '../../../../lib/application/use-cases/ChangePasswordUseCase'
import { getUserSettingsRepository, getUserRepository } from '../../../../lib/infrastructure/container'

// Reutilizar el controller de la ruta padre
let userSettingsController: UserSettingsController | null = null

async function getUserSettingsController(): Promise<UserSettingsController> {
  if (!userSettingsController) {
    const userSettingsRepository = await getUserSettingsRepository()
    const userRepository = await getUserRepository()

    const getUserSettingsUseCase = new GetUserSettingsUseCase(userSettingsRepository)
    const updateUserSettingsUseCase = new UpdateUserSettingsUseCase(userSettingsRepository)
    const changePasswordUseCase = new ChangePasswordUseCase(userRepository, userSettingsRepository)

    userSettingsController = new UserSettingsController(
      getUserSettingsUseCase,
      updateUserSettingsUseCase,
      changePasswordUseCase
    )
  }

  return userSettingsController
}

export async function POST(request: NextRequest) {
  try {
    const controller = await getUserSettingsController()
    return await controller.changePassword(request)
  } catch (error) {
    console.error('❌ [API] Error in POST /api/user-settings/change-password:', error)
    
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to change password' },
      { status: 500 }
    )
  }
}
