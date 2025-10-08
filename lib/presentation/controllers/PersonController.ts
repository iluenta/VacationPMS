import { NextRequest, NextResponse } from 'next/server'
import { GetPersonsUseCase } from '../../application/use-cases/GetPersonsUseCase'
import { CreatePersonUseCase } from '../../application/use-cases/CreatePersonUseCase'
import { GetPersonByIdUseCase } from '../../application/use-cases/GetPersonByIdUseCase'
import { UpdatePersonUseCase } from '../../application/use-cases/UpdatePersonUseCase'
import { DeletePersonUseCase } from '../../application/use-cases/DeletePersonUseCase'
import { PersonDto, CreatePersonDto, UpdatePersonDto, PersonListDto } from '../../application/dto/PersonDto'
import { Person } from '../../domain/entities/Person'
import { PersonId } from '../../domain/value-objects/PersonId'
import { TenantId } from '../../domain/value-objects/TenantId'
import { UserId } from '../../domain/value-objects/UserId'
import { requireAuthenticatedUser } from '../middleware/get-authenticated-user'

export class PersonController {
  constructor(
    private readonly getPersonsUseCase: GetPersonsUseCase,
    private readonly createPersonUseCase: CreatePersonUseCase,
    private readonly getPersonByIdUseCase: GetPersonByIdUseCase,
    private readonly updatePersonUseCase: UpdatePersonUseCase,
    private readonly deletePersonUseCase: DeletePersonUseCase
  ) {}

  async getPersons(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const queryParams = this.extractQueryParams(request)

      console.log('🔧 [CONTROLLER] Getting persons with:', {
        userId,
        tenantId: tenantId ? (typeof tenantId === 'string' ? tenantId : tenantId.getValue?.() || 'TenantId object') : 'null',
        filters: queryParams
      })

      const result = await this.getPersonsUseCase.execute({
        userId,
        tenantId,
        filters: queryParams
      })

      console.log('🔧 [CONTROLLER] Use case result:', {
        personsCount: result.persons.length,
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.hasMore
      })

      const response = {
        success: true,
        persons: result.persons,  // Ya son DTOs desde el Use Case
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.hasMore
      }

      console.log('🔧 [CONTROLLER] Sending response:', {
        success: response.success,
        personsCount: response.persons.length,
        total: response.total
      })

      return NextResponse.json(response, { status: 200 })

    } catch (error) {
      return this.handleError(error)
    }
  }

  async createPerson(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const body = await this.extractBody(request)

      const result = await this.createPersonUseCase.execute({
        userId,
        tenantId,
        data: body
      })

      return NextResponse.json({
        success: true,
        data: result  // Ya es DTO desde el Use Case
      }, { status: 201 })

    } catch (error) {
      return this.handleError(error)
    }
  }

  async getPersonById(request: NextRequest, personId: string): Promise<NextResponse> {
    try {
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)

      const result = await this.getPersonByIdUseCase.execute({
        userId,
        personId,
        tenantId
      })

      if (!result) {
        return NextResponse.json({
          success: false,
          error: 'Person not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: result  // Ya es DTO desde el Use Case
      }, { status: 200 })

    } catch (error) {
      return this.handleError(error)
    }
  }

  async updatePerson(request: NextRequest, personId: string): Promise<NextResponse> {
    try {
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const body = await this.extractUpdateBody(request)

      const result = await this.updatePersonUseCase.execute({
        userId,
        personId,
        tenantId,
        data: body
      })

      return NextResponse.json({
        success: true,
        data: result  // Ya es DTO desde el Use Case
      }, { status: 200 })

    } catch (error) {
      return this.handleError(error)
    }
  }

  async deletePerson(request: NextRequest, personId: string): Promise<NextResponse> {
    try {
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)

      await this.deletePersonUseCase.execute({
        userId,
        personId,
        tenantId
      })

      return NextResponse.json({
        success: true,
        message: 'Person deleted successfully'
      }, { status: 200 })

    } catch (error) {
      return this.handleError(error)
    }
  }

  // Helper methods
  private async extractUserId(request: NextRequest): Promise<string> {
    return await requireAuthenticatedUser(request)
  }

  private extractTenantId(request: NextRequest): string | undefined {
    // Primero intentar obtener del header (para POST/PUT/DELETE)
    const headerTenantId = request.headers.get('x-tenant-id')
    if (headerTenantId) {
      return headerTenantId
    }
    
    // Si no está en el header, buscar en query params (para GET)
    return request.nextUrl.searchParams.get('tenant_id') || undefined
  }

  private extractQueryParams(request: NextRequest): any {
    const searchParams = request.nextUrl.searchParams
    
    return {
      name: searchParams.get('name') || undefined,
      identificationNumber: searchParams.get('identification_number') || undefined,
      personTypeId: searchParams.get('person_type_id') || undefined,
      category: searchParams.get('category') || undefined,
      isActive: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    }
  }

  private async extractBody(request: NextRequest): Promise<CreatePersonDto> {
    const body = await request.json()
    return body as CreatePersonDto
  }

  private async extractUpdateBody(request: NextRequest): Promise<UpdatePersonDto> {
    const body = await request.json()
    return body as UpdatePersonDto
  }

  private handleError(error: any): NextResponse {
    console.error('PersonController error:', error)

    if (error.message === 'Authorization header required') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    if (error.message === 'User not found') {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    if (error.message === 'Person not found') {
      return NextResponse.json({
        success: false,
        error: 'Person not found'
      }, { status: 404 })
    }

    if (error.message === 'User does not have access to this tenant') {
      return NextResponse.json({
        success: false,
        error: 'Forbidden'
      }, { status: 403 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}
