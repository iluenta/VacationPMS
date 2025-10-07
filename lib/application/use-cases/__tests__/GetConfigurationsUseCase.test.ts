import { GetConfigurationsUseCase } from '../GetConfigurationsUseCase'
import { ConfigurationService } from '../../services/ConfigurationService'
import { UserService } from '../../services/UserService'
import { User } from '../../../domain/entities/User'
import { ConfigurationType } from '../../../domain/entities/ConfigurationType'
import { UserId } from '../../../domain/value-objects/UserId'
import { TenantId } from '../../../domain/value-objects/TenantId'
import { ConfigurationId } from '../../../domain/value-objects/ConfigurationId'

// Mock dependencies
const mockConfigurationService = {
  getConfigurationById: jest.fn(),
  getConfigurationsByTenant: jest.fn(),
  getActiveConfigurationsByTenant: jest.fn(),
  createConfiguration: jest.fn(),
  updateConfiguration: jest.fn(),
  deleteConfiguration: jest.fn(),
  activateConfiguration: jest.fn(),
  deactivateConfiguration: jest.fn(),
  reorderConfigurations: jest.fn(),
  countConfigurationsByTenant: jest.fn(),
  countActiveConfigurationsByTenant: jest.fn(),
  configurationExists: jest.fn(),
  configurationExistsByName: jest.fn()
} as jest.Mocked<ConfigurationService>

const mockUserService = {
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
  determineTenantId: jest.fn(),
  validateUserAccess: jest.fn()
} as jest.Mocked<UserService>

describe('GetConfigurationsUseCase', () => {
  let useCase: GetConfigurationsUseCase
  let mockUser: User
  let mockTenantId: TenantId
  let mockConfigurations: ConfigurationType[]

  beforeEach(() => {
    useCase = new GetConfigurationsUseCase(mockConfigurationService, mockUserService)
    
    mockTenantId = TenantId.fromString('123e4567-e89b-12d3-a456-426614174000')
    mockUser = new User(
      UserId.fromString('987fcdeb-51a2-43d1-b789-123456789abc'),
      'test@example.com',
      'Test User',
      mockTenantId,
      false,
      true,
      new Date(),
      new Date()
    )

    mockConfigurations = [
      new ConfigurationType(
        ConfigurationId.fromString('11111111-2222-4333-8444-555555555555'),
        'Test Config 1',
        'Test Description 1',
        'icon1',
        '#FF0000',
        true,
        1,
        mockTenantId,
        new Date(),
        new Date()
      ),
      new ConfigurationType(
        ConfigurationId.fromString('22222222-3333-4444-8555-666666666666'),
        'Test Config 2',
        'Test Description 2',
        'icon2',
        '#00FF00',
        true,
        2,
        mockTenantId,
        new Date(),
        new Date()
      )
    ]

    // Reset mocks
    jest.clearAllMocks()
  })

  describe('execute', () => {
    it('should return configurations successfully', async () => {
      // Arrange
      mockUserService.getUserById.mockResolvedValue(mockUser)
      mockUserService.determineTenantId.mockResolvedValue(mockTenantId)
      mockUserService.validateUserAccess.mockResolvedValue(true)
      mockConfigurationService.getConfigurationsByTenant.mockResolvedValue(mockConfigurations)
      mockConfigurationService.countConfigurationsByTenant.mockResolvedValue(mockConfigurations.length)

      const request = {
        userId: mockUser.id.getValue(),
        tenantId: mockTenantId.getValue(),
        filters: {
          isActive: true,
          page: 1,
          limit: 10
        }
      }

      // Act
      const result = await useCase.execute(request)

      // Assert
      expect(result.configurations).toHaveLength(2)
      expect(result.configurations[0].name).toBe('Test Config 1')
      expect(result.configurations[1].name).toBe('Test Config 2')
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
      expect(result.hasMore).toBe(false)

      expect(mockUserService.getUserById).toHaveBeenCalledWith(mockUser.id)
      expect(mockUserService.determineTenantId).toHaveBeenCalledWith(mockUser, mockTenantId.getValue())
      expect(mockUserService.validateUserAccess).toHaveBeenCalledWith(mockUser.id, mockTenantId)
      expect(mockConfigurationService.getConfigurationsByTenant).toHaveBeenCalledWith(
        mockTenantId,
        expect.objectContaining({
          isActive: true,
          limit: 10,
          offset: 0
        })
      )
    })

    it('should throw error when user not found', async () => {
      // Arrange
      mockUserService.getUserById.mockResolvedValue(null)

      const request = {
        userId: '11111111-2222-4333-8444-555555555555',
        tenantId: mockTenantId.getValue()
      }

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('User not found')
      expect(mockUserService.getUserById).toHaveBeenCalledWith(expect.any(UserId))
    })

    it('should throw error when user does not have access to tenant', async () => {
      // Arrange
      mockUserService.getUserById.mockResolvedValue(mockUser)
      mockUserService.determineTenantId.mockResolvedValue(mockTenantId)
      mockUserService.validateUserAccess.mockResolvedValue(false)

      const request = {
        userId: mockUser.id.getValue(),
        tenantId: mockTenantId.getValue()
      }

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('User does not have access to this tenant')
      expect(mockUserService.validateUserAccess).toHaveBeenCalledWith(mockUser.id, mockTenantId)
    })

    it('should handle pagination correctly', async () => {
      // Arrange
      mockUserService.getUserById.mockResolvedValue(mockUser)
      mockUserService.determineTenantId.mockResolvedValue(mockTenantId)
      mockUserService.validateUserAccess.mockResolvedValue(true)
      mockConfigurationService.getConfigurationsByTenant.mockResolvedValue(mockConfigurations)
      mockConfigurationService.countConfigurationsByTenant.mockResolvedValue(mockConfigurations.length)

      const request = {
        userId: mockUser.id.getValue(),
        tenantId: mockTenantId.getValue(),
        filters: {
          offset: 1,
          limit: 1
        }
      }

      // Act
      const result = await useCase.execute(request)

      // Assert
      expect(result.page).toBe(2)
      expect(result.limit).toBe(1)
      expect(mockConfigurationService.getConfigurationsByTenant).toHaveBeenCalledWith(
        mockTenantId,
        expect.objectContaining({
          limit: 1,
          offset: 1
        })
      )
    })

    it('should handle filters correctly', async () => {
      // Arrange
      mockUserService.getUserById.mockResolvedValue(mockUser)
      mockUserService.determineTenantId.mockResolvedValue(mockTenantId)
      mockUserService.validateUserAccess.mockResolvedValue(true)
      mockConfigurationService.getConfigurationsByTenant.mockResolvedValue(mockConfigurations)
      mockConfigurationService.countConfigurationsByTenant.mockResolvedValue(mockConfigurations.length)

      const request = {
        userId: mockUser.id.getValue(),
        tenantId: mockTenantId.getValue(),
        filters: {
          isActive: false,
          name: 'test',
          color: '#FF0000'
        }
      }

      // Act
      await useCase.execute(request)

      // Assert
      expect(mockConfigurationService.getConfigurationsByTenant).toHaveBeenCalledWith(
        mockTenantId,
        expect.objectContaining({
          isActive: false,
          name: 'test',
          limit: 50,
          offset: 0
        })
      )
    })
  })
})
