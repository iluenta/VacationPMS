import { NextRequest, NextResponse } from 'next/server'
import { ConfigurationController } from '../../../../../lib/presentation/controllers/ConfigurationController'
import { GetConfigurationValuesUseCase } from '../../../../../lib/application/use-cases/GetConfigurationValuesUseCase'
import { ConfigurationService } from '../../../../../lib/application/services/ConfigurationService'
import { UserService } from '../../../../../lib/application/services/UserService'
import { requireAuthenticatedUser } from '../../../../../lib/presentation/middleware/get-authenticated-user'
import { getConfigurationRepository, getUserRepository } from '../../../../../lib/infrastructure/container'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔧 [API] Getting configuration values for ID:', params.id)

    // Obtener usuario autenticado
    const userId = await requireAuthenticatedUser(request)

    // Obtener dependencias
    const configurationRepository = await getConfigurationRepository()
    const userRepository = await getUserRepository()

    // Crear servicios y use cases
    const configurationService = new ConfigurationService(configurationRepository)
    const userService = new UserService(userRepository)
    const getConfigurationValuesUseCase = new GetConfigurationValuesUseCase(configurationService, userService)
    const configurationController = new ConfigurationController(getConfigurationValuesUseCase)

    // Ejecutar
    const response = await configurationController.getConfigurationValues(request, params.id)

    return response
  } catch (error: any) {
    console.error('❌ [API] Error in GET /api/configurations/values/[id]:', error)
    
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
