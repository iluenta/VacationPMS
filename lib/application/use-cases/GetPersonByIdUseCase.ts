import { IPersonRepository } from '../../domain/interfaces/PersonRepository'
import { IUserRepository } from '../../domain/interfaces/UserRepository'
import { PersonDto } from '../dto/PersonDto'
import { PersonId } from '../../domain/value-objects/PersonId'
import { TenantId } from '../../domain/value-objects/TenantId'
import { UserId } from '../../domain/value-objects/UserId'

export interface GetPersonByIdRequest {
  userId: string
  personId: string
  tenantId?: string
}

export class GetPersonByIdUseCase {
  constructor(
    private readonly personRepository: IPersonRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: GetPersonByIdRequest): Promise<PersonDto> {
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

    // 5. Obtener la persona
    const person = await this.personRepository.findById(personId, finalTenantId)
    if (!person) {
      throw new Error('Person not found')
    }

    // 6. Validar que la persona pertenece al tenant
    if (!person.belongsToTenant(finalTenantId)) {
      throw new Error('Person does not belong to this tenant')
    }

    // 7. Retornar DTO
    return this.mapToDto(person)
  }

  private mapToDto(person: any): PersonDto {
    return {
      id: person.getId().getValue(),
      tenantId: person.getTenantId().getValue(),
      personTypeId: person.getPersonTypeId().getValue(),
      firstName: person.getFirstName(),
      lastName: person.getLastName(),
      businessName: person.getBusinessName(),
      identificationType: person.getIdentificationType(),
      identificationNumber: person.getIdentificationNumber(),
      personCategory: person.getPersonCategory(),
      isActive: person.getIsActive(),
      createdAt: person.getCreatedAt().toISOString(),
      updatedAt: person.getUpdatedAt().toISOString(),
      fullName: person.getFullName(),
      displayName: person.getDisplayName(),
      identificationDisplay: person.getIdentificationDisplay()
    }
  }
}
