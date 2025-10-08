import { NextRequest, NextResponse } from 'next/server'
import { PersonController } from '@/lib/presentation/controllers/PersonController'
import { GetPersonsUseCase } from '@/lib/application/use-cases/GetPersonsUseCase'
import { CreatePersonUseCase } from '@/lib/application/use-cases/CreatePersonUseCase'
import { GetPersonByIdUseCase } from '@/lib/application/use-cases/GetPersonByIdUseCase'
import { UpdatePersonUseCase } from '@/lib/application/use-cases/UpdatePersonUseCase'
import { DeletePersonUseCase } from '@/lib/application/use-cases/DeletePersonUseCase'
import { getPersonRepository, getUserRepository } from '@/lib/infrastructure/container'

/**
 * API Route para gestión de personas usando Clean Architecture
 * 
 * GET /api/persons-v2 - Listar personas
 * POST /api/persons-v2 - Crear persona
 */

// Instanciar dependencias
let personController: PersonController | null = null

async function getPersonController(): Promise<PersonController> {
  if (!personController) {
    const personRepository = await getPersonRepository()
    const userRepository = await getUserRepository()

    const getPersonsUseCase = new GetPersonsUseCase(personRepository, userRepository)
    const createPersonUseCase = new CreatePersonUseCase(personRepository, userRepository)
    const getPersonByIdUseCase = new GetPersonByIdUseCase(personRepository, userRepository)
    const updatePersonUseCase = new UpdatePersonUseCase(personRepository, userRepository)
    const deletePersonUseCase = new DeletePersonUseCase(personRepository, userRepository)

    personController = new PersonController(
      getPersonsUseCase,
      createPersonUseCase,
      getPersonByIdUseCase,
      updatePersonUseCase,
      deletePersonUseCase
    )
  }

  return personController
}

export async function GET(request: NextRequest) {
  try {
    const controller = await getPersonController()
    return await controller.getPersons(request)
  } catch (error) {
    console.error('Error in GET /api/persons-v2:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const controller = await getPersonController()
    return await controller.createPerson(request)
  } catch (error) {
    console.error('Error in POST /api/persons-v2:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
