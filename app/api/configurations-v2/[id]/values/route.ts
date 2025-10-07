import { NextRequest, NextResponse } from "next/server"
import { ConfigurationValueController } from "@/lib/presentation/controllers/ConfigurationValueController"
import { GetConfigurationValuesUseCase } from "@/lib/application/use-cases/GetConfigurationValuesUseCase"
import { CreateConfigurationValueUseCase } from "@/lib/application/use-cases/CreateConfigurationValueUseCase"
import { GetConfigurationValueByIdUseCase } from "@/lib/application/use-cases/GetConfigurationValueByIdUseCase"
import { UpdateConfigurationValueUseCase } from "@/lib/application/use-cases/UpdateConfigurationValueUseCase"
import { DeleteConfigurationValueUseCase } from "@/lib/application/use-cases/DeleteConfigurationValueUseCase"
import { UserService } from "@/lib/application/services/UserService"
import { getConfigurationValueRepository, getUserRepository } from "@/lib/infrastructure/container"

/**
 * API Route: /api/configurations-v2/[id]/values
 * 
 * Endpoint refactorizado para operaciones CRUD de valores de configuración usando la nueva arquitectura.
 */

// Instanciar dependencias
let configurationValueController: ConfigurationValueController | null = null

async function getController(): Promise<ConfigurationValueController> {
  if (!configurationValueController) {
    // Obtener repositorios
    const configurationValueRepository = await getConfigurationValueRepository()
    const userRepository = await getUserRepository()

    // Crear servicios
    const userService = new UserService(userRepository)

    // Crear casos de uso
    const getConfigurationValuesUseCase = new GetConfigurationValuesUseCase(configurationValueRepository, userService)
    const createConfigurationValueUseCase = new CreateConfigurationValueUseCase(configurationValueRepository, userService)
    const getConfigurationValueByIdUseCase = new GetConfigurationValueByIdUseCase(configurationValueRepository, userService)
    const updateConfigurationValueUseCase = new UpdateConfigurationValueUseCase(configurationValueRepository, userService)
    const deleteConfigurationValueUseCase = new DeleteConfigurationValueUseCase(configurationValueRepository, userService)

    // Crear controlador
    configurationValueController = new ConfigurationValueController(
      getConfigurationValuesUseCase,
      createConfigurationValueUseCase,
      getConfigurationValueByIdUseCase,
      updateConfigurationValueUseCase,
      deleteConfigurationValueUseCase
    )
  }

  return configurationValueController
}

// GET /api/configurations-v2/[id]/values - Listar valores de configuración
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const controller = await getController()
    return await controller.getConfigurationValues(request, id)
  } catch (error) {
    console.error('[API] Error in GET /api/configurations-v2/[id]/values:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST /api/configurations-v2/[id]/values - Crear valor de configuración
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const controller = await getController()
    return await controller.createConfigurationValue(request, id)
  } catch (error) {
    console.error('[API] Error in POST /api/configurations-v2/[id]/values:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
