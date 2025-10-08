import { PersonId } from '../PersonId'

describe('PersonId', () => {
  describe('constructor', () => {
    it('should create a valid PersonId', () => {
      // Arrange
      const uuid = '453129fb-950e-4934-a1ff-2cb83ca697cd'

      // Act
      const personId = new PersonId(uuid)

      // Assert
      expect(personId.getValue()).toBe(uuid)
    })

    it('should throw error for empty value', () => {
      // Act & Assert
      expect(() => new PersonId('')).toThrow('PersonId cannot be empty')
    })

    it('should throw error for invalid UUID format', () => {
      // Act & Assert
      expect(() => new PersonId('invalid-uuid')).toThrow('PersonId must be a valid UUID')
    })

    it('should accept UUID v4 format', () => {
      // Arrange
      const uuid = '123e4567-e89b-42d3-a456-426614174000'

      // Act
      const personId = new PersonId(uuid)

      // Assert
      expect(personId.getValue()).toBe(uuid)
    })
  })

  describe('equals', () => {
    it('should return true for equal PersonIds', () => {
      // Arrange
      const uuid = '453129fb-950e-4934-a1ff-2cb83ca697cd'
      const personId1 = new PersonId(uuid)
      const personId2 = new PersonId(uuid)

      // Act
      const result = personId1.equals(personId2)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false for different PersonIds', () => {
      // Arrange
      const personId1 = new PersonId('453129fb-950e-4934-a1ff-2cb83ca697cd')
      const personId2 = new PersonId('553129fb-950e-4934-a1ff-2cb83ca697cd')

      // Act
      const result = personId1.equals(personId2)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the UUID string', () => {
      // Arrange
      const uuid = '453129fb-950e-4934-a1ff-2cb83ca697cd'
      const personId = new PersonId(uuid)

      // Act
      const result = personId.toString()

      // Assert
      expect(result).toBe(uuid)
    })
  })

  describe('fromString', () => {
    it('should create PersonId from string', () => {
      // Arrange
      const uuid = '453129fb-950e-4934-a1ff-2cb83ca697cd'

      // Act
      const personId = PersonId.fromString(uuid)

      // Assert
      expect(personId.getValue()).toBe(uuid)
    })
  })

  describe('isValid', () => {
    it('should return true for valid UUID', () => {
      // Arrange
      const uuid = '453129fb-950e-4934-a1ff-2cb83ca697cd'

      // Act
      const result = PersonId.isValid(uuid)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false for invalid UUID', () => {
      // Act & Assert
      expect(PersonId.isValid('invalid-uuid')).toBe(false)
      expect(PersonId.isValid('')).toBe(false)
    })
  })
})
