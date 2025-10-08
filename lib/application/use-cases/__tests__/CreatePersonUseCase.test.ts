import { CreatePersonUseCase } from '../CreatePersonUseCase'
import { IPersonRepository } from '../../../domain/interfaces/PersonRepository'
import { IUserRepository } from '../../../domain/interfaces/UserRepository'
import { IConfigurationRepository } from '../../../domain/interfaces/ConfigurationRepository'
import { UserId } from '../../../domain/value-objects/UserId'
import { TenantId } from '../../../domain/value-objects/TenantId'
import { ConfigurationId } from '../../../domain/value-objects/ConfigurationId'
import { User } from '../../../domain/entities/User'
import { ConfigurationType } from '../../../domain/entities/ConfigurationType'
import { Person } from '../../../domain/entities/Person'

describe('CreatePersonUseCase', () => {
  let useCase: CreatePersonUseCase
  let mockPersonRepository: jest.Mocked<IPersonRepository>
  let mockUserRepository: jest.Mocked<IUserRepository>
  let mockConfigurationRepository: jest.Mocked<IConfigurationRepository>
  let mockUser: User
  let mockTenantId: TenantId
  let mockUserId: UserId
  let mockPersonTypeId: ConfigurationId

  beforeEach(() => {
    mockPersonRepository = {
      findById: jest.fn(),
      findByTenant: jest.fn(),
      findByIdentification: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByIdentification: jest.fn(),
      countByTenant: jest.fn()
    } as any

    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as any

    mockConfigurationRepository = {
      findById: jest.fn(),
      findByTenant: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      countByTenant: jest.fn()
    } as any

    useCase = new CreatePersonUseCase(
      mockPersonRepository,
      mockUserRepository,
      mockConfigurationRepository
    )

    mockUserId = UserId.fromString('453129fb-950e-4934-a1ff-2cb83ca697cd')
    mockTenantId = TenantId.fromString('00000001-0000-4000-8000-000000000000')
    mockPersonTypeId = ConfigurationId.fromString('223e4567-e89b-12d3-a456-426614174000')
    
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
    it('should create a physical person successfully', async () => {
      // Arrange
      // Mock de ConfigurationType como objeto plano para evitar problemas de validación
      const mockConfiguration = {
        id: mockPersonTypeId,
        tenantId: mockTenantId,
        name: 'Cliente',
        description: 'Tipo de cliente',
        icon: 'person',
        color: '#FF0000',
        sortOrder: 1,
        isActive: true,
        belongsToTenant: jest.fn().mockReturnValue(true)
      } as any

      const mockPerson = Person.createPhysical(
        mockTenantId,
        mockPersonTypeId,
        'John',
        'Doe',
        'DNI',
        '12345678A'
      )

      mockUserRepository.findById.mockResolvedValue(mockUser)
      mockConfigurationRepository.findById.mockResolvedValue(mockConfiguration)
      mockPersonRepository.findByIdentification.mockResolvedValue(false)
      mockPersonRepository.save.mockResolvedValue(mockPerson)

      // Act
      const result = await useCase.execute({
        userId: mockUserId.getValue(),
        tenantId: mockTenantId.getValue(),
        data: {
          firstName: 'John',
          lastName: 'Doe',
          identificationType: 'DNI',
          identificationNumber: '12345678A',
          personCategory: 'PHYSICAL',
          personTypeId: mockPersonTypeId.getValue(),
          isActive: true
        }
      })

      // Assert
      expect(result).toBeDefined()
      expect(result.firstName).toBe('John')
      expect(result.lastName).toBe('Doe')
      expect(mockPersonRepository.save).toHaveBeenCalled()
    })

    it('should create a legal person successfully', async () => {
      // Arrange
      const mockConfiguration = {
        id: mockPersonTypeId,
        tenantId: mockTenantId,
        name: 'Empresa',
        description: 'Tipo de empresa',
        icon: 'business',
        color: '#00FF00',
        sortOrder: 1,
        isActive: true,
        belongsToTenant: jest.fn().mockReturnValue(true)
      } as any

      const mockPerson = Person.createLegal(
        mockTenantId,
        mockPersonTypeId,
        'Acme Corp',
        'CIF',
        'B12345678'
      )

      mockUserRepository.findById.mockResolvedValue(mockUser)
      mockConfigurationRepository.findById.mockResolvedValue(mockConfiguration)
      mockPersonRepository.findByIdentification.mockResolvedValue(false)
      mockPersonRepository.save.mockResolvedValue(mockPerson)

      // Act
      const result = await useCase.execute({
        userId: mockUserId.getValue(),
        tenantId: mockTenantId.getValue(),
        data: {
          businessName: 'Acme Corp',
          identificationType: 'CIF',
          identificationNumber: 'B12345678',
          personCategory: 'LEGAL',
          personTypeId: mockPersonTypeId.getValue(),
          isActive: true
        }
      })

      // Assert
      expect(result).toBeDefined()
      expect(result.businessName).toBe('Acme Corp')
      expect(mockPersonRepository.save).toHaveBeenCalled()
    })

    it('should throw error when user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute({
        userId: mockUserId.getValue(),
        tenantId: mockTenantId.getValue(),
        data: {
          firstName: 'John',
          lastName: 'Doe',
          identificationType: 'DNI',
          identificationNumber: '12345678A',
          personCategory: 'PHYSICAL',
          personTypeId: mockPersonTypeId.getValue()
        }
      })).rejects.toThrow('User not found')
    })

    it('should throw error when person type not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser)
      mockConfigurationRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute({
        userId: mockUserId.getValue(),
        tenantId: mockTenantId.getValue(),
        data: {
          firstName: 'John',
          lastName: 'Doe',
          identificationType: 'DNI',
          identificationNumber: '12345678A',
          personCategory: 'PHYSICAL',
          personTypeId: mockPersonTypeId.getValue()
        }
      })).rejects.toThrow('Person type not found')
    })

    it('should throw error when identification already exists', async () => {
      // Arrange
      const mockConfiguration = {
        id: mockPersonTypeId,
        tenantId: mockTenantId,
        name: 'Cliente',
        description: 'Tipo de cliente',
        icon: 'person',
        color: '#FF0000',
        sortOrder: 1,
        isActive: true,
        belongsToTenant: jest.fn().mockReturnValue(true)
      } as any

      mockUserRepository.findById.mockResolvedValue(mockUser)
      mockConfigurationRepository.findById.mockResolvedValue(mockConfiguration)
      const existingPerson = Person.createPhysical(mockTenantId, mockPersonTypeId, 'Existing', 'Person', 'DNI', '12345678A')
      mockPersonRepository.findByIdentification.mockResolvedValue(existingPerson)

      // Act & Assert
      await expect(useCase.execute({
        userId: mockUserId.getValue(),
        tenantId: mockTenantId.getValue(),
        data: {
          firstName: 'John',
          lastName: 'Doe',
          identificationType: 'DNI',
          identificationNumber: '12345678A',
          personCategory: 'PHYSICAL',
          personTypeId: mockPersonTypeId.getValue()
        }
      })).rejects.toThrow('A person with this identification already exists')
    })

    it('should throw error when non-admin tries to create in different tenant', async () => {
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
        data: {
          firstName: 'John',
          lastName: 'Doe',
          identificationType: 'DNI',
          identificationNumber: '12345678A',
          personCategory: 'PHYSICAL',
          personTypeId: mockPersonTypeId.getValue()
        }
      })).rejects.toThrow('User does not have access to this tenant')
    })

    it('should create inactive person when isActive is false', async () => {
      // Arrange
      const mockConfiguration = {
        id: mockPersonTypeId,
        tenantId: mockTenantId,
        name: 'Cliente',
        description: 'Tipo de cliente',
        icon: 'person',
        color: '#FF0000',
        sortOrder: 1,
        isActive: true,
        belongsToTenant: jest.fn().mockReturnValue(true)
      } as any

      const mockPerson = Person.createPhysical(
        mockTenantId,
        mockPersonTypeId,
        'John',
        'Doe',
        'DNI',
        '12345678A'
      ).deactivate()

      mockUserRepository.findById.mockResolvedValue(mockUser)
      mockConfigurationRepository.findById.mockResolvedValue(mockConfiguration)
      mockPersonRepository.findByIdentification.mockResolvedValue(false)
      mockPersonRepository.save.mockResolvedValue(mockPerson)

      // Act
      const result = await useCase.execute({
        userId: mockUserId.getValue(),
        tenantId: mockTenantId.getValue(),
        data: {
          firstName: 'John',
          lastName: 'Doe',
          identificationType: 'DNI',
          identificationNumber: '12345678A',
          personCategory: 'PHYSICAL',
          personTypeId: mockPersonTypeId.getValue(),
          isActive: false
        }
      })

      // Assert
      expect(result).toBeDefined()
      expect(result.isActive).toBe(false)
    })
  })
})

