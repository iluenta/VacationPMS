import { IPersonRepository } from '../../domain/interfaces/PersonRepository'
import { IUserRepository } from '../../domain/interfaces/UserRepository'
import { IConfigurationRepository } from '../../domain/interfaces/ConfigurationRepository'
import { PersonDto, CreatePersonDto } from '../dto/PersonDto'
import { Person } from '../../domain/entities/Person'
import { TenantId } from '../../domain/value-objects/TenantId'
import { UserId } from '../../domain/value-objects/UserId'
import { ConfigurationId } from '../../domain/value-objects/ConfigurationId'

export interface CreatePersonRequest {
  userId: string
  tenantId?: string
  data: CreatePersonDto
}

export class CreatePersonUseCase {
  constructor(
    private readonly personRepository: IPersonRepository,
    private readonly userRepository: IUserRepository,
    private readonly configurationRepository: IConfigurationRepository
  ) {}

  async execute(request: CreatePersonRequest): Promise<PersonDto> {
    // 1. Validar y convertir IDs
    const userId = UserId.fromString(request.userId)
    const tenantId = request.tenantId ? TenantId.fromString(request.tenantId) : null

    // 2. Obtener usuario
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // 3. Determinar tenant
    // Si se proporciona tenantId en el request, usarlo (para admins multi-tenant)
    // Si no, usar el tenant del usuario
    const finalTenantId = tenantId || user.tenantId
    if (!finalTenantId) {
      throw new Error('User does not have access to any tenant')
    }

    // 4. Validar acceso del usuario al tenant
    if (!user.isAdmin && !user.belongsToTenant(finalTenantId)) {
      throw new Error('User does not have access to this tenant')
    }

    // 5. Validar que el tipo de persona existe
    const personTypeId = ConfigurationId.fromString(request.data.personTypeId)
    const personType = await this.configurationRepository.findById(personTypeId, finalTenantId)
    
    if (!personType) {
      throw new Error('Person type not found')
    }

    // 6. Validar que no existe otra persona con la misma identificación
    const existingPerson = await this.personRepository.findByIdentification(
      finalTenantId,
      request.data.identificationType,
      request.data.identificationNumber
    )

    if (existingPerson) {
      throw new Error('A person with this identification already exists')
    }

    // 7. Crear la persona según su categoría
    let person: Person

    if (request.data.personCategory === 'PHYSICAL') {
      if (!request.data.firstName || !request.data.lastName) {
        throw new Error('Physical person must have first name and last name')
      }

      person = Person.createPhysical(
        finalTenantId,
        personTypeId,
        request.data.firstName,
        request.data.lastName,
        request.data.identificationType,
        request.data.identificationNumber
      )
    } else {
      if (!request.data.businessName) {
        throw new Error('Legal person must have business name')
      }

      person = Person.createLegal(
        finalTenantId,
        personTypeId,
        request.data.businessName,
        request.data.identificationType,
        request.data.identificationNumber
      )
    }

    // 8. Aplicar estado activo si se especifica
    if (request.data.isActive === false) {
      person = person.deactivate()
    }

    // 9. Guardar la persona
    const savedPerson = await this.personRepository.save(person)

    // 10. Retornar DTO
    return this.mapToDto(savedPerson)
  }

  private mapToDto(person: Person): PersonDto {
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
