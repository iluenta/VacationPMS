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
 * API Route: /api/configurations-v2/[id]
 * 
 * Endpoint refactorizado para operaciones CRUD por ID usando la nueva arquitectura.
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

// GET /api/configurations-v2/[id] - Obtener configuración por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const controller = await getController()
    return await controller.getConfigurationById(request, id)
  } catch (error) {
    console.error('[API] Error in GET /api/configurations-v2/[id]:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT /api/configurations-v2/[id] - Actualizar configuración
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const controller = await getController()
    return await controller.updateConfiguration(request, id)
  } catch (error) {
    console.error('[API] Error in PUT /api/configurations-v2/[id]:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE /api/configurations-v2/[id] - Eliminar configuración
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const controller = await getController()
    return await controller.deleteConfiguration(request, id)
  } catch (error) {
    console.error('[API] Error in DELETE /api/configurations-v2/[id]:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
