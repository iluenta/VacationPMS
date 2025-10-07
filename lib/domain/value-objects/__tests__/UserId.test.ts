import { UserId } from '../UserId'

describe('UserId', () => {
  describe('constructor', () => {
    it('should create a valid UserId', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      const userId = new UserId(validUuid)
      
      expect(userId.getValue()).toBe(validUuid)
    })

    it('should throw error for empty value', () => {
      expect(() => new UserId('')).toThrow('UserId cannot be empty')
      expect(() => new UserId('   ')).toThrow('UserId cannot be empty')
    })

    it('should throw error for invalid UUID format', () => {
      expect(() => new UserId('invalid-uuid')).toThrow('UserId must be a valid UUID')
      expect(() => new UserId('123')).toThrow('UserId must be a valid UUID')
    })

    it('should trim whitespace', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      const userId = new UserId(validUuid)
      
      expect(userId.getValue()).toBe(validUuid)
    })
  })

  describe('equals', () => {
    it('should return true for equal UserIds', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000'
      const userId1 = new UserId(uuid)
      const userId2 = new UserId(uuid)
      
      expect(userId1.equals(userId2)).toBe(true)
    })

    it('should return false for different UserIds', () => {
      const userId1 = new UserId('123e4567-e89b-12d3-a456-426614174000')
      const userId2 = new UserId('987fcdeb-51a2-43d1-b789-123456789abc')
      
      expect(userId1.equals(userId2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the UUID string', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000'
      const userId = new UserId(uuid)
      
      expect(userId.toString()).toBe(uuid)
    })
  })

  describe('fromString', () => {
    it('should create UserId from string', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000'
      const userId = UserId.fromString(uuid)
      
      expect(userId.getValue()).toBe(uuid)
    })
  })

  describe('isValid', () => {
    it('should return true for valid UUID', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      expect(UserId.isValid(validUuid)).toBe(true)
    })

    it('should return false for invalid UUID', () => {
      expect(UserId.isValid('invalid')).toBe(false)
      expect(UserId.isValid('')).toBe(false)
      expect(UserId.isValid('123')).toBe(false)
    })
  })
})
