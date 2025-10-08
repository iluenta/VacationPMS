import { IContactInfoRepository } from '../../domain/interfaces/ContactInfoRepository'
import { IUserRepository } from '../../domain/interfaces/UserRepository'
import { IPersonRepository } from '../../domain/interfaces/PersonRepository'
import { ContactInfoDto, CreateContactInfoDto } from '../dto/ContactInfoDto'
import { ContactInfo } from '../../domain/entities/ContactInfo'
import { PersonId } from '../../domain/value-objects/PersonId'
import { TenantId } from '../../domain/value-objects/TenantId'
import { UserId } from '../../domain/value-objects/UserId'

export interface CreateContactInfoRequest {
  userId: string
  personId: string
  tenantId?: string
  data: CreateContactInfoDto
}

export class CreateContactInfoUseCase {
  constructor(
    private readonly contactInfoRepository: IContactInfoRepository,
    private readonly personRepository: IPersonRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: CreateContactInfoRequest): Promise<ContactInfoDto> {
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

    // 6. Validar que no existe otro contacto con el mismo email (si se proporciona)
    if (request.data.email) {
      const existingEmail = await this.contactInfoRepository.existsEmail(
        request.data.email,
        finalTenantId
      )

      if (existingEmail) {
        throw new Error('A contact with this email already exists')
      }
    }

    // 7. Validar que no existe otro contacto con el mismo teléfono (si se proporciona)
    if (request.data.phone) {
      const existingPhone = await this.contactInfoRepository.existsPhone(
        request.data.phone,
        finalTenantId
      )

      if (existingPhone) {
        throw new Error('A contact with this phone already exists')
      }
    }

    // 8. Si se marca como primario, desmarcar otros contactos primarios
    if (request.data.isPrimary) {
      await this.contactInfoRepository.unsetPrimaryForPerson(personId, finalTenantId)
    }

    // 9. Crear el contacto
    const contactInfo = ContactInfo.create(
      personId,
      finalTenantId,
      request.data.contactName,
      request.data.phone || null,
      request.data.email || null,
      request.data.position || null,
      request.data.isPrimary || false
    )

    // 10. Guardar el contacto
    const savedContactInfo = await this.contactInfoRepository.save(contactInfo)

    // 11. Retornar DTO
    return this.mapToDto(savedContactInfo)
  }

  private mapToDto(contactInfo: ContactInfo): ContactInfoDto {
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
