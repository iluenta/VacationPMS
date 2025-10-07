import { NextRequest } from 'next/server'
import { GET, POST } from '../../../app/api/configurations-v2/route'

// Mock the container
jest.mock('../../../lib/infrastructure/container', () => ({
  getConfigurationRepository: jest.fn(),
  getUserRepository: jest.fn()
}))

// Mock the services and use cases
jest.mock('../../../lib/application/services/ConfigurationService')
jest.mock('../../../lib/application/services/UserService')
jest.mock('../../../lib/application/use-cases/GetConfigurationsUseCase')
jest.mock('../../../lib/application/use-cases/CreateConfigurationUseCase')
jest.mock('../../../lib/application/use-cases/GetConfigurationByIdUseCase')
jest.mock('../../../lib/application/use-cases/UpdateConfigurationUseCase')
jest.mock('../../../lib/application/use-cases/DeleteConfigurationUseCase')

describe('/api/configurations-v2', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 when authorization header is missing', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/configurations-v2')

      // Act
      const response = await GET(request)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should return 500 when controller throws error', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/configurations-v2', {
        headers: {
          'authorization': 'Bearer test-token'
        }
      })

      // Mock the controller to throw an error
      jest.doMock('../../../lib/presentation/controllers/ConfigurationController', () => ({
        ConfigurationController: jest.fn().mockImplementation(() => ({
          getConfigurations: jest.fn().mockRejectedValue(new Error('Test error'))
        }))
      }))

      // Act
      const response = await GET(request)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Internal server error')
    })
  })

  describe('POST', () => {
    it('should return 401 when authorization header is missing', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/configurations-v2', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Test Configuration',
          description: 'Test Description',
          icon: 'test-icon',
          color: '#FF0000'
        })
      })

      // Act
      const response = await POST(request)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should return 500 when controller throws error', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/configurations-v2', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Test Configuration',
          description: 'Test Description',
          icon: 'test-icon',
          color: '#FF0000'
        })
      })

      // Mock the controller to throw an error
      jest.doMock('../../../lib/presentation/controllers/ConfigurationController', () => ({
        ConfigurationController: jest.fn().mockImplementation(() => ({
          createConfiguration: jest.fn().mockRejectedValue(new Error('Test error'))
        }))
      }))

      // Act
      const response = await POST(request)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Internal server error')
    })
  })
})
