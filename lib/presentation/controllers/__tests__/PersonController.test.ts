import { PersonController } from '../PersonController'
import { GetPersonsUseCase } from '../../../application/use-cases/GetPersonsUseCase'
import { CreatePersonUseCase } from '../../../application/use-cases/CreatePersonUseCase'
import { GetPersonByIdUseCase } from '../../../application/use-cases/GetPersonByIdUseCase'
import { UpdatePersonUseCase } from '../../../application/use-cases/UpdatePersonUseCase'
import { DeletePersonUseCase } from '../../../application/use-cases/DeletePersonUseCase'
import { NextRequest } from 'next/server'

// Mock de requireAuthenticatedUser
jest.mock('../../../presentation/middleware/get-authenticated-user', () => ({
  requireAuthenticatedUser: jest.fn()
}))

import { requireAuthenticatedUser } from '../../../presentation/middleware/get-authenticated-user'

const mockRequireAuthenticatedUser = requireAuthenticatedUser as jest.MockedFunction<typeof requireAuthenticatedUser>

describe('PersonController', () => {
  let personController: PersonController
  let mockGetPersonsUseCase: jest.Mocked<GetPersonsUseCase>
  let mockCreatePersonUseCase: jest.Mocked<CreatePersonUseCase>
  let mockGetPersonByIdUseCase: jest.Mocked<GetPersonByIdUseCase>
  let mockUpdatePersonUseCase: jest.Mocked<UpdatePersonUseCase>
  let mockDeletePersonUseCase: jest.Mocked<DeletePersonUseCase>

  beforeEach(() => {
    mockGetPersonsUseCase = {
      execute: jest.fn()
    } as any

    mockCreatePersonUseCase = {
      execute: jest.fn()
    } as any

    mockGetPersonByIdUseCase = {
      execute: jest.fn()
    } as any

    mockUpdatePersonUseCase = {
      execute: jest.fn()
    } as any

    mockDeletePersonUseCase = {
      execute: jest.fn()
    } as any

    personController = new PersonController(
      mockGetPersonsUseCase,
      mockCreatePersonUseCase,
      mockGetPersonByIdUseCase,
      mockUpdatePersonUseCase,
      mockDeletePersonUseCase
    )
  })

  describe('getPersons', () => {
    it('should return persons successfully', async () => {
      // Arrange
      const mockUserId = '453129fb-950e-4934-a1ff-2cb83ca697cd'
      mockRequireAuthenticatedUser.mockResolvedValue(mockUserId)

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer test-token')
        },
        nextUrl: {
          searchParams: {
            get: jest.fn((key: string) => {
              if (key === 'tenant_id') return '00000000-0000-0000-0000-000000000001'
              if (key === 'limit') return '50'
              if (key === 'offset') return '0'
              return null
            })
          }
        }
      } as any

      const mockResult = {
        persons: [],
        total: 0,
        page: 1,
        limit: 50,
        hasMore: false
      }

      mockGetPersonsUseCase.execute.mockResolvedValue(mockResult)

      // Act
      const response = await personController.getPersons(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.persons).toEqual(mockResult.persons)
      expect(mockGetPersonsUseCase.execute).toHaveBeenCalled()
    })

    it('should return 401 if no authorization header', async () => {
      // Arrange
      mockRequireAuthenticatedUser.mockRejectedValue(new Error('Authorization header required'))

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null)
        },
        nextUrl: {
          searchParams: {
            get: jest.fn().mockReturnValue(null)
          }
        }
      } as any

      // Act
      const response = await personController.getPersons(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should handle use case errors', async () => {
      // Arrange
      const mockUserId = '453129fb-950e-4934-a1ff-2cb83ca697cd'
      mockRequireAuthenticatedUser.mockResolvedValue(mockUserId)

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer test-token')
        },
        nextUrl: {
          searchParams: {
            get: jest.fn((key: string) => {
              if (key === 'limit') return '50'
              if (key === 'offset') return '0'
              return null
            })
          }
        }
      } as any

      mockGetPersonsUseCase.execute.mockRejectedValue(new Error('User not found'))

      // Act
      const response = await personController.getPersons(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('User not found')
    })
  })

  describe('createPerson', () => {
    it('should create person successfully', async () => {
      // Arrange
      const mockUserId = '453129fb-950e-4934-a1ff-2cb83ca697cd'
      mockRequireAuthenticatedUser.mockResolvedValue(mockUserId)

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) => {
            if (key === 'x-tenant-id') return '00000000-0000-0000-0000-000000000001'
            if (key === 'authorization') return 'Bearer test-token'
            return null
          })
        },
        nextUrl: {
          searchParams: {
            get: jest.fn().mockReturnValue(null)
          }
        },
        json: jest.fn().mockResolvedValue({
          firstName: 'John',
          lastName: 'Doe',
          identificationType: 'DNI',
          identificationNumber: '12345678A',
          personCategory: 'PHYSICAL',
          personTypeId: '123e4567-e89b-12d3-a456-426614174000'
        })
      } as any

      const mockResult = {
        id: '12345678-1234-1234-1234-123456789012',
        firstName: 'John',
        lastName: 'Doe',
        identificationType: 'DNI',
        identificationNumber: '12345678A',
        personCategory: 'PHYSICAL'
      } as any

      mockCreatePersonUseCase.execute.mockResolvedValue(mockResult)

      // Act
      const response = await personController.createPerson(mockRequest)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual(mockResult)
    })
  })

  describe('getPersonById', () => {
    it('should return person by id successfully', async () => {
      // Arrange
      const mockUserId = '453129fb-950e-4934-a1ff-2cb83ca697cd'
      mockRequireAuthenticatedUser.mockResolvedValue(mockUserId)

      const personId = '12345678-1234-1234-1234-123456789012'
      const mockRequest = {
        headers: {
          get: jest.fn((key: string) => {
            if (key === 'authorization') return 'Bearer test-token'
            return null
          })
        },
        nextUrl: {
          searchParams: {
            get: jest.fn((key: string) => {
              if (key === 'tenant_id') return '00000000-0000-0000-0000-000000000001'
              return null
            })
          }
        }
      } as any

      const mockResult = {
        id: personId,
        firstName: 'John',
        lastName: 'Doe'
      } as any

      mockGetPersonByIdUseCase.execute.mockResolvedValue(mockResult)

      // Act
      const response = await personController.getPersonById(mockRequest, personId)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual(mockResult)
    })

    it('should return 404 if person not found', async () => {
      // Arrange
      const mockUserId = '453129fb-950e-4934-a1ff-2cb83ca697cd'
      mockRequireAuthenticatedUser.mockResolvedValue(mockUserId)

      const personId = '12345678-1234-1234-1234-123456789012'
      const mockRequest = {
        headers: {
          get: jest.fn((key: string) => {
            if (key === 'authorization') return 'Bearer test-token'
            return null
          })
        },
        nextUrl: {
          searchParams: {
            get: jest.fn((key: string) => {
              if (key === 'tenant_id') return '00000000-0000-0000-0000-000000000001'
              return null
            })
          }
        }
      } as any

      mockGetPersonByIdUseCase.execute.mockResolvedValue(null)

      // Act
      const response = await personController.getPersonById(mockRequest, personId)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Person not found')
    })
  })
})
