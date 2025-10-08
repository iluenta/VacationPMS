import { IFiscalAddressRepository } from '../../domain/interfaces/FiscalAddressRepository'
import { IUserRepository } from '../../domain/interfaces/UserRepository'
import { FiscalAddressDto } from '../dto/FiscalAddressDto'
import { PersonId } from '../../domain/value-objects/PersonId'
import { TenantId } from '../../domain/value-objects/TenantId'
import { UserId } from '../../domain/value-objects/UserId'

export interface GetFiscalAddressRequest {
  userId: string
  personId: string
  tenantId?: string
}

export class GetFiscalAddressUseCase {
  constructor(
    private readonly fiscalAddressRepository: IFiscalAddressRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: GetFiscalAddressRequest): Promise<FiscalAddressDto | null> {
    // 1. Validar y convertir IDs
    const userId = UserId.fromString(request.userId)
    const personId = PersonId.fromString(request.personId)
    const tenantId = request.tenantId ? TenantId.fromString(request.tenantId) : null

    // 2. Obtener usuario
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // 3. Determinar tenant
    const finalTenantId = tenantId || user.tenantId
    if (!finalTenantId) {
      throw new Error('User does not have access to any tenant')
    }

    // 4. Validar acceso del usuario al tenant
    if (!user.isAdmin && !user.belongsToTenant(finalTenantId)) {
      throw new Error('User does not have access to this tenant')
    }

    // 5. Obtener el domicilio fiscal
    const fiscalAddress = await this.fiscalAddressRepository.findByPerson(personId, finalTenantId)

    // 6. Si no existe, retornar null
    if (!fiscalAddress) {
      return null
    }

    // 7. Validar que el domicilio pertenece al tenant
    if (!fiscalAddress.belongsToTenant(finalTenantId)) {
      throw new Error('Fiscal address does not belong to this tenant')
    }

    // 8. Retornar DTO
    return this.mapToDto(fiscalAddress)
  }

  private mapToDto(fiscalAddress: any): FiscalAddressDto {
    return {
      id: fiscalAddress.getId().getValue(),
      personId: fiscalAddress.getPersonId().getValue(),
      tenantId: fiscalAddress.getTenantId().getValue(),
      street: fiscalAddress.getStreet(),
      number: fiscalAddress.getNumber(),
      floor: fiscalAddress.getFloor(),
      door: fiscalAddress.getDoor(),
      postalCode: fiscalAddress.getPostalCode(),
      city: fiscalAddress.getCity(),
      province: fiscalAddress.getProvince(),
      country: fiscalAddress.getCountry(),
      isActive: fiscalAddress.getIsActive(),
      createdAt: fiscalAddress.getCreatedAt().toISOString(),
      updatedAt: fiscalAddress.getUpdatedAt().toISOString(),
      fullAddress: fiscalAddress.getFullAddress(),
      shortAddress: fiscalAddress.getShortAddress(),
      location: fiscalAddress.getLocation(),
      isInSpain: fiscalAddress.isInSpain()
    }
  }
}
