import { NextRequest, NextResponse } from 'next/server'
import { getPersonRepository, getUserRepository } from '@/lib/infrastructure/container'
import { GetPersonsUseCase } from '@/lib/application/use-cases/GetPersonsUseCase'

/**
 * Endpoint simple para probar la funcionalidad básica
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [SIMPLE] Iniciando prueba simple...')

    // 1. Obtener repositorios
    const personRepository = await getPersonRepository()
    const userRepository = await getUserRepository()

    // 2. Crear Use Case
    const getPersonsUseCase = new GetPersonsUseCase(personRepository, userRepository)

    // 3. Ejecutar Use Case con datos de prueba
    const result = await getPersonsUseCase.execute({
      userId: '453129fb-950e-4934-a1ff-2cb83ca697cd', // pramsuarez@gmail.com (admin)
      tenantId: '00000000-0000-0000-0000-000000000001', // Demo Tenant
      filters: {
        limit: 10,
        offset: 0
      }
    })

    // 4. Respuesta
    const response = {
      success: true,
      message: 'Prueba simple completada exitosamente',
      data: {
        total: result.total,
        persons: result.persons.length,
        page: result.page,
        hasMore: result.hasMore
      },
      timestamp: new Date().toISOString()
    }

    console.log('🎉 [SIMPLE] Prueba completada exitosamente')
    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ [SIMPLE] Error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Error en prueba simple',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
