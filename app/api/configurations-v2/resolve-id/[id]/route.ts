import { NextRequest, NextResponse } from "next/server"
import { ConfigurationController } from "@/lib/presentation/controllers/ConfigurationController"
import { GetConfigurationsUseCase } from "@/lib/application/use-cases/GetConfigurationsUseCase"
import { CreateConfigurationUseCase } from "@/lib/application/use-cases/CreateConfigurationUseCase"
import { GetConfigurationByIdUseCase } from "@/lib/application/use-cases/GetConfigurationByIdUseCase"
import { UpdateConfigurationUseCase } from "@/lib/application/use-cases/UpdateConfigurationUseCase"
import { DeleteConfigurationUseCase } from "@/lib/application/use-cases/DeleteConfigurationUseCase"
import { ConfigurationService } from "@/lib/application/services/ConfigurationService"
import { UserService } from "@/lib/application/services/UserService"
import { getConfigurationRepository, getUserRepository } from "@/lib/infrastructure/container"

/**
 * API Route: /api/configurations-v2/resolve-id/[id]
 * 
 * Endpoint refactorizado para resolver IDs de configuración usando la nueva arquitectura.
 */

// Instanciar dependencias
let configurationController: ConfigurationController | null = null

async function getController(): Promise<ConfigurationController> {
  if (!configurationController) {
    // Obtener repositorios
    const configurationRepository = await getConfigurationRepository()
    const userRepository = await getUserRepository()

    // Crear servicios
    const configurationService = new ConfigurationService(configurationRepository)
    const userService = new UserService(userRepository)

    // Crear casos de uso
    const getConfigurationsUseCase = new GetConfigurationsUseCase(configurationService, userService)
    const createConfigurationUseCase = new CreateConfigurationUseCase(configurationService, userService)
    const getConfigurationByIdUseCase = new GetConfigurationByIdUseCase(configurationService, userService)
    const updateConfigurationUseCase = new UpdateConfigurationUseCase(configurationService, userService)
    const deleteConfigurationUseCase = new DeleteConfigurationUseCase(configurationService, userService)

    // Crear controlador
    configurationController = new ConfigurationController(
      getConfigurationsUseCase,
      createConfigurationUseCase,
      getConfigurationByIdUseCase,
      updateConfigurationUseCase,
      deleteConfigurationUseCase
    )
  }

  return configurationController
}

// GET /api/configurations-v2/resolve-id/[id] - Resolver ID de configuración
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const controller = await getController()
    
    // Usar el método getConfigurationById para resolver el ID
    return await controller.getConfigurationById(request, id)
  } catch (error) {
    console.error('[API] Error in GET /api/configurations-v2/resolve-id/[id]:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
