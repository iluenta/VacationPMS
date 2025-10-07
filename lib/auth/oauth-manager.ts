import { createClient } from '@/lib/supabase/server'
import { JWTManager } from './jwt-manager'
import { securityLogger } from '@/lib/logging/edge-logger'

// ============================================================================
// TIPOS
// ============================================================================

export interface OAuthProvider {
  id: string
  name: string
  clientId: string
  clientSecret: string
  authUrl: string
  tokenUrl: string
  userInfoUrl: string
  scopes: string[]
  enabled: boolean
}

export interface OAuthUser {
  id: string
  email: string
  name: string
  picture?: string
  provider: string
  providerId: string
}

export interface OAuthConfig {
  google?: {
    clientId: string
    clientSecret: string
  }
  github?: {
    clientId: string
    clientSecret: string
  }
  microsoft?: {
    clientId: string
    clientSecret: string
  }
}

// ============================================================================
// CONFIGURACIÓN DE PROVEEDORES
// ============================================================================

const OAUTH_PROVIDERS: Record<string, OAuthProvider> = {
  google: {
    id: 'google',
    name: 'Google',
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: ['openid', 'email', 'profile'],
    enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  },
  github: {
    id: 'github',
    name: 'GitHub',
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scopes: ['user:email'],
    enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
  },
  microsoft: {
    id: 'microsoft',
    name: 'Microsoft',
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    scopes: ['openid', 'email', 'profile'],
    enabled: !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET)
  }
}

// ============================================================================
// GESTIÓN DE OAUTH
// ============================================================================

export class OAuthManager {
  /**
   * Obtener URL de autorización para un proveedor
   */
  static getAuthUrl(providerId: string, redirectUri: string, state?: string): string {
    const provider = OAUTH_PROVIDERS[providerId]
    if (!provider || !provider.enabled) {
      throw new Error(`Proveedor OAuth no disponible: ${providerId}`)
    }

    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: redirectUri,
      scope: provider.scopes.join(' '),
      response_type: 'code',
      state: state || this.generateState()
    })

    return `${provider.authUrl}?${params.toString()}`
  }

  /**
   * Intercambiar código de autorización por token de acceso
   */
  static async exchangeCodeForToken(providerId: string, code: string, redirectUri: string): Promise<string> {
    const provider = OAUTH_PROVIDERS[providerId]
    if (!provider || !provider.enabled) {
      throw new Error(`Proveedor OAuth no disponible: ${providerId}`)
    }

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })

    if (!response.ok) {
      throw new Error(`Error obteniendo token OAuth: ${response.statusText}`)
    }

    const data = await response.json()
    return data.access_token
  }

  /**
   * Obtener información del usuario desde el proveedor
   */
  static async getUserInfo(providerId: string, accessToken: string): Promise<OAuthUser> {
    const provider = OAUTH_PROVIDERS[providerId]
    if (!provider || !provider.enabled) {
      throw new Error(`Proveedor OAuth no disponible: ${providerId}`)
    }

    const response = await fetch(provider.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Error obteniendo información del usuario: ${response.statusText}`)
    }

    const userData = await response.json()
    return this.normalizeUserData(providerId, userData)
  }

  /**
   * Autenticar usuario con OAuth
   */
  static async authenticateWithOAuth(providerId: string, code: string, redirectUri: string): Promise<{
    user: any
    tokenPair: any
    isNewUser: boolean
  }> {
    // Intercambiar código por token
    const accessToken = await this.exchangeCodeForToken(providerId, code, redirectUri)
    
    // Obtener información del usuario
    const oauthUser = await this.getUserInfo(providerId, accessToken)
    
    // Buscar o crear usuario
    const { user, isNewUser } = await this.findOrCreateUser(oauthUser)
    
    // Generar tokens JWT
    const tokenPair = await JWTManager.generateTokenPair({
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin || false,
      tenantId: user.tenant_id
    })

    // Logear evento de autenticación
    securityLogger.authAttempt({
      userId: user.id,
      email: user.email,
      ip: 'oauth',
      userAgent: 'oauth',
      success: true,
      reason: `OAuth login with ${providerId}`
    })

    return {
      user,
      tokenPair,
      isNewUser
    }
  }

  /**
   * Obtener proveedores OAuth disponibles
   */
  static getAvailableProviders(): OAuthProvider[] {
    return Object.values(OAUTH_PROVIDERS).filter(provider => provider.enabled)
  }

  /**
   * Verificar si un proveedor está disponible
   */
  static isProviderAvailable(providerId: string): boolean {
    const provider = OAUTH_PROVIDERS[providerId]
    return !!(provider && provider.enabled)
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  private static generateState(): string {
    return `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static normalizeUserData(providerId: string, userData: any): OAuthUser {
    switch (providerId) {
      case 'google':
        return {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          provider: 'google',
          providerId: userData.id
        }
      
      case 'github':
        return {
          id: userData.id.toString(),
          email: userData.email || `${userData.login}@github.com`,
          name: userData.name || userData.login,
          picture: userData.avatar_url,
          provider: 'github',
          providerId: userData.id.toString()
        }
      
      case 'microsoft':
        return {
          id: userData.id,
          email: userData.mail || userData.userPrincipalName,
          name: userData.displayName,
          picture: undefined, // Microsoft Graph no incluye foto por defecto
          provider: 'microsoft',
          providerId: userData.id
        }
      
      default:
        throw new Error(`Proveedor OAuth no soportado: ${providerId}`)
    }
  }

  private static async findOrCreateUser(oauthUser: OAuthUser): Promise<{ user: any; isNewUser: boolean }> {
    const supabase = await createClient()
    
    // Buscar usuario existente por email
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', oauthUser.email)
      .single()

    if (existingUser) {
      // Actualizar información del proveedor OAuth
      await this.updateOAuthProvider(existingUser.id, oauthUser)
      return { user: existingUser, isNewUser: false }
    }

    // Crear nuevo usuario
    const newUser = await this.createUserFromOAuth(oauthUser)
    return { user: newUser, isNewUser: true }
  }

  private static async updateOAuthProvider(userId: string, oauthUser: OAuthUser): Promise<void> {
    const supabase = await createClient()
    
    await supabase
      .from('user_oauth_providers')
      .upsert({
        user_id: userId,
        provider: oauthUser.provider,
        provider_id: oauthUser.providerId,
        provider_data: {
          name: oauthUser.name,
          picture: oauthUser.picture
        },
        updated_at: new Date().toISOString()
      })
  }

  private static async createUserFromOAuth(oauthUser: OAuthUser): Promise<any> {
    const supabase = await createClient()
    
    // Crear usuario en Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: oauthUser.email,
      email_confirm: true,
      user_metadata: {
        name: oauthUser.name,
        picture: oauthUser.picture,
        provider: oauthUser.provider
      }
    })

    if (authError || !authUser.user) {
      throw new Error(`Error creando usuario: ${authError?.message}`)
    }

    // Crear perfil de usuario
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: oauthUser.email,
        name: oauthUser.name,
        is_admin: false,
        created_via: 'oauth',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      throw new Error(`Error creando perfil: ${profileError.message}`)
    }

    // Guardar información del proveedor OAuth
    await supabase
      .from('user_oauth_providers')
      .insert({
        user_id: authUser.user.id,
        provider: oauthUser.provider,
        provider_id: oauthUser.providerId,
        provider_data: {
          name: oauthUser.name,
          picture: oauthUser.picture
        },
        created_at: new Date().toISOString()
      })

    return profile
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Obtener proveedores OAuth configurados
 */
export function getConfiguredProviders(): string[] {
  return Object.entries(OAUTH_PROVIDERS)
    .filter(([_, provider]) => provider.enabled)
    .map(([id, _]) => id)
}

/**
 * Validar estado OAuth
 */
export function validateOAuthState(state: string): boolean {
  return state.startsWith('oauth_') && state.length > 10
}

/**
 * Generar URL de callback OAuth
 */
export function getOAuthCallbackUrl(providerId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${baseUrl}/auth/oauth/callback/${providerId}`
}
