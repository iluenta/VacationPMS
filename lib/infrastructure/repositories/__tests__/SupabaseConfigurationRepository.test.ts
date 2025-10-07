import { SupabaseConfigurationRepository } from '../SupabaseConfigurationRepository'
import { ConfigurationId } from '../../../domain/value-objects/ConfigurationId'
import { TenantId } from '../../../domain/value-objects/TenantId'
import { ConfigurationType } from '../../../domain/entities/ConfigurationType'

// Mock del cliente Supabase con encadenamiento correcto
const createMockQuery = (mockResult: any) => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(mockResult),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis()
  }
  
  // Configurar el método final para retornar el resultado
  mockQuery.order.mockResolvedValue(mockResult)
  mockQuery.range.mockResolvedValue(mockResult)
  
  // Configurar el método delete para retornar error si está presente
  if (mockResult.error) {
    mockQuery.eq.mockResolvedValue(mockResult)
  }
  
  return mockQuery
}

const mockSupabaseClient = {
  from: jest.fn(() => createMockQuery({ data: null, error: null }))
}

describe('SupabaseConfigurationRepository', () => {
  let repository: SupabaseConfigurationRepository
  let mockConfigurationId: ConfigurationId
  let mockTenantId: TenantId

  beforeEach(() => {
    repository = new SupabaseConfigurationRepository(mockSupabaseClient as any)
    mockConfigurationId = ConfigurationId.fromString('123e4567-e89b-12d3-a456-426614174000')
    mockTenantId = TenantId.fromString('123e4567-e89b-12d3-a456-426614174001')
    
    // Reset mocks
    jest.clearAllMocks()
  })

  describe('findById', () => {
    it('should return configuration when found', async () => {
      // Arrange
      const mockData = {
        id: mockConfigurationId.getValue(),
        name: 'Test Configuration',
        description: 'Test Description',
        icon: 'test-icon',
        color: '#FF0000',
        is_active: true,
        sort_order: 1,
        tenant_id: mockTenantId.getValue(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const mockQuery = createMockQuery({
        data: mockData,
        error: null
      })
      
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      // Act
      const result = await repository.findById(mockConfigurationId, mockTenantId)

      // Assert
      expect(result).toBeDefined()
      expect(result?.name).toBe('Test Configuration')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('configuration_types')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', mockConfigurationId.getValue())
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', mockTenantId.getValue())
      expect(mockQuery.single).toHaveBeenCalled()
    })

    it('should return null when configuration not found', async () => {
      // Arrange
      const mockQuery = createMockQuery({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' }
      })
      
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      // Act
      const result = await repository.findById(mockConfigurationId, mockTenantId)

      // Assert
      expect(result).toBeNull()
    })

    it('should throw error when database error occurs', async () => {
      // Arrange
      const mockQuery = createMockQuery({
        data: null,
        error: { code: 'PGRST001', message: 'Database error' }
      })
      
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      // Act & Assert
      await expect(repository.findById(mockConfigurationId, mockTenantId)).rejects.toThrow('Database error: Database error')
    })
  })

  describe('findByTenant', () => {
    it('should return configurations with filters', async () => {
      // Arrange
      const mockData = [
        {
          id: mockConfigurationId.getValue(),
          name: 'Test Configuration',
          description: 'Test Description',
          icon: 'test-icon',
          color: '#FF0000',
          is_active: true,
          sort_order: 1,
          tenant_id: mockTenantId.getValue(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      const mockQuery = createMockQuery({
        data: mockData,
        error: null
      })
      
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const filters = { limit: 10, offset: 0 }

      // Act
      const result = await repository.findByTenant(mockTenantId, filters)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test Configuration')
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9)
    })

    it('should apply name filter with ilike', async () => {
      // Arrange
      const mockQuery = createMockQuery({
        data: [],
        error: null
      })
      
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const filters = { name: 'test' }

      // Act
      await repository.findByTenant(mockTenantId, filters)

      // Assert
      expect(mockQuery.ilike).toHaveBeenCalledWith('name', '%test%')
    })

    it('should apply pagination with range', async () => {
      // Arrange
      const mockQuery = createMockQuery({
        data: [],
        error: null
      })
      
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const filters = { limit: 10, offset: 20 }

      // Act
      await repository.findByTenant(mockTenantId, filters)

      // Assert
      expect(mockQuery.range).toHaveBeenCalledWith(20, 29)
    })
  })

  describe('save', () => {
    it('should create new configuration', async () => {
      // Arrange
      const configuration = new ConfigurationType(
        mockConfigurationId,
        'Test Configuration',
        'Test Description',
        'test-icon',
        '#FF0000',
        true,
        1,
        mockTenantId,
        new Date(),
        new Date()
      )

      const mockData = {
        id: mockConfigurationId.getValue(),
        name: 'Test Configuration',
        description: 'Test Description',
        icon: 'test-icon',
        color: '#FF0000',
        is_active: true,
        sort_order: 1,
        tenant_id: mockTenantId.getValue(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const mockQuery = createMockQuery({
        data: mockData,
        error: null
      })
      
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      // Act
      const result = await repository.save(configuration)

      // Assert
      expect(result).toBeDefined()
      expect(result.name).toBe('Test Configuration')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('configuration_types')
      expect(mockQuery.upsert).toHaveBeenCalled()
      expect(mockQuery.select).toHaveBeenCalled()
    })

    it('should throw error when database error occurs', async () => {
      // Arrange
      const configuration = new ConfigurationType(
        mockConfigurationId,
        'Test Configuration',
        'Test Description',
        'test-icon',
        '#FF0000',
        true,
        1,
        mockTenantId,
        new Date(),
        new Date()
      )

      const mockQuery = createMockQuery({
        data: null,
        error: { code: 'PGRST001', message: 'Database error' }
      })
      
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      // Act & Assert
      await expect(repository.save(configuration)).rejects.toThrow('Database error: Database error')
    })
  })

  describe('delete', () => {
    it('should delete configuration successfully', async () => {
      // Arrange
      const mockQuery = createMockQuery({
        error: null
      })
      
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      // Act
      await repository.delete(mockConfigurationId, mockTenantId)

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('configuration_types')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', mockConfigurationId.getValue())
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', mockTenantId.getValue())
    })

    it('should throw error when database error occurs', async () => {
      // Arrange
      const mockQuery = createMockQuery({
        error: { code: 'PGRST001', message: 'Database error' }
      })
      
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      // Act & Assert
      await expect(repository.delete(mockConfigurationId, mockTenantId)).rejects.toThrow('Database error: Database error')
    })
  })

  describe('exists', () => {
    it('should return true when configuration exists', async () => {
      // Arrange
      const mockQuery = createMockQuery({
        data: { id: mockConfigurationId.getValue() },
        error: null
      })
      
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      // Act
      const result = await repository.exists(mockConfigurationId, mockTenantId)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when configuration does not exist', async () => {
      // Arrange
      const mockQuery = createMockQuery({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' }
      })
      
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      // Act
      const result = await repository.exists(mockConfigurationId, mockTenantId)

      // Assert
      expect(result).toBe(false)
    })
  })
})