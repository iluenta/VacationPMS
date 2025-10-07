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
 * API Route: /api/configurations-v2/[id]/values/[valueId]
 * 
 * Endpoint refactorizado para operaciones CRUD por ID de valores de configuración usando la nueva arquitectura.
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

// GET /api/configurations-v2/[id]/values/[valueId] - Obtener valor de configuración por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; valueId: string }> }
) {
  try {
    const { valueId } = await params
    const controller = await getController()
    return await controller.getConfigurationValueById(request, valueId)
  } catch (error) {
    console.error('[API] Error in GET /api/configurations-v2/[id]/values/[valueId]:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT /api/configurations-v2/[id]/values/[valueId] - Actualizar valor de configuración
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; valueId: string }> }
) {
  try {
    const { valueId } = await params
    const controller = await getController()
    return await controller.updateConfigurationValue(request, valueId)
  } catch (error) {
    console.error('[API] Error in PUT /api/configurations-v2/[id]/values/[valueId]:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE /api/configurations-v2/[id]/values/[valueId] - Eliminar valor de configuración
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; valueId: string }> }
) {
  try {
    const { valueId } = await params
    const controller = await getController()
    return await controller.deleteConfigurationValue(request, valueId)
  } catch (error) {
    console.error('[API] Error in DELETE /api/configurations-v2/[id]/values/[valueId]:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
