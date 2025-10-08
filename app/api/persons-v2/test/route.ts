import { NextRequest, NextResponse } from 'next/server'
import { getPersonRepository, getUserRepository } from '@/lib/infrastructure/container'

/**
 * Endpoint de prueba para validar la nueva arquitectura de personas
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [PERSONS-V2 TEST] Iniciando prueba...')

    // 1. Probar que podemos obtener los repositorios
    console.log('📦 [PERSONS-V2 TEST] Obteniendo repositorios...')
    const personRepository = await getPersonRepository()
    const userRepository = await getUserRepository()
    console.log('✅ [PERSONS-V2 TEST] Repositorios obtenidos')

    // 2. Probar que podemos crear Use Cases
    console.log('🏗️ [PERSONS-V2 TEST] Creando Use Cases...')
    const { GetPersonsUseCase } = await import('@/lib/application/use-cases/GetPersonsUseCase')
    const getPersonsUseCase = new GetPersonsUseCase(personRepository, userRepository)
    console.log('✅ [PERSONS-V2 TEST] Use Cases creados')

    // 3. Probar que podemos crear Controller
    console.log('🎮 [PERSONS-V2 TEST] Creando Controller...')
    const { PersonController } = await import('@/lib/presentation/controllers/PersonController')
    const { CreatePersonUseCase } = await import('@/lib/application/use-cases/CreatePersonUseCase')
    const { GetPersonByIdUseCase } = await import('@/lib/application/use-cases/GetPersonByIdUseCase')
    const { UpdatePersonUseCase } = await import('@/lib/application/use-cases/UpdatePersonUseCase')
    const { DeletePersonUseCase } = await import('@/lib/application/use-cases/DeletePersonUseCase')

    const createPersonUseCase = new CreatePersonUseCase(personRepository, userRepository)
    const getPersonByIdUseCase = new GetPersonByIdUseCase(personRepository, userRepository)
    const updatePersonUseCase = new UpdatePersonUseCase(personRepository, userRepository)
    const deletePersonUseCase = new DeletePersonUseCase(personRepository, userRepository)

    const personController = new PersonController(
      getPersonsUseCase,
      createPersonUseCase,
      getPersonByIdUseCase,
      updatePersonUseCase,
      deletePersonUseCase
    )
    console.log('✅ [PERSONS-V2 TEST] Controller creado')

    // 4. Respuesta de éxito
    const response = {
      success: true,
      message: 'Arquitectura de Person Management v2 funcionando correctamente',
      components: {
        repositories: {
          personRepository: '✅ Funcionando',
          userRepository: '✅ Funcionando'
        },
        useCases: {
          getPersonsUseCase: '✅ Creado',
          createPersonUseCase: '✅ Creado',
          getPersonByIdUseCase: '✅ Creado',
          updatePersonUseCase: '✅ Creado',
          deletePersonUseCase: '✅ Creado'
        },
        controller: {
          personController: '✅ Creado'
        }
      },
      timestamp: new Date().toISOString()
    }

    console.log('🎉 [PERSONS-V2 TEST] Prueba completada exitosamente')
    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ [PERSONS-V2 TEST] Error:', error)
    
    const errorResponse = {
      success: false,
      message: 'Error en la prueba de arquitectura v2',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
