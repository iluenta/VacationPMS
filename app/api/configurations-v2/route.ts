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
 * API Route: /api/configurations-v2
 * 
 * Endpoint refactorizado que usa la nueva arquitectura de capas.
 * Demuestra cómo los endpoints se simplifican usando la nueva estructura.
 */

// Instanciar dependencias (en una implementación real, esto vendría del DI container)
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

// GET /api/configurations-v2 - Listar configuraciones
export async function GET(request: NextRequest) {
  try {
    const controller = await getController()
    return await controller.getConfigurations(request)
  } catch (error) {
    console.error('[API] Error in GET /api/configurations-v2:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST /api/configurations-v2 - Crear configuración
export async function POST(request: NextRequest) {
  try {
    const controller = await getController()
    return await controller.createConfiguration(request)
  } catch (error) {
    console.error('[API] Error in POST /api/configurations-v2:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
