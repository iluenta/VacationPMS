import { NextRequest, NextResponse } from 'next/server'
import { getPersonRepository, getUserRepository } from '@/lib/infrastructure/container'
import { GetPersonsUseCase } from '@/lib/application/use-cases/GetPersonsUseCase'
import { TenantId } from '@/lib/domain/value-objects/TenantId'
import { UserId } from '@/lib/domain/value-objects/UserId'

/**
 * Endpoint de debug para diagnosticar problemas en la arquitectura
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Iniciando debug...')

    const results: any = {
      step1_repositories: false,
      step2_useCase: false,
      step3_valueObjects: false,
      step4_execution: false
    }

    // PASO 1: Repositorios
    console.log('📦 [DEBUG] Paso 1: Obteniendo repositorios...')
    try {
      const personRepository = await getPersonRepository()
      const userRepository = await getUserRepository()
      results.step1_repositories = true
      console.log('✅ [DEBUG] Paso 1 completado')
    } catch (error) {
      console.error('❌ [DEBUG] Paso 1 falló:', error)
      results.step1_error = error instanceof Error ? error.message : 'Error desconocido'
    }

    // PASO 2: Use Case
    console.log('🏗️ [DEBUG] Paso 2: Creando Use Case...')
    try {
      const personRepository = await getPersonRepository()
      const userRepository = await getUserRepository()
      const getPersonsUseCase = new GetPersonsUseCase(personRepository, userRepository)
      results.step2_useCase = true
      console.log('✅ [DEBUG] Paso 2 completado')
    } catch (error) {
      console.error('❌ [DEBUG] Paso 2 falló:', error)
      results.step2_error = error instanceof Error ? error.message : 'Error desconocido'
    }

    // PASO 3: Value Objects
    console.log('🔧 [DEBUG] Paso 3: Creando Value Objects...')
    try {
      const userId = UserId.fromString('453129fb-950e-4934-a1ff-2cb83ca697cd')
      const tenantId = TenantId.fromString('00000000-0000-0000-0000-000000000001')
      results.step3_valueObjects = true
      results.step3_userId = userId.getValue()
      results.step3_tenantId = tenantId.getValue()
      console.log('✅ [DEBUG] Paso 3 completado')
    } catch (error) {
      console.error('❌ [DEBUG] Paso 3 falló:', error)
      results.step3_error = error instanceof Error ? error.message : 'Error desconocido'
    }

    // PASO 4: Ejecución
    console.log('🚀 [DEBUG] Paso 4: Ejecutando Use Case...')
    try {
      const personRepository = await getPersonRepository()
      const userRepository = await getUserRepository()
      const getPersonsUseCase = new GetPersonsUseCase(personRepository, userRepository)
      
      const result = await getPersonsUseCase.execute({
        userId: '453129fb-950e-4934-a1ff-2cb83ca697cd',
        tenantId: '00000000-0000-0000-0000-000000000001',
        filters: {
          limit: 5,
          offset: 0
        }
      })

      results.step4_execution = true
      results.step4_personsCount = result.persons.length
      results.step4_total = result.total
      console.log('✅ [DEBUG] Paso 4 completado')
    } catch (error) {
      console.error('❌ [DEBUG] Paso 4 falló:', error)
      results.step4_error = error instanceof Error ? error.message : 'Error desconocido'
      results.step4_stack = error instanceof Error ? error.stack : undefined
    }

    // Respuesta
    const response = {
      success: true,
      message: 'Debug completado',
      results,
      summary: {
        totalSteps: 4,
        passedSteps: Object.values(results).filter(v => v === true).length,
        failedSteps: Object.keys(results).filter(k => k.includes('error')).length
      },
      timestamp: new Date().toISOString()
    }

    console.log('🎉 [DEBUG] Debug completado')
    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ [DEBUG] Error en debug:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Error en debug',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
