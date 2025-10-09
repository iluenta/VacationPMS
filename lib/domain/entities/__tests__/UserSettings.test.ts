import { UserSettings } from '../UserSettings'
import { UserSettingsId } from '../../value-objects/UserSettingsId'
import { UserId } from '../../value-objects/UserId'

describe('UserSettings', () => {
  const mockUserId = new UserId('123e4567-e89b-12d3-a456-426614174000')
  const mockUserSettingsId = new UserSettingsId('987fcdeb-51a2-43d7-8f9e-123456789abc')
  const mockDate = new Date('2023-01-01T00:00:00Z')

  const validProps = {
    id: mockUserSettingsId,
    userId: mockUserId,
    language: 'es',
    timezone: 'UTC',
    dateFormat: 'DD/MM/YYYY',
    dashboardLayout: 'default',
    itemsPerPage: 50,
    notificationsEmail: true,
    notificationsPush: true,
    notificationsSms: false,
    autoLogoutMinutes: 30,
    sessionTimeout: true,
    loginNotifications: true,
    twoFactorEnabled: false,
    passwordExpiryDays: 90,
    passwordHistoryCount: 5,
    profileVisibility: 'private',
    dataSharing: false,
    createdAt: mockDate,
    updatedAt: mockDate
  }

  describe('constructor', () => {
    it('should create UserSettings with valid props', () => {
      const userSettings = new UserSettings(validProps)
      
      expect(userSettings.getId()).toEqual(mockUserSettingsId)
      expect(userSettings.getUserId()).toEqual(mockUserId)
      expect(userSettings.getLanguage()).toBe('es')
      expect(userSettings.getTimezone()).toBe('UTC')
    })

    it('should throw error for invalid language', () => {
      const invalidProps = { ...validProps, language: 'invalid' }
      
      expect(() => new UserSettings(invalidProps)).toThrow('Language must be either "es" or "en"')
    })

    it('should throw error for invalid date format', () => {
      const invalidProps = { ...validProps, dateFormat: 'invalid' }
      
      expect(() => new UserSettings(invalidProps)).toThrow('Date format must be one of: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD')
    })

    it('should throw error for invalid dashboard layout', () => {
      const invalidProps = { ...validProps, dashboardLayout: 'invalid' }
      
      expect(() => new UserSettings(invalidProps)).toThrow('Dashboard layout must be one of: default, compact, expanded')
    })

    it('should throw error for invalid items per page', () => {
      const invalidProps = { ...validProps, itemsPerPage: 5 }
      
      expect(() => new UserSettings(invalidProps)).toThrow('Items per page must be between 10 and 100')
    })

    it('should throw error for invalid auto logout minutes', () => {
      const invalidProps = { ...validProps, autoLogoutMinutes: 2 }
      
      expect(() => new UserSettings(invalidProps)).toThrow('Auto logout minutes must be between 5 and 480')
    })

    it('should throw error for invalid password expiry days', () => {
      const invalidProps = { ...validProps, passwordExpiryDays: 20 }
      
      expect(() => new UserSettings(invalidProps)).toThrow('Password expiry days must be between 30 and 365')
    })

    it('should throw error for invalid password history count', () => {
      const invalidProps = { ...validProps, passwordHistoryCount: 2 }
      
      expect(() => new UserSettings(invalidProps)).toThrow('Password history count must be between 3 and 10')
    })

    it('should throw error for invalid profile visibility', () => {
      const invalidProps = { ...validProps, profileVisibility: 'invalid' }
      
      expect(() => new UserSettings(invalidProps)).toThrow('Profile visibility must be one of: public, private, tenant_only')
    })
  })

  describe('updateLanguage', () => {
    it('should update language and return new instance', () => {
      const userSettings = new UserSettings(validProps)
      const updated = userSettings.updateLanguage('en')
      
      expect(updated.getLanguage()).toBe('en')
      expect(updated.getUpdatedAt()).not.toEqual(userSettings.getUpdatedAt())
      expect(updated.getId()).toEqual(userSettings.getId())
    })
  })

  describe('updateTimezone', () => {
    it('should update timezone and return new instance', () => {
      const userSettings = new UserSettings(validProps)
      const updated = userSettings.updateTimezone('America/Mexico_City')
      
      expect(updated.getTimezone()).toBe('America/Mexico_City')
      expect(updated.getUpdatedAt()).not.toEqual(userSettings.getUpdatedAt())
    })
  })

  describe('updateNotificationSettings', () => {
    it('should update notification settings and return new instance', () => {
      const userSettings = new UserSettings(validProps)
      const updated = userSettings.updateNotificationSettings({
        email: false,
        push: false,
        sms: true
      })
      
      expect(updated.getNotificationsEmail()).toBe(false)
      expect(updated.getNotificationsPush()).toBe(false)
      expect(updated.getNotificationsSms()).toBe(true)
      expect(updated.getUpdatedAt()).not.toEqual(userSettings.getUpdatedAt())
    })

    it('should only update provided settings', () => {
      const userSettings = new UserSettings(validProps)
      const updated = userSettings.updateNotificationSettings({
        email: false
      })
      
      expect(updated.getNotificationsEmail()).toBe(false)
      expect(updated.getNotificationsPush()).toBe(userSettings.getNotificationsPush())
      expect(updated.getNotificationsSms()).toBe(userSettings.getNotificationsSms())
    })
  })

  describe('updateSecuritySettings', () => {
    it('should update security settings and return new instance', () => {
      const userSettings = new UserSettings(validProps)
      const updated = userSettings.updateSecuritySettings({
        twoFactorEnabled: true,
        autoLogoutMinutes: 60
      })
      
      expect(updated.getTwoFactorEnabled()).toBe(true)
      expect(updated.getAutoLogoutMinutes()).toBe(60)
      expect(updated.getUpdatedAt()).not.toEqual(userSettings.getUpdatedAt())
    })
  })

  describe('hasNotificationsEnabled', () => {
    it('should return true if any notification is enabled', () => {
      const userSettings = new UserSettings(validProps)
      
      expect(userSettings.hasNotificationsEnabled()).toBe(true)
    })

    it('should return false if no notifications are enabled', () => {
      const props = { ...validProps, notificationsEmail: false, notificationsPush: false, notificationsSms: false }
      const userSettings = new UserSettings(props)
      
      expect(userSettings.hasNotificationsEnabled()).toBe(false)
    })
  })

  describe('hasEnhancedSecurity', () => {
    it('should return true if all security features are enabled', () => {
      const props = { ...validProps, twoFactorEnabled: true, sessionTimeout: true, loginNotifications: true }
      const userSettings = new UserSettings(props)
      
      expect(userSettings.hasEnhancedSecurity()).toBe(true)
    })

    it('should return false if any security feature is disabled', () => {
      const userSettings = new UserSettings(validProps)
      
      expect(userSettings.hasEnhancedSecurity()).toBe(false)
    })
  })

  describe('createDefault', () => {
    it('should create default user settings', () => {
      const userSettings = UserSettings.createDefault(mockUserId)
      
      expect(userSettings.getUserId()).toEqual(mockUserId)
      expect(userSettings.getLanguage()).toBe('es')
      expect(userSettings.getTimezone()).toBe('UTC')
      expect(userSettings.getDateFormat()).toBe('DD/MM/YYYY')
      expect(userSettings.getDashboardLayout()).toBe('default')
      expect(userSettings.getItemsPerPage()).toBe(50)
      expect(userSettings.getNotificationsEmail()).toBe(true)
      expect(userSettings.getNotificationsPush()).toBe(true)
      expect(userSettings.getNotificationsSms()).toBe(false)
      expect(userSettings.getAutoLogoutMinutes()).toBe(30)
      expect(userSettings.getSessionTimeout()).toBe(true)
      expect(userSettings.getLoginNotifications()).toBe(true)
      expect(userSettings.getTwoFactorEnabled()).toBe(false)
      expect(userSettings.getPasswordExpiryDays()).toBe(90)
      expect(userSettings.getPasswordHistoryCount()).toBe(5)
      expect(userSettings.getProfileVisibility()).toBe('private')
      expect(userSettings.getDataSharing()).toBe(false)
    })
  })

  describe('toPlainObject', () => {
    it('should return plain object representation', () => {
      const userSettings = new UserSettings(validProps)
      const plainObject = userSettings.toPlainObject()
      
      expect(plainObject.id).toBe(mockUserSettingsId.getValue())
      expect(plainObject.user_id).toBe(mockUserId.getValue())
      expect(plainObject.language).toBe('es')
      expect(plainObject.timezone).toBe('UTC')
      expect(plainObject.created_at).toBe(mockDate.toISOString())
      expect(plainObject.updated_at).toBe(mockDate.toISOString())
    })
  })
})
