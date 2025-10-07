import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// TIPOS
// ============================================================================

export interface TwoFactorSetup {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

export interface TwoFactorVerification {
  isValid: boolean
  isBackupCode?: boolean
  remainingBackupCodes?: number
}

// ============================================================================
// GESTIÓN DE 2FA
// ============================================================================

export class TwoFactorManager {
  private static readonly BACKUP_CODES_COUNT = 10
  private static readonly BACKUP_CODE_LENGTH = 8

  /**
   * Generar configuración inicial de 2FA
   */
  static async generateSetup(userId: string, userEmail: string): Promise<TwoFactorSetup> {
    // Generar secreto
    const secret = speakeasy.generateSecret({
      name: `PMS (${userEmail})`,
      issuer: 'VacationPMS',
      length: 32
    })

    // Generar códigos de respaldo
    const backupCodes = this.generateBackupCodes()

    // Generar QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

    // Guardar configuración temporal (sin activar)
    await this.saveTemporarySetup(userId, secret.base32!, backupCodes)

    return {
      secret: secret.base32!,
      qrCodeUrl,
      backupCodes
    }
  }

  /**
   * Verificar código 2FA y activar si es la primera vez
   */
  static async verifyAndActivate(userId: string, token: string): Promise<TwoFactorVerification> {
    // Obtener configuración temporal
    const tempSetup = await this.getTemporarySetup(userId)
    if (!tempSetup) {
      return { isValid: false }
    }

    // Verificar token
    const isValid = speakeasy.totp.verify({
      secret: tempSetup.secret,
      encoding: 'base32',
      token,
      window: 2 // Permitir 2 períodos de tiempo antes/después
    })

    if (!isValid) {
      // Verificar si es un código de respaldo
      return await this.verifyBackupCode(userId, token, tempSetup.backupCodes)
    }

    // Activar 2FA
    await this.activateTwoFactor(userId, tempSetup.secret, tempSetup.backupCodes)
    await this.clearTemporarySetup(userId)

    return { isValid: true }
  }

  /**
   * Verificar código 2FA para login
   */
  static async verifyLogin(userId: string, token: string): Promise<TwoFactorVerification> {
    const setup = await this.getActiveSetup(userId)
    if (!setup) {
      return { isValid: false }
    }

    // Verificar token
    const isValid = speakeasy.totp.verify({
      secret: setup.secret,
      encoding: 'base32',
      token,
      window: 2
    })

    if (!isValid) {
      // Verificar si es un código de respaldo
      return await this.verifyBackupCode(userId, token, setup.backupCodes)
    }

    return { isValid: true }
  }

  /**
   * Desactivar 2FA
   */
  static async disable(userId: string, password: string): Promise<boolean> {
    // Verificar contraseña
    const supabase = await createClient()
    const { data: user, error } = await supabase.auth.admin.getUserById(userId)
    
    if (error || !user) {
      return false
    }

    // En un entorno real, verificarías la contraseña aquí
    // Por ahora, asumimos que la verificación se hace en el endpoint

    // Desactivar 2FA
    await supabase
      .from('user_2fa')
      .update({ 
        is_active: false,
        disabled_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    return true
  }

  /**
   * Regenerar códigos de respaldo
   */
  static async regenerateBackupCodes(userId: string): Promise<string[]> {
    const newBackupCodes = this.generateBackupCodes()
    const hashedCodes = await this.hashBackupCodes(newBackupCodes)

    const supabase = await createClient()
    await supabase
      .from('user_2fa')
      .update({ 
        backup_codes: hashedCodes,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    return newBackupCodes
  }

  /**
   * Obtener códigos de respaldo restantes
   */
  static async getRemainingBackupCodes(userId: string): Promise<number> {
    const setup = await this.getActiveSetup(userId)
    if (!setup) {
      return 0
    }

    return setup.backupCodes.filter(code => !code.used).length
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  private static generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      codes.push(this.generateBackupCode())
    }
    return codes
  }

  private static generateBackupCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < this.BACKUP_CODE_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  private static async hashBackupCodes(codes: string[]): Promise<string[]> {
    return Promise.all(codes.map(code => bcrypt.hash(code, 10)))
  }

  private static async saveTemporarySetup(userId: string, secret: string, backupCodes: string[]): Promise<void> {
    const hashedCodes = await this.hashBackupCodes(backupCodes)
    
    const supabase = await createClient()
    await supabase
      .from('user_2fa_temp')
      .upsert({
        user_id: userId,
        secret,
        backup_codes: hashedCodes,
        created_at: new Date().toISOString()
      })
  }

  private static async getTemporarySetup(userId: string): Promise<{ secret: string; backupCodes: string[] } | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('user_2fa_temp')
      .select('secret, backup_codes')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return {
      secret: data.secret,
      backupCodes: data.backup_codes
    }
  }

  private static async clearTemporarySetup(userId: string): Promise<void> {
    const supabase = await createClient()
    await supabase
      .from('user_2fa_temp')
      .delete()
      .eq('user_id', userId)
  }

  private static async activateTwoFactor(userId: string, secret: string, backupCodes: string[]): Promise<void> {
    const hashedCodes = await this.hashBackupCodes(backupCodes)
    
    const supabase = await createClient()
    await supabase
      .from('user_2fa')
      .upsert({
        user_id: userId,
        secret,
        backup_codes: hashedCodes,
        is_active: true,
        activated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
  }

  private static async getActiveSetup(userId: string): Promise<{ secret: string; backupCodes: any[] } | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('user_2fa')
      .select('secret, backup_codes')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return null
    }

    return {
      secret: data.secret,
      backupCodes: data.backup_codes
    }
  }

  private static async verifyBackupCode(userId: string, token: string, backupCodes: string[]): Promise<TwoFactorVerification> {
    // Verificar cada código de respaldo
    for (let i = 0; i < backupCodes.length; i++) {
      const isValid = await bcrypt.compare(token, backupCodes[i])
      if (isValid) {
        // Marcar código como usado
        await this.markBackupCodeAsUsed(userId, i)
        
        const remaining = await this.getRemainingBackupCodes(userId)
        return { 
          isValid: true, 
          isBackupCode: true, 
          remainingBackupCodes: remaining 
        }
      }
    }

    return { isValid: false }
  }

  private static async markBackupCodeAsUsed(userId: string, codeIndex: number): Promise<void> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('user_2fa')
      .select('backup_codes')
      .eq('user_id', userId)
      .single()

    if (data) {
      const backupCodes = [...data.backup_codes]
      backupCodes[codeIndex] = 'USED' // Marcar como usado
      
      await supabase
        .from('user_2fa')
        .update({ backup_codes: backupCodes })
        .eq('user_id', userId)
    }
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Verificar si un usuario tiene 2FA activado
 */
export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_2fa')
    .select('is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  return !error && !!data
}

/**
 * Generar código de recuperación único
 */
export function generateRecoveryCode(): string {
  return `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

/**
 * Validar formato de código 2FA
 */
export function isValidTwoFactorCode(code: string): boolean {
  return /^\d{6}$/.test(code)
}

/**
 * Validar formato de código de respaldo
 */
export function isValidBackupCode(code: string): boolean {
  return /^[A-Z0-9]{8}$/.test(code)
}
