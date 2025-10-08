import { GetPersonsUseCase } from '../GetPersonsUseCase'
import { IPersonRepository } from '../../../domain/interfaces/PersonRepository'
import { IUserRepository } from '../../../domain/interfaces/UserRepository'
import { UserId } from '../../../domain/value-objects/UserId'
import { TenantId } from '../../../domain/value-objects/TenantId'
import { User } from '../../../domain/entities/User'
import { Person } from '../../../domain/entities/Person'
import { PersonId } from '../../../domain/value-objects/PersonId'
import { ConfigurationId } from '../../../domain/value-objects/ConfigurationId'

describe('GetPersonsUseCase', () => {
  let useCase: GetPersonsUseCase
  let mockPersonRepository: jest.Mocked<IPersonRepository>
  let mockUserRepository: jest.Mocked<IUserRepository>
  let mockUser: User
  let mockTenantId: TenantId
  let mockUserId: UserId

  beforeEach(() => {
    mockPersonRepository = {
      findById: jest.fn(),
      findByTenant: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsByIdentification: jest.fn(),
      countByTenant: jest.fn()
    } as any

    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as any

    useCase = new GetPersonsUseCase(mockPersonRepository, mockUserRepository)

    mockUserId = UserId.fromString('453129fb-950e-4934-a1ff-2cb83ca697cd')
    mockTenantId = TenantId.fromString('00000001-0000-4000-8000-000000000000')
    
    mockUser = new User(
      mockUserId,
      'test@example.com',
      'Test User',
      true, // isAdmin
      mockTenantId,
      true,
      new Date(),
      new Date()
    )
  })

  describe('execute', () => {
    it('should return persons for admin user', async () => {
      // Arrange
      const mockPerson = Person.createPhysical(
        mockTenantId,
        ConfigurationId.fromString('223e4567-e89b-12d3-a456-426614174000'),
        'John',
        'Doe',
        'DNI',
        '12345678A'
      )

      mockUserRepository.findById.mockResolvedValue(mockUser)
      mockPersonRepository.findByTenant.mockResolvedValue([mockPerson])
      mockPersonRepository.countByTenant.mockResolvedValue(1)

      // Act
      const result = await useCase.execute({
        userId: mockUserId.getValue(),
        tenantId: mockTenantId.getValue(),
        filters: { limit: 50, offset: 0 }
      })

      // Assert
      expect(result.persons).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.hasMore).toBe(false)
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId)
      expect(mockPersonRepository.findByTenant).toHaveBeenCalled()
    })

    it('should throw error when user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute({
        userId: mockUserId.getValue(),
        tenantId: mockTenantId.getValue(),
        filters: { limit: 50, offset: 0 }
      })).rejects.toThrow('User not found')
    })

    it('should throw error when non-admin user accesses different tenant', async () => {
      // Arrange
      const nonAdminUser = new User(
        mockUserId,
        'test@example.com',
        'Test User',
        false, // NOT admin
        mockTenantId,
        true,
        new Date(),
        new Date()
      )

      const differentTenantId = TenantId.fromString('00000002-0000-4000-8000-000000000000')

      mockUserRepository.findById.mockResolvedValue(nonAdminUser)

      // Act & Assert
      await expect(useCase.execute({
        userId: mockUserId.getValue(),
        tenantId: differentTenantId.getValue(),
        filters: { limit: 50, offset: 0 }
      })).rejects.toThrow('User does not have access to this tenant')
    })

    it('should apply name filter correctly', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser)
      mockPersonRepository.findByTenant.mockResolvedValue([])
      mockPersonRepository.countByTenant.mockResolvedValue(0)

      // Act
      await useCase.execute({
        userId: mockUserId.getValue(),
        tenantId: mockTenantId.getValue(),
        filters: { name: 'John', limit: 50, offset: 0 }
      })

      // Assert
      expect(mockPersonRepository.findByTenant).toHaveBeenCalledWith(
        mockTenantId,
        expect.objectContaining({ name: 'John' })
      )
    })

    it('should handle pagination correctly', async () => {
      // Arrange
      const persons: Person[] = []
      for (let i = 0; i < 25; i++) {
        persons.push(Person.createPhysical(
          mockTenantId,
          ConfigurationId.fromString('223e4567-e89b-12d3-a456-426614174000'),
          `Person${i}`,
          `Last${i}`,
          'DNI',
          `1234567${i}A`
        ))
      }

      mockUserRepository.findById.mockResolvedValue(mockUser)
      mockPersonRepository.findByTenant.mockResolvedValue(persons)
      mockPersonRepository.countByTenant.mockResolvedValue(100)

      // Act
      const result = await useCase.execute({
        userId: mockUserId.getValue(),
        tenantId: mockTenantId.getValue(),
        filters: { limit: 25, offset: 0 }
      })

      // Assert
      expect(result.persons).toHaveLength(25)
      expect(result.total).toBe(100)
      expect(result.page).toBe(1)
      expect(result.hasMore).toBe(true)
    })
  })
})
