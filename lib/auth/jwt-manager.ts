import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// CONFIGURACIÓN JWT
// ============================================================================

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')
const ACCESS_TOKEN_EXPIRY = '15m' // 15 minutos
const REFRESH_TOKEN_EXPIRY = '7d' // 7 días

// ============================================================================
// TIPOS
// ============================================================================

export interface JWTPayload extends JWTPayload {
  userId: string
  email: string
  isAdmin: boolean
  tenantId?: string
  sessionId: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface RefreshTokenData {
  userId: string
  sessionId: string
  expiresAt: Date
  createdAt: Date
  lastUsedAt?: Date
  userAgent?: string
  ip?: string
}

// ============================================================================
// GESTIÓN DE TOKENS
// ============================================================================

export class JWTManager {
  /**
   * Generar par de tokens (access + refresh)
   */
  static async generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<TokenPair> {
    const sessionId = this.generateSessionId()
    const now = Math.floor(Date.now() / 1000)
    
    // Access token (corto)
    const accessToken = await new SignJWT({
      ...payload,
      sessionId,
      type: 'access'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + 15 * 60) // 15 minutos
      .sign(JWT_SECRET)

    // Refresh token (largo)
    const refreshToken = await new SignJWT({
      userId: payload.userId,
      sessionId,
      type: 'refresh'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + 7 * 24 * 60 * 60) // 7 días
      .sign(JWT_SECRET)

    // Guardar refresh token en base de datos
    await this.storeRefreshToken({
      userId: payload.userId,
      sessionId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      userAgent: payload.userAgent,
      ip: payload.ip
    })

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutos en segundos
    }
  }

  /**
   * Verificar y decodificar access token
   */
  static async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      
      if (payload.type !== 'access') {
        return null
      }

      return payload as JWTPayload
    } catch (error) {
      return null
    }
  }

  /**
   * Verificar y decodificar refresh token
   */
  static async verifyRefreshToken(token: string): Promise<{ userId: string; sessionId: string } | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      
      if (payload.type !== 'refresh') {
        return null
      }

      // Verificar que el refresh token existe en la base de datos
      const isValid = await this.validateRefreshToken(payload.sessionId as string)
      if (!isValid) {
        return null
      }

      return {
        userId: payload.userId as string,
        sessionId: payload.sessionId as string
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Refrescar access token usando refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
    const tokenData = await this.verifyRefreshToken(refreshToken)
    if (!tokenData) {
      return null
    }

    // Obtener datos del usuario
    const supabase = await createClient()
    const { data: user, error } = await supabase.auth.admin.getUserById(tokenData.userId)
    
    if (error || !user) {
      return null
    }

    // Obtener perfil del usuario
    const { data: profile } = await supabase
      .from('users')
      .select('tenant_id, is_admin')
      .eq('id', tokenData.userId)
      .single()

    // Generar nuevo par de tokens
    const newTokenPair = await this.generateTokenPair({
      userId: tokenData.userId,
      email: user.email!,
      isAdmin: profile?.is_admin || false,
      tenantId: profile?.tenant_id,
      sessionId: tokenData.sessionId
    })

    // Actualizar último uso del refresh token
    await this.updateRefreshTokenUsage(tokenData.sessionId)

    return newTokenPair
  }

  /**
   * Revocar refresh token (logout)
   */
  static async revokeRefreshToken(sessionId: string): Promise<void> {
    const supabase = await createClient()
    await supabase
      .from('refresh_tokens')
      .delete()
      .eq('session_id', sessionId)
  }

  /**
   * Revocar todos los refresh tokens de un usuario
   */
  static async revokeAllUserTokens(userId: string): Promise<void> {
    const supabase = await createClient()
    await supabase
      .from('refresh_tokens')
      .delete()
      .eq('user_id', userId)
  }

  /**
   * Limpiar refresh tokens expirados
   */
  static async cleanupExpiredTokens(): Promise<void> {
    const supabase = await createClient()
    await supabase
      .from('refresh_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  private static generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static async storeRefreshToken(tokenData: RefreshTokenData): Promise<void> {
    const supabase = await createClient()
    await supabase
      .from('refresh_tokens')
      .insert({
        user_id: tokenData.userId,
        session_id: tokenData.sessionId,
        expires_at: tokenData.expiresAt.toISOString(),
        created_at: tokenData.createdAt.toISOString(),
        user_agent: tokenData.userAgent,
        ip: tokenData.ip
      })
  }

  private static async validateRefreshToken(sessionId: string): Promise<boolean> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('refresh_tokens')
      .select('id, expires_at')
      .eq('session_id', sessionId)
      .single()

    if (error || !data) {
      return false
    }

    // Verificar que no esté expirado
    return new Date(data.expires_at) > new Date()
  }

  private static async updateRefreshTokenUsage(sessionId: string): Promise<void> {
    const supabase = await createClient()
    await supabase
      .from('refresh_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('session_id', sessionId)
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Middleware para verificar JWT en requests
 */
export async function verifyJWTFromRequest(request: Request): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  return await JWTManager.verifyAccessToken(token)
}

/**
 * Extraer token de cookies
 */
export function getTokenFromCookies(cookies: string): { accessToken?: string; refreshToken?: string } {
  const cookieMap = new Map()
  cookies.split(';').forEach(cookie => {
    const [key, value] = cookie.trim().split('=')
    if (key && value) {
      cookieMap.set(key, value)
    }
  })

  return {
    accessToken: cookieMap.get('access_token'),
    refreshToken: cookieMap.get('refresh_token')
  }
}

/**
 * Configurar cookies de autenticación
 */
export function setAuthCookies(tokenPair: TokenPair): string[] {
  const cookies = [
    `access_token=${tokenPair.accessToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=${tokenPair.expiresIn}`,
    `refresh_token=${tokenPair.refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
  ]

  return cookies
}

/**
 * Limpiar cookies de autenticación
 */
export function clearAuthCookies(): string[] {
  return [
    'access_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
    'refresh_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
  ]
}
