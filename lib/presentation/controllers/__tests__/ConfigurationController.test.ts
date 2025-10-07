import { NextRequest } from 'next/server'
import { ConfigurationController } from '../ConfigurationController'
import { GetConfigurationsUseCase } from '../../../application/use-cases/GetConfigurationsUseCase'
import { CreateConfigurationUseCase } from '../../../application/use-cases/CreateConfigurationUseCase'
import { GetConfigurationByIdUseCase } from '../../../application/use-cases/GetConfigurationByIdUseCase'
import { UpdateConfigurationUseCase } from '../../../application/use-cases/UpdateConfigurationUseCase'
import { DeleteConfigurationUseCase } from '../../../application/use-cases/DeleteConfigurationUseCase'
import { ConfigurationType } from '../../../domain/entities/ConfigurationType'
import { ConfigurationId } from '../../../domain/value-objects/ConfigurationId'
import { TenantId } from '../../../domain/value-objects/TenantId'

// Mock use cases
const mockGetConfigurationsUseCase = {
  execute: jest.fn()
} as jest.Mocked<GetConfigurationsUseCase>

const mockCreateConfigurationUseCase = {
  execute: jest.fn()
} as jest.Mocked<CreateConfigurationUseCase>

const mockGetConfigurationByIdUseCase = {
  execute: jest.fn()
} as jest.Mocked<GetConfigurationByIdUseCase>

const mockUpdateConfigurationUseCase = {
  execute: jest.fn()
} as jest.Mocked<UpdateConfigurationUseCase>

const mockDeleteConfigurationUseCase = {
  execute: jest.fn()
} as jest.Mocked<DeleteConfigurationUseCase>

describe('ConfigurationController', () => {
  let controller: ConfigurationController
  let mockRequest: NextRequest
  let mockConfiguration: ConfigurationType

  beforeEach(() => {
    controller = new ConfigurationController(
      mockGetConfigurationsUseCase,
      mockCreateConfigurationUseCase,
      mockGetConfigurationByIdUseCase,
      mockUpdateConfigurationUseCase,
      mockDeleteConfigurationUseCase
    )

    const tenantId = TenantId.fromString('123e4567-e89b-12d3-a456-426614174000')
    mockConfiguration = new ConfigurationType(
      ConfigurationId.fromString('987fcdeb-51a2-43d1-b789-123456789abc'),
      'Test Configuration',
      'Test Description',
      'test-icon',
      '#FF0000',
      true,
      1,
      tenantId,
      new Date(),
      new Date()
    )

    // Reset mocks
    jest.clearAllMocks()
  })

  describe('getConfigurations', () => {
    it('should return configurations successfully', async () => {
      // Arrange
      mockRequest = new NextRequest('http://localhost:3000/api/configurations', {
        headers: {
          'authorization': 'Bearer test-token',
          'x-tenant-id': '123e4567-e89b-12d3-a456-426614174000'
        }
      })

      mockGetConfigurationsUseCase.execute.mockResolvedValue({
        configurations: [mockConfiguration],
        total: 1,
        page: 1,
        limit: 50,
        hasMore: false
      })

      // Act
      const response = await controller.getConfigurations(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.configurations).toHaveLength(1)
      expect(responseData.data.configurations[0].name).toBe('Test Configuration')
      expect(mockGetConfigurationsUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-id-placeholder',
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        filters: expect.any(Object)
      })
    })

    it('should return 401 when authorization header is missing', async () => {
      // Arrange
      mockRequest = new NextRequest('http://localhost:3000/api/configurations')

      // Act
      const response = await controller.getConfigurations(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Unauthorized')
      expect(mockGetConfigurationsUseCase.execute).not.toHaveBeenCalled()
    })

    it('should handle use case errors', async () => {
      // Arrange
      mockRequest = new NextRequest('http://localhost:3000/api/configurations', {
        headers: {
          'authorization': 'Bearer test-token'
        }
      })

      mockGetConfigurationsUseCase.execute.mockRejectedValue(new Error('User not found'))

      // Act
      const response = await controller.getConfigurations(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('User not found')
    })
  })

  describe('createConfiguration', () => {
    it('should create configuration successfully', async () => {
      // Arrange
      mockRequest = new NextRequest('http://localhost:3000/api/configurations', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          name: 'New Configuration',
          description: 'New Description',
          icon: 'new-icon',
          color: '#00FF00',
          sortOrder: 5
        })
      })

      mockCreateConfigurationUseCase.execute.mockResolvedValue({
        configuration: mockConfiguration
      })

      // Act
      const response = await controller.createConfiguration(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(responseData.data.name).toBe('Test Configuration')
      expect(mockCreateConfigurationUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-id-placeholder',
        tenantId: undefined,
        name: 'New Configuration',
        description: 'New Description',
        icon: 'new-icon',
        color: '#00FF00',
        sortOrder: 5
      })
    })

    it('should return 400 when required fields are missing', async () => {
      // Arrange
      mockRequest = new NextRequest('http://localhost:3000/api/configurations', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          name: 'New Configuration'
          // Missing required fields
        })
      })

      // Act
      const response = await controller.createConfiguration(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Missing required fields: name, description, icon, color')
      expect(mockCreateConfigurationUseCase.execute).not.toHaveBeenCalled()
    })
  })

  describe('getConfigurationById', () => {
    it('should return configuration by id successfully', async () => {
      // Arrange
      const configurationId = '987fcdeb-51a2-43d1-b789-123456789abc'
      mockRequest = new NextRequest(`http://localhost:3000/api/configurations/${configurationId}`, {
        headers: {
          'authorization': 'Bearer test-token'
        }
      })

      mockGetConfigurationByIdUseCase.execute.mockResolvedValue({
        configuration: mockConfiguration
      })

      // Act
      const response = await controller.getConfigurationById(mockRequest, configurationId)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.name).toBe('Test Configuration')
      expect(mockGetConfigurationByIdUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-id-placeholder',
        configurationId,
        tenantId: undefined
      })
    })
  })

  describe('updateConfiguration', () => {
    it('should update configuration successfully', async () => {
      // Arrange
      const configurationId = '987fcdeb-51a2-43d1-b789-123456789abc'
      mockRequest = new NextRequest(`http://localhost:3000/api/configurations/${configurationId}`, {
        method: 'PUT',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Updated Configuration',
          description: 'Updated Description'
        })
      })

      const updatedConfiguration = new ConfigurationType(
        ConfigurationId.fromString(configurationId),
        'Updated Configuration',
        'Updated Description',
        'test-icon',
        '#FF0000',
        true,
        1,
        TenantId.fromString('123e4567-e89b-12d3-a456-426614174000'),
        new Date(),
        new Date()
      )

      mockUpdateConfigurationUseCase.execute.mockResolvedValue({
        configuration: updatedConfiguration
      })

      // Act
      const response = await controller.updateConfiguration(mockRequest, configurationId)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.name).toBe('Updated Configuration')
      expect(mockUpdateConfigurationUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-id-placeholder',
        configurationId,
        tenantId: undefined,
        updates: {
          name: 'Updated Configuration',
          description: 'Updated Description'
        }
      })
    })
  })

  describe('deleteConfiguration', () => {
    it('should delete configuration successfully', async () => {
      // Arrange
      const configurationId = '987fcdeb-51a2-43d1-b789-123456789abc'
      mockRequest = new NextRequest(`http://localhost:3000/api/configurations/${configurationId}`, {
        method: 'DELETE',
        headers: {
          'authorization': 'Bearer test-token'
        }
      })

      mockDeleteConfigurationUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Configuration deleted successfully'
      })

      // Act
      const response = await controller.deleteConfiguration(mockRequest, configurationId)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.message).toBe('Configuration deleted successfully')
      expect(mockDeleteConfigurationUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-id-placeholder',
        configurationId,
        tenantId: undefined
      })
    })
  })
})
