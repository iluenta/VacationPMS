import { User } from '../User'
import { UserId } from '../../value-objects/UserId'
import { TenantId } from '../../value-objects/TenantId'

describe('User', () => {
  const validUserId = UserId.fromString('123e4567-e89b-12d3-a456-426614174000')
  const validTenantId = TenantId.fromString('987fcdeb-51a2-43d1-b789-123456789abc')
  const now = new Date()

  describe('constructor', () => {
    it('should create a valid User', () => {
      const user = new User(
        validUserId,
        'test@example.com',
        'Test User',
        validTenantId,
        false,
        true,
        now,
        now
      )

      expect(user.id).toBe(validUserId)
      expect(user.email).toBe('test@example.com')
      expect(user.name).toBe('Test User')
      expect(user.tenantId).toBe(validTenantId)
      expect(user.isAdmin).toBe(false)
      expect(user.isActive).toBe(true)
    })

    it('should throw error for invalid email', () => {
      expect(() => new User(
        validUserId,
        'invalid-email',
        'Test User',
        validTenantId,
        false,
        true,
        now,
        now
      )).toThrow('User email must be valid')
    })

    it('should throw error for empty name', () => {
      expect(() => new User(
        validUserId,
        'test@example.com',
        '',
        validTenantId,
        false,
        true,
        now,
        now
      )).toThrow('User name cannot be empty')
    })

    it('should throw error for name too long', () => {
      const longName = 'a'.repeat(101)
      expect(() => new User(
        validUserId,
        'test@example.com',
        longName,
        validTenantId,
        false,
        true,
        now,
        now
      )).toThrow('User name cannot exceed 100 characters')
    })
  })

  describe('activate', () => {
    it('should activate an inactive user', () => {
      const user = new User(
        validUserId,
        'test@example.com',
        'Test User',
        validTenantId,
        false,
        false,
        now,
        now
      )

      const activatedUser = user.activate()
      expect(activatedUser.isActive).toBe(true)
      expect(activatedUser.updatedAt.getTime()).toBeGreaterThan(now.getTime())
    })

    it('should return same user if already active', () => {
      const user = new User(
        validUserId,
        'test@example.com',
        'Test User',
        validTenantId,
        false,
        true,
        now,
        now
      )

      const activatedUser = user.activate()
      expect(activatedUser).toBe(user)
    })
  })

  describe('deactivate', () => {
    it('should deactivate an active user', () => {
      const user = new User(
        validUserId,
        'test@example.com',
        'Test User',
        validTenantId,
        false,
        true,
        now,
        now
      )

      const deactivatedUser = user.deactivate()
      expect(deactivatedUser.isActive).toBe(false)
      expect(deactivatedUser.updatedAt.getTime()).toBeGreaterThan(now.getTime())
    })

    it('should return same user if already inactive', () => {
      const user = new User(
        validUserId,
        'test@example.com',
        'Test User',
        validTenantId,
        false,
        false,
        now,
        now
      )

      const deactivatedUser = user.deactivate()
      expect(deactivatedUser).toBe(user)
    })
  })

  describe('updateName', () => {
    it('should update user name', () => {
      const user = new User(
        validUserId,
        'test@example.com',
        'Old Name',
        validTenantId,
        false,
        true,
        now,
        now
      )

      const updatedUser = user.updateName('New Name')
      expect(updatedUser.name).toBe('New Name')
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(now.getTime())
    })

    it('should throw error for empty name', () => {
      const user = new User(
        validUserId,
        'test@example.com',
        'Test User',
        validTenantId,
        false,
        true,
        now,
        now
      )

      expect(() => user.updateName('')).toThrow('User name cannot be empty')
    })
  })

  describe('belongsToTenant', () => {
    it('should return true for same tenant', () => {
      const user = new User(
        validUserId,
        'test@example.com',
        'Test User',
        validTenantId,
        false,
        true,
        now,
        now
      )

      expect(user.belongsToTenant(validTenantId)).toBe(true)
    })

    it('should return false for different tenant', () => {
      const user = new User(
        validUserId,
        'test@example.com',
        'Test User',
        validTenantId,
        false,
        true,
        now,
        now
      )

      const otherTenantId = TenantId.fromString('11111111-2222-4333-8444-555555555555')
      expect(user.belongsToTenant(otherTenantId)).toBe(false)
    })
  })

  describe('toPlainObject', () => {
    it('should convert to plain object', () => {
      const user = new User(
        validUserId,
        'test@example.com',
        'Test User',
        validTenantId,
        false,
        true,
        now,
        now
      )

      const plainObject = user.toPlainObject()
      expect(plainObject).toEqual({
        id: validUserId.getValue(),
        email: 'test@example.com',
        name: 'Test User',
        tenantId: validTenantId.getValue(),
        isAdmin: false,
        isActive: true,
        createdAt: now,
        updatedAt: now
      })
    })
  })

  describe('fromPlainObject', () => {
    it('should create User from plain object', () => {
      const plainObject = {
        id: validUserId.getValue(),
        email: 'test@example.com',
        name: 'Test User',
        tenantId: validTenantId.getValue(),
        isAdmin: false,
        isActive: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }

      const user = User.fromPlainObject(plainObject)
      expect(user.id.getValue()).toBe(validUserId.getValue())
      expect(user.email).toBe('test@example.com')
      expect(user.name).toBe('Test User')
      expect(user.tenantId.getValue()).toBe(validTenantId.getValue())
      expect(user.isAdmin).toBe(false)
      expect(user.isActive).toBe(true)
    })
  })
})
