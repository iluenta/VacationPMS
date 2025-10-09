import { GetUserSettingsUseCase } from '../GetUserSettingsUseCase'
import { IUserSettingsRepository } from '../../../domain/repositories/IUserSettingsRepository'
import { UserSettings } from '../../../domain/entities/UserSettings'
import { UserId } from '../../../domain/value-objects/UserId'

describe('GetUserSettingsUseCase', () => {
  let mockUserSettingsRepository: jest.Mocked<IUserSettingsRepository>
  let getUserSettingsUseCase: GetUserSettingsUseCase

  beforeEach(() => {
    mockUserSettingsRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn()
    } as jest.Mocked<IUserSettingsRepository>

    getUserSettingsUseCase = new GetUserSettingsUseCase(mockUserSettingsRepository)
  })

  describe('execute', () => {
    it('should return user settings when they exist', async () => {
      const userId = '123e4567-e89b-42d3-a456-426614174000'
      const mockUserSettings = UserSettings.create({ userId: new UserId(userId) })
      
      mockUserSettingsRepository.findByUserId.mockResolvedValue(mockUserSettings)

      const result = await getUserSettingsUseCase.execute(userId)

      expect(result).toBeDefined()
      expect(result?.userId).toBe(userId)
      expect(result?.language).toBe('es')
      expect(mockUserSettingsRepository.findByUserId).toHaveBeenCalled()
    })

    it('should create default settings when they do not exist', async () => {
      const userId = '123e4567-e89b-42d3-a456-426614174000'
      
      mockUserSettingsRepository.findByUserId.mockResolvedValue(null)
      mockUserSettingsRepository.save.mockResolvedValue(undefined)

      const result = await getUserSettingsUseCase.execute(userId)

      expect(result).toBeDefined()
      expect(result?.userId).toBe(userId)
      expect(mockUserSettingsRepository.findByUserId).toHaveBeenCalled()
      expect(mockUserSettingsRepository.save).toHaveBeenCalled()
    })

    it('should throw error when repository throws error', async () => {
      const userId = '123e4567-e89b-42d3-a456-426614174000'
      const errorMessage = 'Database error'
      
      mockUserSettingsRepository.findByUserId.mockRejectedValue(new Error(errorMessage))

      await expect(getUserSettingsUseCase.execute(userId)).rejects.toThrow(errorMessage)
    })
  })
})
