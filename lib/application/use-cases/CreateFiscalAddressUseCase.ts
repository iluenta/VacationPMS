import { IFiscalAddressRepository } from '../../domain/interfaces/FiscalAddressRepository'
import { IUserRepository } from '../../domain/interfaces/UserRepository'
import { IPersonRepository } from '../../domain/interfaces/PersonRepository'
import { FiscalAddressDto, CreateFiscalAddressDto } from '../dto/FiscalAddressDto'
import { FiscalAddress } from '../../domain/entities/FiscalAddress'
import { PersonId } from '../../domain/value-objects/PersonId'
import { TenantId } from '../../domain/value-objects/TenantId'
import { UserId } from '../../domain/value-objects/UserId'

export interface CreateFiscalAddressRequest {
  userId: string
  personId: string
  tenantId?: string
  data: CreateFiscalAddressDto
}

export class CreateFiscalAddressUseCase {
  constructor(
    private readonly fiscalAddressRepository: IFiscalAddressRepository,
    private readonly personRepository: IPersonRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: CreateFiscalAddressRequest): Promise<FiscalAddressDto> {
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

    // 5. Verificar que la persona existe y pertenece al tenant
    const person = await this.personRepository.findById(personId, finalTenantId)
    if (!person) {
      throw new Error('Person not found')
    }

    if (!person.belongsToTenant(finalTenantId)) {
      throw new Error('Person does not belong to this tenant')
    }

    // 6. Verificar que la persona no tiene ya un domicilio fiscal
    const existingAddress = await this.fiscalAddressRepository.findByPerson(personId, finalTenantId)
    if (existingAddress) {
      throw new Error('Person already has a fiscal address. Use update instead.')
    }

    // 7. Crear el domicilio fiscal
    const fiscalAddress = FiscalAddress.create(
      personId,
      finalTenantId,
      request.data.street,
      request.data.number || null,
      request.data.floor || null,
      request.data.door || null,
      request.data.postalCode,
      request.data.city,
      request.data.province || null,
      request.data.country || 'España'
    )

    // 8. Guardar el domicilio fiscal
    const savedFiscalAddress = await this.fiscalAddressRepository.save(fiscalAddress)

    // 9. Retornar DTO
    return this.mapToDto(savedFiscalAddress)
  }

  private mapToDto(fiscalAddress: FiscalAddress): FiscalAddressDto {
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
