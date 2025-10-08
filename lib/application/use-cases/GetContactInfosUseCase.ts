import { IContactInfoRepository } from '../../domain/interfaces/ContactInfoRepository'
import { IUserRepository } from '../../domain/interfaces/UserRepository'
import { ContactInfoDto, ContactInfoListDto, ContactInfoFiltersDto } from '../dto/ContactInfoDto'
import { PersonId } from '../../domain/value-objects/PersonId'
import { TenantId } from '../../domain/value-objects/TenantId'
import { UserId } from '../../domain/value-objects/UserId'

export interface GetContactInfosRequest {
  userId: string
  personId: string
  tenantId?: string
  filters?: ContactInfoFiltersDto
}

export class GetContactInfosUseCase {
  constructor(
    private readonly contactInfoRepository: IContactInfoRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: GetContactInfosRequest): Promise<ContactInfoListDto> {
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

    // 5. Preparar filtros
    const filters = {
      contactName: request.filters?.contactName,
      phone: request.filters?.phone,
      email: request.filters?.email,
      isPrimary: request.filters?.isPrimary,
      isActive: request.filters?.isActive,
      limit: request.filters?.limit || 50,
      offset: request.filters?.offset || 0
    }

    // 6. Obtener contactos
    const contactInfos = await this.contactInfoRepository.findByPerson(personId, finalTenantId, filters)

    // 7. Obtener total para paginación
    const total = await this.contactInfoRepository.countByPerson(personId, finalTenantId, filters)

    // 8. Retornar respuesta
    const page = Math.floor(filters.offset! / filters.limit!) + 1
    const hasMore = (filters.offset! + filters.limit!) < total
    
    return {
      contactInfos: contactInfos.map(this.mapToDto),
      total,
      page,
      limit: filters.limit!,
      hasMore
    }
  }

  private mapToDto(contactInfo: any): ContactInfoDto {
    return {
      id: contactInfo.getId().getValue(),
      personId: contactInfo.getPersonId().getValue(),
      tenantId: contactInfo.getTenantId().getValue(),
      contactName: contactInfo.getContactName(),
      phone: contactInfo.getPhone(),
      email: contactInfo.getEmail(),
      position: contactInfo.getPosition(),
      isPrimary: contactInfo.getIsPrimary(),
      isActive: contactInfo.getIsActive(),
      createdAt: contactInfo.getCreatedAt().toISOString(),
      updatedAt: contactInfo.getUpdatedAt().toISOString(),
      displayName: contactInfo.getDisplayName(),
      contactDisplay: contactInfo.getContactDisplay(),
      hasPhone: contactInfo.hasPhone(),
      hasEmail: contactInfo.hasEmail()
    }
  }
}
