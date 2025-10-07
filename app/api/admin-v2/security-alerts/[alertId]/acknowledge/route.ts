import { NextRequest, NextResponse } from "next/server"
import { AdminController } from "@/lib/presentation/controllers/AdminController"
import { GetSecurityMetricsUseCase } from "@/lib/application/use-cases/GetSecurityMetricsUseCase"
import { GetSecurityAlertsUseCase } from "@/lib/application/use-cases/GetSecurityAlertsUseCase"
import { AcknowledgeSecurityAlertUseCase } from "@/lib/application/use-cases/AcknowledgeSecurityAlertUseCase"
import { UserService } from "@/lib/application/services/UserService"
import { getUserRepository } from "@/lib/infrastructure/container"

/**
 * API Route: /api/admin-v2/security-alerts/[alertId]/acknowledge
 * 
 * Endpoint refactorizado para aceptar alertas de seguridad usando la nueva arquitectura.
 */

// Instanciar dependencias
let adminController: AdminController | null = null

async function getController(): Promise<AdminController> {
  if (!adminController) {
    // Obtener repositorios
    const userRepository = await getUserRepository()

    // Crear servicios
    const userService = new UserService(userRepository)

    // Crear casos de uso
    const getSecurityMetricsUseCase = new GetSecurityMetricsUseCase(userService)
    const getSecurityAlertsUseCase = new GetSecurityAlertsUseCase(userService)
    const acknowledgeSecurityAlertUseCase = new AcknowledgeSecurityAlertUseCase(userService)

    // Crear controlador
    adminController = new AdminController(
      getSecurityMetricsUseCase,
      getSecurityAlertsUseCase,
      acknowledgeSecurityAlertUseCase
    )
  }

  return adminController
}

// POST /api/admin-v2/security-alerts/[alertId]/acknowledge - Aceptar alerta de seguridad
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const { alertId } = await params
    const controller = await getController()
    return await controller.acknowledgeSecurityAlert(request, alertId)
  } catch (error) {
    console.error('[API] Error in POST /api/admin-v2/security-alerts/[alertId]/acknowledge:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
