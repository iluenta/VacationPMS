import { NextRequest, NextResponse } from 'next/server'
import { PersonController } from '@/lib/presentation/controllers/PersonController'
import { GetPersonsUseCase } from '@/lib/application/use-cases/GetPersonsUseCase'
import { CreatePersonUseCase } from '@/lib/application/use-cases/CreatePersonUseCase'
import { GetPersonByIdUseCase } from '@/lib/application/use-cases/GetPersonByIdUseCase'
import { UpdatePersonUseCase } from '@/lib/application/use-cases/UpdatePersonUseCase'
import { DeletePersonUseCase } from '@/lib/application/use-cases/DeletePersonUseCase'
import { getPersonRepository, getUserRepository } from '@/lib/infrastructure/container'

/**
 * API Route para gestión de personas individuales usando Clean Architecture
 * 
 * GET /api/persons-v2/[id] - Obtener persona por ID
 * PUT /api/persons-v2/[id] - Actualizar persona
 * DELETE /api/persons-v2/[id] - Eliminar persona
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const controller = await getPersonController()
    return await controller.getPersonById(request, id)
  } catch (error) {
    console.error('Error in GET /api/persons-v2/[id]:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const controller = await getPersonController()
    return await controller.updatePerson(request, id)
  } catch (error) {
    console.error('Error in PUT /api/persons-v2/[id]:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const controller = await getPersonController()
    return await controller.deletePerson(request, id)
  } catch (error) {
    console.error('Error in DELETE /api/persons-v2/[id]:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
