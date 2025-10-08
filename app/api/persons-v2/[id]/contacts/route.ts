import { NextRequest, NextResponse } from 'next/server'
import { ContactInfoController } from '@/lib/presentation/controllers/ContactInfoController'
import { GetContactInfosUseCase } from '@/lib/application/use-cases/GetContactInfosUseCase'
import { CreateContactInfoUseCase } from '@/lib/application/use-cases/CreateContactInfoUseCase'
import { getContactInfoRepository, getPersonRepository, getUserRepository } from '@/lib/infrastructure/container'

/**
 * API Route para gestión de contactos de personas usando Clean Architecture
 * 
 * GET /api/persons-v2/[id]/contacts - Listar contactos de una persona
 * POST /api/persons-v2/[id]/contacts - Crear contacto para una persona
 */

// Instanciar dependencias
let contactInfoController: ContactInfoController | null = null

async function getContactInfoController(): Promise<ContactInfoController> {
  if (!contactInfoController) {
    const contactInfoRepository = await getContactInfoRepository()
    const personRepository = await getPersonRepository()
    const userRepository = await getUserRepository()

    const getContactInfosUseCase = new GetContactInfosUseCase(contactInfoRepository, userRepository)
    const createContactInfoUseCase = new CreateContactInfoUseCase(contactInfoRepository, personRepository, userRepository)

    contactInfoController = new ContactInfoController(
      getContactInfosUseCase,
      createContactInfoUseCase
    )
  }

  return contactInfoController
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const controller = await getContactInfoController()
    return await controller.getContactInfos(request, id)
  } catch (error) {
    console.error('Error in GET /api/persons-v2/[id]/contacts:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const controller = await getContactInfoController()
    return await controller.createContactInfo(request, id)
  } catch (error) {
    console.error('Error in POST /api/persons-v2/[id]/contacts:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
