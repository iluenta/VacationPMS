import { NextRequest, NextResponse } from "next/server"
import { AuthController } from "@/lib/presentation/controllers/AuthController"
import { LoginUseCase } from "@/lib/application/use-cases/LoginUseCase"
import { GetUserSessionsUseCase } from "@/lib/application/use-cases/GetUserSessionsUseCase"
import { RevokeSessionUseCase } from "@/lib/application/use-cases/RevokeSessionUseCase"
import { RevokeAllSessionsUseCase } from "@/lib/application/use-cases/RevokeAllSessionsUseCase"
import { UserService } from "@/lib/application/services/UserService"
import { getUserRepository } from "@/lib/infrastructure/container"

/**
 * API Route: /api/auth-v2/sessions
 * 
 * Endpoint refactorizado para gestión de sesiones usando la nueva arquitectura.
 */

// Instanciar dependencias
let authController: AuthController | null = null

async function getController(): Promise<AuthController> {
  if (!authController) {
    // Obtener repositorios
    const userRepository = await getUserRepository()
    // TODO: Agregar sessionRepository cuando esté implementado

    // Crear servicios
    const userService = new UserService(userRepository)

    // Crear casos de uso
    const loginUseCase = new LoginUseCase(userService, null as any) // TODO: Implementar sessionRepository
    const getUserSessionsUseCase = new GetUserSessionsUseCase(null as any, userService) // TODO: Implementar sessionRepository
    const revokeSessionUseCase = new RevokeSessionUseCase(null as any, userService) // TODO: Implementar sessionRepository
    const revokeAllSessionsUseCase = new RevokeAllSessionsUseCase(null as any, userService) // TODO: Implementar sessionRepository

    // Crear controlador
    authController = new AuthController(
      loginUseCase,
      getUserSessionsUseCase,
      revokeSessionUseCase,
      revokeAllSessionsUseCase
    )
  }

  return authController
}

// GET /api/auth-v2/sessions - Listar sesiones del usuario
export async function GET(request: NextRequest) {
  try {
    const controller = await getController()
    return await controller.getUserSessions(request)
  } catch (error) {
    console.error('[API] Error in GET /api/auth-v2/sessions:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST /api/auth-v2/sessions/revoke-all - Revocar todas las sesiones
export async function POST(request: NextRequest) {
  try {
    const controller = await getController()
    return await controller.revokeAllSessions(request)
  } catch (error) {
    console.error('[API] Error in POST /api/auth-v2/sessions/revoke-all:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
