import { IPersonRepository } from '../../domain/interfaces/PersonRepository'
import { IUserRepository } from '../../domain/interfaces/UserRepository'
import { PersonDto, UpdatePersonDto } from '../dto/PersonDto'
import { Person } from '../../domain/entities/Person'
import { PersonId } from '../../domain/value-objects/PersonId'
import { TenantId } from '../../domain/value-objects/TenantId'
import { UserId } from '../../domain/value-objects/UserId'
import { ConfigurationId } from '../../domain/value-objects/ConfigurationId'

export interface UpdatePersonRequest {
  userId: string
  personId: string
  tenantId?: string
  data: UpdatePersonDto
}

export class UpdatePersonUseCase {
  constructor(
    private readonly personRepository: IPersonRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: UpdatePersonRequest): Promise<PersonDto> {
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

    // 5. Obtener la persona existente
    const existingPerson = await this.personRepository.findById(personId, finalTenantId)
    if (!existingPerson) {
      throw new Error('Person not found')
    }

    // 6. Validar que la persona pertenece al tenant
    if (!existingPerson.belongsToTenant(finalTenantId)) {
      throw new Error('Person does not belong to this tenant')
    }

    // 7. Aplicar actualizaciones
    let updatedPerson = existingPerson

    // Actualizar tipo de persona si se especifica
    if (request.data.personTypeId) {
      const newPersonTypeId = ConfigurationId.fromString(request.data.personTypeId)
      // Nota: La entidad Person no tiene método para cambiar personTypeId
      // Esto requeriría crear una nueva instancia o agregar el método
    }

    // Actualizar nombres si se especifican
    if (request.data.firstName !== undefined || 
        request.data.lastName !== undefined || 
        request.data.businessName !== undefined) {
      
      const firstName = request.data.firstName ?? existingPerson.getFirstName()
      const lastName = request.data.lastName ?? existingPerson.getLastName()
      const businessName = request.data.businessName ?? existingPerson.getBusinessName()
      
      updatedPerson = updatedPerson.updateNames(firstName, lastName, businessName)
    }

    // Actualizar identificación si se especifica
    if (request.data.identification) {
      updatedPerson = updatedPerson.updateIdentification(
        request.data.identification.type,
        request.data.identification.number
      )
    }

    // Actualizar estado activo si se especifica
    if (request.data.isActive !== undefined) {
      if (request.data.isActive) {
        updatedPerson = updatedPerson.activate()
      } else {
        updatedPerson = updatedPerson.deactivate()
      }
    }

    // 8. Validar que no existe otra persona con la misma identificación (si se cambió)
    if (request.data.identification) {
      const existingWithSameId = await this.personRepository.findByIdentification(
        finalTenantId,
        request.data.identification.type,
        request.data.identification.number
      )

      if (existingWithSameId && !existingWithSameId.getId().equals(personId)) {
        throw new Error('A person with this identification already exists')
      }
    }

    // 9. Guardar la persona actualizada
    const savedPerson = await this.personRepository.save(updatedPerson)

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
