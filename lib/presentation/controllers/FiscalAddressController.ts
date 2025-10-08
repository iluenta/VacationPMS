import { NextRequest, NextResponse } from 'next/server'
import { GetFiscalAddressUseCase } from '../../application/use-cases/GetFiscalAddressUseCase'
import { CreateFiscalAddressUseCase } from '../../application/use-cases/CreateFiscalAddressUseCase'
import { FiscalAddressDto, CreateFiscalAddressDto, UpdateFiscalAddressDto } from '../../application/dto/FiscalAddressDto'
import { requireAuthenticatedUser } from '../middleware/get-authenticated-user'

export class FiscalAddressController {
  constructor(
    private readonly getFiscalAddressUseCase: GetFiscalAddressUseCase,
    private readonly createFiscalAddressUseCase: CreateFiscalAddressUseCase
  ) {}

  async getFiscalAddress(request: NextRequest, personId: string): Promise<NextResponse> {
    try {
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)

      const result = await this.getFiscalAddressUseCase.execute({
        userId,
        personId,
        tenantId
      })

      if (!result) {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No fiscal address found for this person'
        }, { status: 200 })
      }

      return NextResponse.json({
        success: true,
        data: result
      }, { status: 200 })

    } catch (error) {
      return this.handleError(error)
    }
  }

  async createFiscalAddress(request: NextRequest, personId: string): Promise<NextResponse> {
    try {
      const userId = await this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const body = await this.extractBody(request)

      const result = await this.createFiscalAddressUseCase.execute({
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

  private async extractBody(request: NextRequest): Promise<CreateFiscalAddressDto> {
    const body = await request.json()
    return body as CreateFiscalAddressDto
  }

  private handleError(error: any): NextResponse {
    console.error('FiscalAddressController error:', error)

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

    if (error.message === 'Person already has a fiscal address. Use update instead.') {
      return NextResponse.json({
        success: false,
        error: 'Person already has a fiscal address'
      }, { status: 409 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}
