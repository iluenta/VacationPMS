import { createClient } from '@/lib/supabase/server'
import { JWTManager } from './jwt-manager'
import { securityLogger } from '@/lib/logging/edge-logger'

// ============================================================================
// TIPOS
// ============================================================================

export interface SessionInfo {
  sessionId: string
  userId: string
  email: string
  isAdmin: boolean
  tenantId?: string
  createdAt: Date
  lastUsedAt?: Date
  userAgent?: string
  ip?: string
  isCurrent: boolean
}

export interface SessionStats {
  totalSessions: number
  activeSessions: number
  currentSessionId?: string
  lastActivity?: Date
}

// ============================================================================
// GESTIÓN DE SESIONES
// ============================================================================

export class SessionManager {
  /**
   * Obtener información de todas las sesiones de un usuario
   */
  static async getUserSessions(userId: string, currentSessionId?: string): Promise<SessionInfo[]> {
    const supabase = await createClient()
    
    const { data: sessions, error } = await supabase
      .from('refresh_tokens')
      .select(`
        session_id,
        created_at,
        last_used_at,
        user_agent,
        ip,
        expires_at
      `)
      .eq('user_id', userId)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Error fetching user sessions: ${error.message}`)
    }

    // Obtener información del usuario
    const { data: user } = await supabase.auth.admin.getUserById(userId)
    const { data: profile } = await supabase
      .from('users')
      .select('tenant_id, is_admin')
      .eq('id', userId)
      .single()

    return sessions.map(session => ({
      sessionId: session.session_id,
      userId,
      email: user?.email || '',
      isAdmin: profile?.is_admin || false,
      tenantId: profile?.tenant_id,
      createdAt: new Date(session.created_at),
      lastUsedAt: session.last_used_at ? new Date(session.last_used_at) : undefined,
      userAgent: session.user_agent,
      ip: session.ip,
      isCurrent: session.session_id === currentSessionId
    }))
  }

  /**
   * Obtener estadísticas de sesiones
   */
  static async getSessionStats(userId: string, currentSessionId?: string): Promise<SessionStats> {
    const sessions = await this.getUserSessions(userId, currentSessionId)
    
    const activeSessions = sessions.filter(s => 
      !s.lastUsedAt || (Date.now() - s.lastUsedAt.getTime()) < 24 * 60 * 60 * 1000
    )

    const currentSession = sessions.find(s => s.isCurrent)
    
    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      currentSessionId: currentSession?.sessionId,
      lastActivity: currentSession?.lastUsedAt
    }
  }

  /**
   * Revocar una sesión específica
   */
  static async revokeSession(userId: string, sessionId: string, currentUserId: string): Promise<boolean> {
    const supabase = await createClient()
    
    // Verificar que el usuario puede revocar esta sesión
    if (userId !== currentUserId) {
      throw new Error('No tienes permisos para revocar esta sesión')
    }

    const { error } = await supabase
      .from('refresh_tokens')
      .update({ revoked: true })
      .eq('user_id', userId)
      .eq('session_id', sessionId)

    if (error) {
      throw new Error(`Error revoking session: ${error.message}`)
    }

    // Logear evento de seguridad
    securityLogger.authAttempt({
      userId,
      ip: 'system',
      userAgent: 'system',
      success: true,
      reason: 'Session revoked'
    })

    return true
  }

  /**
   * Revocar todas las sesiones excepto la actual
   */
  static async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<number> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('refresh_tokens')
      .update({ revoked: true })
      .eq('user_id', userId)
      .neq('session_id', currentSessionId)
      .eq('revoked', false)
      .select('id')

    if (error) {
      throw new Error(`Error revoking sessions: ${error.message}`)
    }

    // Logear evento de seguridad
    securityLogger.authAttempt({
      userId,
      ip: 'system',
      userAgent: 'system',
      success: true,
      reason: `All other sessions revoked (${data.length} sessions)`
    })

    return data.length
  }

  /**
   * Limpiar sesiones expiradas
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('refresh_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id')

    if (error) {
      throw new Error(`Error cleaning up expired sessions: ${error.message}`)
    }

    return data.length
  }

  /**
   * Detectar sesiones sospechosas
   */
  static async detectSuspiciousSessions(userId: string, currentSessionId: string): Promise<SessionInfo[]> {
    const sessions = await this.getUserSessions(userId, currentSessionId)
    
    const suspiciousSessions: SessionInfo[] = []
    
    for (const session of sessions) {
      let suspicious = false
      const reasons: string[] = []

      // Sesión muy antigua sin uso
      if (session.lastUsedAt) {
        const daysSinceLastUse = (Date.now() - session.lastUsedAt.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceLastUse > 30) {
          suspicious = true
          reasons.push('No usado por más de 30 días')
        }
      }

      // Múltiples sesiones desde la misma IP
      const sameIPSessions = sessions.filter(s => s.ip === session.ip && s.sessionId !== session.sessionId)
      if (sameIPSessions.length > 3) {
        suspicious = true
        reasons.push(`Múltiples sesiones desde la misma IP (${sameIPSessions.length + 1})`)
      }

      // User agent sospechoso
      if (session.userAgent) {
        const suspiciousPatterns = [
          /bot/i,
          /crawler/i,
          /spider/i,
          /scraper/i,
          /curl/i,
          /wget/i
        ]
        
        if (suspiciousPatterns.some(pattern => pattern.test(session.userAgent!))) {
          suspicious = true
          reasons.push('User agent sospechoso')
        }
      }

      if (suspicious) {
        suspiciousSessions.push({
          ...session,
          // Agregar razones como metadata
          userAgent: `${session.userAgent} (SOSPECHOSO: ${reasons.join(', ')})`
        })
      }
    }

    return suspiciousSessions
  }

  /**
   * Obtener historial de sesiones
   */
  static async getSessionHistory(userId: string, limit: number = 50): Promise<SessionInfo[]> {
    const supabase = await createClient()
    
    const { data: sessions, error } = await supabase
      .from('refresh_tokens')
      .select(`
        session_id,
        created_at,
        last_used_at,
        user_agent,
        ip,
        revoked
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Error fetching session history: ${error.message}`)
    }

    // Obtener información del usuario
    const { data: user } = await supabase.auth.admin.getUserById(userId)
    const { data: profile } = await supabase
      .from('users')
      .select('tenant_id, is_admin')
      .eq('id', userId)
      .single()

    return sessions.map(session => ({
      sessionId: session.session_id,
      userId,
      email: user?.email || '',
      isAdmin: profile?.is_admin || false,
      tenantId: profile?.tenant_id,
      createdAt: new Date(session.created_at),
      lastUsedAt: session.last_used_at ? new Date(session.last_used_at) : undefined,
      userAgent: session.user_agent,
      ip: session.ip,
      isCurrent: false // En historial, ninguna es actual
    }))
  }

  /**
   * Forzar logout de todas las sesiones (emergencia)
   */
  static async emergencyLogoutAll(userId: string, reason: string): Promise<number> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('refresh_tokens')
      .update({ 
        revoked: true,
        last_used_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('revoked', false)
      .select('id')

    if (error) {
      throw new Error(`Error in emergency logout: ${error.message}`)
    }

    // Logear evento crítico
    securityLogger.authAttempt({
      userId,
      ip: 'system',
      userAgent: 'system',
      success: true,
      reason: `Emergency logout: ${reason} (${data.length} sessions)`
    })

    return data.length
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Obtener información de la sesión actual
 */
export async function getCurrentSessionInfo(request: Request): Promise<SessionInfo | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const payload = await JWTManager.verifyAccessToken(token)
    
    if (!payload) {
      return null
    }

    const sessions = await SessionManager.getUserSessions(payload.userId, payload.sessionId)
    return sessions.find(s => s.isCurrent) || null
  } catch (error) {
    return null
  }
}

/**
 * Verificar si una sesión está activa
 */
export async function isSessionActive(sessionId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('refresh_tokens')
    .select('id')
    .eq('session_id', sessionId)
    .eq('revoked', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  return !error && !!data
}

/**
 * Obtener estadísticas globales de sesiones
 */
export async function getGlobalSessionStats(): Promise<{
  totalSessions: number
  activeSessions: number
  expiredSessions: number
  revokedSessions: number
}> {
  const supabase = await createClient()
  
  const now = new Date().toISOString()
  
  const [total, active, expired, revoked] = await Promise.all([
    supabase.from('refresh_tokens').select('id', { count: 'exact' }),
    supabase.from('refresh_tokens').select('id', { count: 'exact' }).eq('revoked', false).gt('expires_at', now),
    supabase.from('refresh_tokens').select('id', { count: 'exact' }).lt('expires_at', now),
    supabase.from('refresh_tokens').select('id', { count: 'exact' }).eq('revoked', true)
  ])

  return {
    totalSessions: total.count || 0,
    activeSessions: active.count || 0,
    expiredSessions: expired.count || 0,
    revokedSessions: revoked.count || 0
  }
}
