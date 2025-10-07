import { NextRequest, NextResponse } from "next/server"
import { AdminController } from "@/lib/presentation/controllers/AdminController"
import { GetSecurityMetricsUseCase } from "@/lib/application/use-cases/GetSecurityMetricsUseCase"
import { GetSecurityAlertsUseCase } from "@/lib/application/use-cases/GetSecurityAlertsUseCase"
import { AcknowledgeSecurityAlertUseCase } from "@/lib/application/use-cases/AcknowledgeSecurityAlertUseCase"
import { UserService } from "@/lib/application/services/UserService"
import { getUserRepository } from "@/lib/infrastructure/container"

/**
 * API Route: /api/admin-v2/security-alerts
 * 
 * Endpoint refactorizado para alertas de seguridad usando la nueva arquitectura.
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

// GET /api/admin-v2/security-alerts - Obtener alertas de seguridad
export async function GET(request: NextRequest) {
  try {
    const controller = await getController()
    return await controller.getSecurityAlerts(request)
  } catch (error) {
    console.error('[API] Error in GET /api/admin-v2/security-alerts:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
