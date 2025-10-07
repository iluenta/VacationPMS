import { TenantId } from '../TenantId'

describe('TenantId', () => {
  describe('constructor', () => {
    it('should create a valid TenantId', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      const tenantId = new TenantId(validUuid)
      
      expect(tenantId.getValue()).toBe(validUuid)
    })

    it('should throw error for empty value', () => {
      expect(() => new TenantId('')).toThrow('TenantId cannot be empty')
      expect(() => new TenantId('   ')).toThrow('TenantId cannot be empty')
    })

    it('should throw error for invalid UUID format', () => {
      expect(() => new TenantId('invalid-uuid')).toThrow('TenantId must be a valid UUID')
      expect(() => new TenantId('123')).toThrow('TenantId must be a valid UUID')
    })

    it('should trim whitespace', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      const tenantId = new TenantId(validUuid)
      
      expect(tenantId.getValue()).toBe(validUuid)
    })
  })

  describe('equals', () => {
    it('should return true for equal TenantIds', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000'
      const tenantId1 = new TenantId(uuid)
      const tenantId2 = new TenantId(uuid)
      
      expect(tenantId1.equals(tenantId2)).toBe(true)
    })

    it('should return false for different TenantIds', () => {
      const tenantId1 = new TenantId('123e4567-e89b-12d3-a456-426614174000')
      const tenantId2 = new TenantId('987fcdeb-51a2-43d1-b789-123456789abc')
      
      expect(tenantId1.equals(tenantId2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the UUID string', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000'
      const tenantId = new TenantId(uuid)
      
      expect(tenantId.toString()).toBe(uuid)
    })
  })

  describe('fromString', () => {
    it('should create TenantId from string', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000'
      const tenantId = TenantId.fromString(uuid)
      
      expect(tenantId.getValue()).toBe(uuid)
    })
  })

  describe('isValid', () => {
    it('should return true for valid UUID', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      expect(TenantId.isValid(validUuid)).toBe(true)
    })

    it('should return false for invalid UUID', () => {
      expect(TenantId.isValid('invalid')).toBe(false)
      expect(TenantId.isValid('')).toBe(false)
      expect(TenantId.isValid('123')).toBe(false)
    })
  })
})
