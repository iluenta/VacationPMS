import { ConfigurationId } from '../ConfigurationId'

describe('ConfigurationId', () => {
  describe('constructor', () => {
    it('should create a valid ConfigurationId', () => {
      // Arrange
      const uuid = '223e4567-e89b-12d3-a456-426614174000'

      // Act
      const configId = new ConfigurationId(uuid)

      // Assert
      expect(configId.getValue()).toBe(uuid)
    })

    it('should throw error for empty value', () => {
      // Act & Assert
      expect(() => new ConfigurationId('')).toThrow('ConfigurationId cannot be empty')
    })

    it('should throw error for invalid UUID format', () => {
      // Act & Assert
      expect(() => new ConfigurationId('invalid-uuid')).toThrow('ConfigurationId must be a valid UUID')
    })

    it('should accept UUID v4 format', () => {
      // Arrange
      const uuid = '123e4567-e89b-42d3-a456-426614174000'

      // Act
      const configId = new ConfigurationId(uuid)

      // Assert
      expect(configId.getValue()).toBe(uuid)
    })
  })

  describe('equals', () => {
    it('should return true for equal ConfigurationIds', () => {
      // Arrange
      const uuid = '223e4567-e89b-12d3-a456-426614174000'
      const configId1 = new ConfigurationId(uuid)
      const configId2 = new ConfigurationId(uuid)

      // Act
      const result = configId1.equals(configId2)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false for different ConfigurationIds', () => {
      // Arrange
      const configId1 = new ConfigurationId('223e4567-e89b-12d3-a456-426614174000')
      const configId2 = new ConfigurationId('323e4567-e89b-12d3-a456-426614174000')

      // Act
      const result = configId1.equals(configId2)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the UUID string', () => {
      // Arrange
      const uuid = '223e4567-e89b-12d3-a456-426614174000'
      const configId = new ConfigurationId(uuid)

      // Act
      const result = configId.toString()

      // Assert
      expect(result).toBe(uuid)
    })
  })

  describe('fromString', () => {
    it('should create ConfigurationId from string', () => {
      // Arrange
      const uuid = '223e4567-e89b-12d3-a456-426614174000'

      // Act
      const configId = ConfigurationId.fromString(uuid)

      // Assert
      expect(configId.getValue()).toBe(uuid)
    })
  })

  describe('isValid', () => {
    it('should return true for valid UUID', () => {
      // Arrange
      const uuid = '223e4567-e89b-12d3-a456-426614174000'

      // Act
      const result = ConfigurationId.isValid(uuid)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false for invalid UUID', () => {
      // Act & Assert
      expect(ConfigurationId.isValid('invalid-uuid')).toBe(false)
      expect(ConfigurationId.isValid('')).toBe(false)
    })
  })
})

