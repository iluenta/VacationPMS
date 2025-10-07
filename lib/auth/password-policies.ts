import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'
import { securityLogger } from '@/lib/logging/edge-logger'

// ============================================================================
// CONFIGURACIÓN DE POLÍTICAS
// ============================================================================

export interface PasswordPolicy {
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventCommonPasswords: boolean
  preventUserInfo: boolean
  maxAge: number // días
  historyCount: number // número de contraseñas anteriores a recordar
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true,
  maxAge: 90, // 90 días
  historyCount: 5 // recordar 5 contraseñas anteriores
}

// Lista de contraseñas comunes (top 100)
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'dragon', 'master', 'hello', 'freedom', 'whatever',
  'qazwsx', 'trustno1', 'jordan23', 'harley', 'ranger', 'jordan',
  'hunter', 'buster', 'soccer', 'hockey', 'killer', 'george',
  'sexy', 'andrew', 'charlie', 'superman', 'asshole', 'fuckyou',
  'dallas', 'jessica', 'panties', 'pepper', '1234', '696969',
  'killer', 'trustno1', 'jordan23', 'jordan', 'jennifer', 'zxcvbnm',
  'asdfgh', 'hunter', 'buster', 'soccer', 'hockey', 'killer',
  'george', 'sexy', 'andrew', 'charlie', 'superman', 'asshole',
  'fuckyou', 'dallas', 'jessica', 'panties', 'pepper', '1234',
  '696969', 'killer', 'trustno1', 'jordan23', 'jordan', 'jennifer',
  'zxcvbnm', 'asdfgh', 'hunter', 'buster', 'soccer', 'hockey',
  'killer', 'george', 'sexy', 'andrew', 'charlie', 'superman',
  'asshole', 'fuckyou', 'dallas', 'jessica', 'panties', 'pepper',
  '1234', '696969', 'killer', 'trustno1', 'jordan23', 'jordan',
  'jennifer', 'zxcvbnm', 'asdfgh', 'hunter', 'buster', 'soccer'
]

// ============================================================================
// VALIDACIÓN DE CONTRASEÑAS
// ============================================================================

export class PasswordPolicyManager {
  /**
   * Validar contraseña contra políticas
   */
  static validatePassword(
    password: string, 
    userInfo?: { email?: string; name?: string },
    policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
  ): { isValid: boolean; errors: string[]; score: number } {
    const errors: string[] = []
    let score = 0

    // Longitud mínima
    if (password.length < policy.minLength) {
      errors.push(`La contraseña debe tener al menos ${policy.minLength} caracteres`)
    } else {
      score += 20
    }

    // Longitud máxima
    if (password.length > policy.maxLength) {
      errors.push(`La contraseña no puede exceder ${policy.maxLength} caracteres`)
    }

    // Mayúsculas
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula')
    } else if (policy.requireUppercase) {
      score += 15
    }

    // Minúsculas
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula')
    } else if (policy.requireLowercase) {
      score += 15
    }

    // Números
    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('La contraseña debe contener al menos un número')
    } else if (policy.requireNumbers) {
      score += 15
    }

    // Caracteres especiales
    if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial')
    } else if (policy.requireSpecialChars) {
      score += 15
    }

    // Contraseñas comunes
    if (policy.preventCommonPasswords && COMMON_PASSWORDS.includes(password.toLowerCase())) {
      errors.push('La contraseña es muy común y fácil de adivinar')
    } else if (policy.preventCommonPasswords) {
      score += 10
    }

    // Información del usuario
    if (policy.preventUserInfo && userInfo) {
      const userInfoLower = [
        userInfo.email?.toLowerCase(),
        userInfo.name?.toLowerCase()
      ].filter(Boolean)

      const passwordLower = password.toLowerCase()
      
      for (const info of userInfoLower) {
        if (info && passwordLower.includes(info)) {
          errors.push('La contraseña no puede contener información personal')
          break
        }
      }
      
      if (!errors.some(e => e.includes('información personal'))) {
        score += 10
      }
    }

    // Patrones comunes
    if (this.hasCommonPatterns(password)) {
      errors.push('La contraseña contiene patrones comunes (ej: 123, abc, qwerty)')
      score -= 10
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.max(0, Math.min(100, score))
    }
  }

  /**
   * Verificar si la contraseña ha sido usada anteriormente
   */
  static async isPasswordInHistory(userId: string, newPassword: string): Promise<boolean> {
    const supabase = await createClient()
    
    const { data: history, error } = await supabase
      .from('password_history')
      .select('password_hash')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(DEFAULT_PASSWORD_POLICY.historyCount)

    if (error || !history) {
      return false
    }

    // Verificar cada contraseña anterior
    for (const record of history) {
      const isMatch = await bcrypt.compare(newPassword, record.password_hash)
      if (isMatch) {
        return true
      }
    }

    return false
  }

  /**
   * Verificar si la contraseña ha expirado
   */
  static async isPasswordExpired(userId: string): Promise<boolean> {
    const supabase = await createClient()
    
    const { data: user, error } = await supabase
      .from('users')
      .select('password_changed_at')
      .eq('id', userId)
      .single()

    if (error || !user || !user.password_changed_at) {
      return true // Si no hay fecha, considerar expirada
    }

    const daysSinceChange = (Date.now() - new Date(user.password_changed_at).getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceChange > DEFAULT_PASSWORD_POLICY.maxAge
  }

  /**
   * Cambiar contraseña con validación
   */
  static async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string,
    userInfo?: { email?: string; name?: string }
  ): Promise<{ success: boolean; errors: string[] }> {
    // Validar nueva contraseña
    const validation = this.validatePassword(newPassword, userInfo)
    if (!validation.isValid) {
      return { success: false, errors: validation.errors }
    }

    // Verificar contraseña actual
    const supabase = await createClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return { success: false, errors: ['Usuario no encontrado'] }
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isCurrentPasswordValid) {
      return { success: false, errors: ['Contraseña actual incorrecta'] }
    }

    // Verificar que no sea la misma contraseña
    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash)
    if (isSamePassword) {
      return { success: false, errors: ['La nueva contraseña debe ser diferente a la actual'] }
    }

    // Verificar historial
    const isInHistory = await this.isPasswordInHistory(userId, newPassword)
    if (isInHistory) {
      return { success: false, errors: ['La contraseña ha sido usada recientemente'] }
    }

    // Hashear nueva contraseña
    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    // Actualizar contraseña
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: newPasswordHash,
        password_changed_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      return { success: false, errors: ['Error actualizando contraseña'] }
    }

    // Guardar en historial
    await this.addToPasswordHistory(userId, newPasswordHash)

    // Logear evento de seguridad
    securityLogger.authAttempt({
      userId,
      ip: 'system',
      userAgent: 'system',
      success: true,
      reason: 'Password changed successfully'
    })

    return { success: true, errors: [] }
  }

  /**
   * Forzar cambio de contraseña
   */
  static async forcePasswordChange(userId: string): Promise<void> {
    const supabase = await createClient()
    
    await supabase
      .from('users')
      .update({ 
        password_change_required: true,
        password_change_required_at: new Date().toISOString()
      })
      .eq('id', userId)

    // Logear evento de seguridad
    securityLogger.authAttempt({
      userId,
      ip: 'system',
      userAgent: 'system',
      success: true,
      reason: 'Password change forced'
    })
  }

  /**
   * Obtener fortaleza de contraseña
   */
  static getPasswordStrength(password: string): {
    score: number
    level: 'Muy Débil' | 'Débil' | 'Regular' | 'Fuerte' | 'Muy Fuerte'
    feedback: string[]
  } {
    const validation = this.validatePassword(password)
    const feedback: string[] = []

    if (validation.score < 30) {
      feedback.push('Agrega más caracteres y variedad')
    } else if (validation.score < 50) {
      feedback.push('Considera usar mayúsculas, números y símbolos')
    } else if (validation.score < 70) {
      feedback.push('Buena contraseña, pero podrías hacerla más larga')
    } else if (validation.score < 90) {
      feedback.push('Excelente contraseña')
    } else {
      feedback.push('Contraseña muy segura')
    }

    let level: 'Muy Débil' | 'Débil' | 'Regular' | 'Fuerte' | 'Muy Fuerte'
    if (validation.score < 20) level = 'Muy Débil'
    else if (validation.score < 40) level = 'Débil'
    else if (validation.score < 60) level = 'Regular'
    else if (validation.score < 80) level = 'Fuerte'
    else level = 'Muy Fuerte'

    return {
      score: validation.score,
      level,
      feedback
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  private static hasCommonPatterns(password: string): boolean {
    const patterns = [
      /123/g,
      /abc/g,
      /qwerty/g,
      /asdf/g,
      /password/g,
      /admin/g,
      /(.)\1{2,}/g, // caracteres repetidos
      /(012|123|234|345|456|567|678|789|890)/g, // secuencias numéricas
      /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/g // secuencias alfabéticas
    ]

    return patterns.some(pattern => pattern.test(password.toLowerCase()))
  }

  private static async addToPasswordHistory(userId: string, passwordHash: string): Promise<void> {
    const supabase = await createClient()
    
    // Insertar nueva contraseña en historial
    await supabase
      .from('password_history')
      .insert({
        user_id: userId,
        password_hash: passwordHash,
        created_at: new Date().toISOString()
      })

    // Limpiar historial antiguo
    const { data: history } = await supabase
      .from('password_history')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(DEFAULT_PASSWORD_POLICY.historyCount + 1)

    if (history && history.length > DEFAULT_PASSWORD_POLICY.historyCount) {
      const idsToDelete = history.slice(DEFAULT_PASSWORD_POLICY.historyCount).map(h => h.id)
      await supabase
        .from('password_history')
        .delete()
        .in('id', idsToDelete)
    }
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Generar contraseña segura
 */
export function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = uppercase + lowercase + numbers + symbols
  let password = ''
  
  // Asegurar al menos un carácter de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Completar con caracteres aleatorios
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Mezclar la contraseña
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Verificar si una contraseña necesita cambio
 */
export async function needsPasswordChange(userId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: user, error } = await supabase
    .from('users')
    .select('password_change_required, password_changed_at')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return true
  }

  // Verificar si se requiere cambio forzado
  if (user.password_change_required) {
    return true
  }

  // Verificar si ha expirado
  return await PasswordPolicyManager.isPasswordExpired(userId)
}
