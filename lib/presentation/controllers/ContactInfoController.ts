import { NextRequest, NextResponse } from 'next/server'
import { GetContactInfosUseCase } from '../../application/use-cases/GetContactInfosUseCase'
import { CreateContactInfoUseCase } from '../../application/use-cases/CreateContactInfoUseCase'
import { ContactInfoDto, CreateContactInfoDto, UpdateContactInfoDto, ContactInfoListDto } from '../../application/dto/ContactInfoDto'
import { requireAuthenticatedUser } from '../middleware/get-authenticated-user'

export class ContactInfoController {
  constructor(
    private readonly getContactInfosUseCase: GetContactInfosUseCase,
    private readonly createContactInfoUseCase: CreateContactInfoUseCase
  ) {}

  async getContactInfos(request: NextRequest, personId: string): Promise<NextResponse> {
    try {
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const queryParams = this.extractQueryParams(request)

      const result = await this.getContactInfosUseCase.execute({
        userId,
        personId,
        tenantId,
        filters: queryParams
      })

      return NextResponse.json({
        success: true,
        data: result
      }, { status: 200 })

    } catch (error) {
      return this.handleError(error)
    }
  }

  async createContactInfo(request: NextRequest, personId: string): Promise<NextResponse> {
    try {
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const body = await this.extractBody(request)

      const result = await this.createContactInfoUseCase.execute({
        userId,
        personId,
        tenantId,
        data: body
      })

      return NextResponse.json({
        success: true,
        data: result
      }, { status: 201 })

    } catch (error) {
      return this.handleError(error)
    }
  }

  // Helper methods
  private async extractUserId(request: NextRequest): Promise<string> {
    return await requireAuthenticatedUser(request)
  }

  private extractTenantId(request: NextRequest): string | undefined {
    return request.nextUrl.searchParams.get('tenant_id') || undefined
  }

  private extractQueryParams(request: NextRequest): any {
    const searchParams = request.nextUrl.searchParams
    
    return {
      contactName: searchParams.get('contact_name') || undefined,
      phone: searchParams.get('phone') || undefined,
      email: searchParams.get('email') || undefined,
      isPrimary: searchParams.get('is_primary') ? searchParams.get('is_primary') === 'true' : undefined,
      isActive: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    }
  }

  private async extractBody(request: NextRequest): Promise<CreateContactInfoDto> {
    const body = await request.json()
    return body as CreateContactInfoDto
  }

  private handleError(error: any): NextResponse {
    console.error('ContactInfoController error:', error)

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

    if (error.message === 'A contact with this email already exists') {
      return NextResponse.json({
        success: false,
        error: 'Contact with this email already exists'
      }, { status: 409 })
    }

    if (error.message === 'A contact with this phone already exists') {
      return NextResponse.json({
        success: false,
        error: 'Contact with this phone already exists'
      }, { status: 409 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}
