import { NextRequest, NextResponse } from 'next/server'
import { getPersonRepository, getUserRepository } from '@/lib/infrastructure/container'
import { CreatePersonUseCase } from '@/lib/application/use-cases/CreatePersonUseCase'

/**
 * Endpoint de prueba para diagnosticar problemas en creación de personas
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [CREATE TEST] Iniciando prueba de creación...')

    // 1. Obtener repositorios
    const personRepository = await getPersonRepository()
    const userRepository = await getUserRepository()

    // 2. Crear Use Case
    const createPersonUseCase = new CreatePersonUseCase(personRepository, userRepository)

    // 3. Datos de prueba
    const testData = {
      personTypeId: '7e2227de-c10b-4d74-9b3b-06b2c95be833',
      personCategory: 'PHYSICAL' as const,
      identificationType: 'DNI' as const,
      identificationNumber: `TEST-${Date.now()}`,
      firstName: 'Test',
      lastName: 'Person',
      isActive: true
    }

    console.log('📝 [CREATE TEST] Datos de prueba:', testData)

    // 4. Ejecutar Use Case
    try {
      const result = await createPersonUseCase.execute({
        userId: '453129fb-950e-4934-a1ff-2cb83ca697cd',
        tenantId: '00000000-0000-0000-0000-000000000001',
        data: testData
      })

      console.log('✅ [CREATE TEST] Persona creada exitosamente')

      return NextResponse.json({
        success: true,
        message: 'Persona creada exitosamente',
        data: result,
        timestamp: new Date().toISOString()
      }, { status: 200 })

    } catch (error) {
      console.error('❌ [CREATE TEST] Error en Use Case:', error)
      
      return NextResponse.json({
        success: false,
        message: 'Error en Use Case',
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        testData: testData,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ [CREATE TEST] Error general:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Error general en prueba de creación',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
