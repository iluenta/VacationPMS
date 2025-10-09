import { useState, useEffect, useCallback } from 'react'
import { UserSettingsDto, UpdateUserSettingsDto } from '../application/dto/UserSettingsDto'

interface UseUserSettingsReturn {
  settings: UserSettingsDto | null
  loading: boolean
  error: string | null
  updateSettings: (data: UpdateUserSettingsDto) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<boolean>
  refreshSettings: () => Promise<void>
}

export function useUserSettings(): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettingsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar configuraciones del usuario
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('📡 [FRONTEND] Loading user settings...')

      const response = await fetch('/api/user-settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('📡 [FRONTEND] Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to load user settings')
      }

      const data = await response.json()
      console.log('📡 [FRONTEND] Response data:', data)

      if (data.success && data.data) {
        setSettings(data.data)
        console.log('✅ [FRONTEND] User settings loaded successfully')
      } else {
        throw new Error(data.message || 'Failed to load user settings')
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error loading user settings:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizar configuraciones
  const updateSettings = useCallback(async (data: UpdateUserSettingsDto): Promise<boolean> => {
    try {
      setError(null)

      console.log('📡 [FRONTEND] Updating user settings...', data)

      const response = await fetch('/api/user-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      console.log('📡 [FRONTEND] Update response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update user settings')
      }

      const result = await response.json()
      console.log('📡 [FRONTEND] Update response data:', result)

      if (result.success && result.data) {
        setSettings(result.data)
        console.log('✅ [FRONTEND] User settings updated successfully')
        return true
      } else {
        throw new Error(result.message || 'Failed to update user settings')
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error updating user settings:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }, [])

  // Cambiar contraseña
  const changePassword = useCallback(async (
    currentPassword: string, 
    newPassword: string, 
    confirmPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)

      console.log('📡 [FRONTEND] Changing password...')

      const response = await fetch('/api/user-settings/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      console.log('📡 [FRONTEND] Password change response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.message || 'Failed to change password'
        
        // Diferenciar entre errores de validación y errores del sistema
        const isValidationError = errorMessage.includes('La contraseña') || 
                                  errorMessage.includes('Password') ||
                                  errorMessage.includes('no coinciden')
        
        if (isValidationError) {
          // Errores de validación - loguear como info
          console.log('⚠️ [FRONTEND] Password validation failed:', errorMessage)
        } else {
          // Errores del sistema - loguear como error
          console.error('❌ [FRONTEND] System error changing password:', errorMessage)
        }
        
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      const result = await response.json()
      console.log('📡 [FRONTEND] Password change response data:', result)

      if (result.success) {
        console.log('✅ [FRONTEND] Password changed successfully')
        return { success: true }
      } else {
        const errorMessage = result.message || 'Failed to change password'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Errores del sistema - loguear como error
      console.error('❌ [FRONTEND] System error changing password:', error)
      
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [])

  // Refrescar configuraciones
  const refreshSettings = useCallback(async () => {
    await loadSettings()
  }, [loadSettings])

  // Cargar configuraciones al montar el componente
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return {
    settings,
    loading,
    error,
    updateSettings,
    changePassword,
    refreshSettings,
  }
}
