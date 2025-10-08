import { NextRequest, NextResponse } from 'next/server'
import { FiscalAddressController } from '@/lib/presentation/controllers/FiscalAddressController'
import { GetFiscalAddressUseCase } from '@/lib/application/use-cases/GetFiscalAddressUseCase'
import { CreateFiscalAddressUseCase } from '@/lib/application/use-cases/CreateFiscalAddressUseCase'
import { getFiscalAddressRepository, getPersonRepository, getUserRepository } from '@/lib/infrastructure/container'

/**
 * API Route para gestión de direcciones fiscales de personas usando Clean Architecture
 * 
 * GET /api/persons-v2/[id]/fiscal-address - Obtener dirección fiscal de una persona
 * POST /api/persons-v2/[id]/fiscal-address - Crear dirección fiscal para una persona
 */

// Instanciar dependencias
let fiscalAddressController: FiscalAddressController | null = null

async function getFiscalAddressController(): Promise<FiscalAddressController> {
  if (!fiscalAddressController) {
    const fiscalAddressRepository = await getFiscalAddressRepository()
    const personRepository = await getPersonRepository()
    const userRepository = await getUserRepository()

    const getFiscalAddressUseCase = new GetFiscalAddressUseCase(fiscalAddressRepository, userRepository)
    const createFiscalAddressUseCase = new CreateFiscalAddressUseCase(fiscalAddressRepository, personRepository, userRepository)

    fiscalAddressController = new FiscalAddressController(
      getFiscalAddressUseCase,
      createFiscalAddressUseCase
    )
  }

  return fiscalAddressController
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const controller = await getFiscalAddressController()
    return await controller.getFiscalAddress(request, id)
  } catch (error) {
    console.error('Error in GET /api/persons-v2/[id]/fiscal-address:', error)
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
    const controller = await getFiscalAddressController()
    return await controller.createFiscalAddress(request, id)
  } catch (error) {
    console.error('Error in POST /api/persons-v2/[id]/fiscal-address:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
