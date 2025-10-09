import { IPersonRepository } from '../../domain/interfaces/PersonRepository'
import { IUserRepository } from '../../domain/interfaces/UserRepository'
import { PersonDto, PersonListDto, PersonFiltersDto } from '../dto/PersonDto'
import { PersonId } from '../../domain/value-objects/PersonId'
import { TenantId } from '../../domain/value-objects/TenantId'
import { UserId } from '../../domain/value-objects/UserId'

export interface GetPersonsRequest {
  userId: string
  tenantId?: string
  filters?: PersonFiltersDto
}

export class GetPersonsUseCase {
  constructor(
    private readonly personRepository: IPersonRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: GetPersonsRequest): Promise<PersonListDto> {
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

    // 5. Preparar filtros
    const filters = {
      name: request.filters?.name,
      identificationNumber: request.filters?.identificationNumber,
      personTypeId: request.filters?.personTypeId,
      category: request.filters?.category,
      isActive: request.filters?.isActive,
      limit: request.filters?.limit || 50,
      offset: request.filters?.offset || 0
    }

    console.log('🎯 [USE CASE] Calling repository with:', {
      tenantId: finalTenantId.getValue(),
      filters
    })

    // 6. Obtener personas
    const persons = await this.personRepository.findByTenant(finalTenantId, filters)

    console.log('🎯 [USE CASE] Repository returned:', {
      personsCount: persons.length,
      firstPerson: persons[0] ? {
        id: persons[0].getId().getValue(),
        name: persons[0].getFullName()
      } : null
    })

    // 7. Obtener total para paginación
    const total = await this.personRepository.countByTenant(finalTenantId, filters)

    console.log('🎯 [USE CASE] Count result:', total)

    // 8. Retornar respuesta
    const page = Math.floor(filters.offset! / filters.limit!) + 1
    const hasMore = (filters.offset! + filters.limit!) < total
    
    return {
      persons: persons.map(this.mapToDto),
      total,
      page,
      limit: filters.limit!,
      hasMore
    }
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
      identificationDisplay: person.getIdentificationDisplay(),
      primaryContact: (person as any).primaryContact || undefined
    }
  }
}
