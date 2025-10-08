import { IPersonRepository } from '../../domain/interfaces/PersonRepository'
import { IUserRepository } from '../../domain/interfaces/UserRepository'
import { PersonId } from '../../domain/value-objects/PersonId'
import { TenantId } from '../../domain/value-objects/TenantId'
import { UserId } from '../../domain/value-objects/UserId'

export interface DeletePersonRequest {
  userId: string
  personId: string
  tenantId?: string
}

export class DeletePersonUseCase {
  constructor(
    private readonly personRepository: IPersonRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: DeletePersonRequest): Promise<void> {
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

    // 5. Verificar que la persona existe
    const existingPerson = await this.personRepository.findById(personId, finalTenantId)
    if (!existingPerson) {
      throw new Error('Person not found')
    }

    // 6. Validar que la persona pertenece al tenant
    if (!existingPerson.belongsToTenant(finalTenantId)) {
      throw new Error('Person does not belong to this tenant')
    }

    // 7. Verificar que no es un usuario de la plataforma (no se puede eliminar)
    if (existingPerson.getPersonCategory() === 'PHYSICAL' && 
        existingPerson.getIdentificationNumber().startsWith('MIGRATED-')) {
      throw new Error('Cannot delete platform users. Deactivate instead.')
    }

    // 8. Eliminar la persona (esto eliminará automáticamente contactos y direcciones fiscales por CASCADE)
    await this.personRepository.delete(personId, finalTenantId)
  }
}
