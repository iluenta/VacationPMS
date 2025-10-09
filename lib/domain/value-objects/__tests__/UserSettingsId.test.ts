import { UserSettingsId } from '../UserSettingsId'

describe('UserSettingsId', () => {
  describe('constructor', () => {
    it('should create a new UserSettingsId with a valid UUID', () => {
      const validUuid = '123e4567-e89b-42d3-a456-426614174000'
      const userSettingsId = new UserSettingsId(validUuid)
      
      expect(userSettingsId.getValue()).toBe(validUuid)
    })

    it('should generate a new UUID when no value is provided', () => {
      const userSettingsId = new UserSettingsId()
      const value = userSettingsId.getValue()
      
      expect(value).toBeDefined()
      expect(typeof value).toBe('string')
      expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it('should throw an error for invalid UUID format', () => {
      const invalidUuid = 'invalid-uuid'
      
      expect(() => new UserSettingsId(invalidUuid)).toThrow('UserSettingsId must be a valid UUID')
    })

    it('should throw an error for empty string', () => {
      expect(() => new UserSettingsId('')).toThrow('UserSettingsId must be a valid UUID')
    })
  })

  describe('getValue', () => {
    it('should return the UUID value', () => {
      const uuid = '123e4567-e89b-42d3-a456-426614174000'
      const userSettingsId = new UserSettingsId(uuid)
      
      expect(userSettingsId.getValue()).toBe(uuid)
    })
  })

  describe('equals', () => {
    it('should return true for equal UserSettingsIds', () => {
      const uuid = '123e4567-e89b-42d3-a456-426614174000'
      const userSettingsId1 = new UserSettingsId(uuid)
      const userSettingsId2 = new UserSettingsId(uuid)
      
      expect(userSettingsId1.equals(userSettingsId2)).toBe(true)
    })

    it('should return false for different UserSettingsIds', () => {
      const uuid1 = '123e4567-e89b-42d3-a456-426614174000'
      const uuid2 = '987fcdeb-51a2-43d7-8f9e-123456789abc'
      const userSettingsId1 = new UserSettingsId(uuid1)
      const userSettingsId2 = new UserSettingsId(uuid2)
      
      expect(userSettingsId1.equals(userSettingsId2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the UUID value as string', () => {
      const uuid = '123e4567-e89b-42d3-a456-426614174000'
      const userSettingsId = new UserSettingsId(uuid)
      
      expect(userSettingsId.toString()).toBe(uuid)
    })
  })

  describe('fromString', () => {
    it('should create UserSettingsId from string', () => {
      const uuid = '123e4567-e89b-42d3-a456-426614174000'
      const userSettingsId = UserSettingsId.fromString(uuid)
      
      expect(userSettingsId.getValue()).toBe(uuid)
    })

    it('should throw an error for invalid string', () => {
      expect(() => UserSettingsId.fromString('invalid')).toThrow('UserSettingsId must be a valid UUID')
    })
  })
})
