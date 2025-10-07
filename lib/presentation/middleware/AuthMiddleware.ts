import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Middleware: AuthMiddleware
 * 
 * Middleware para manejar la autenticación en las peticiones HTTP.
 * Extrae y valida la información del usuario autenticado.
 */

export interface AuthenticatedUser {
  id: string
  email: string
  tenantId: string | null
  isAdmin: boolean
  isActive: boolean
}

export interface AuthContext {
  user: AuthenticatedUser
  request: NextRequest
}

/**
 * Extrae la información del usuario autenticado del request
 */
export async function extractAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return null
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('tenant_id, is_admin, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      tenantId: profile.tenant_id,
      isAdmin: profile.is_admin || false,
      isActive: profile.is_active !== false
    }
  } catch (error) {
    console.error('[AuthMiddleware] Error extracting user:', error)
    return null
  }
}

/**
 * Middleware para requerir autenticación
 */
export function requireAuth(handler: (context: AuthContext) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = await extractAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        error: 'User account is inactive'
      }, { status: 403 })
    }

    const context: AuthContext = {
      user,
      request
    }

    return await handler(context)
  }
}

/**
 * Middleware para requerir permisos de administrador
 */
export function requireAdmin(handler: (context: AuthContext) => Promise<NextResponse>) {
  return requireAuth(async (context: AuthContext) => {
    if (!context.user.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin privileges required'
      }, { status: 403 })
    }

    return await handler(context)
  })
}

/**
 * Middleware para requerir acceso a un tenant específico
 */
export function requireTenantAccess(tenantId: string) {
  return (handler: (context: AuthContext) => Promise<NextResponse>) => {
    return requireAuth(async (context: AuthContext) => {
      // Los admins pueden acceder a cualquier tenant
      if (context.user.isAdmin) {
        return await handler(context)
      }

      // Los usuarios regulares solo pueden acceder a su propio tenant
      if (context.user.tenantId !== tenantId) {
        return NextResponse.json({
          success: false,
          error: 'Access denied to this tenant'
        }, { status: 403 })
      }

      return await handler(context)
    })
  }
}

/**
 * Helper para extraer el tenant ID del request
 */
export function extractTenantId(request: NextRequest): string | null {
  // Prioridad: header x-tenant-id > query param tenant_id
  const headerTenantId = request.headers.get('x-tenant-id')
  if (headerTenantId) {
    return headerTenantId
  }

  const url = new URL(request.url)
  return url.searchParams.get('tenant_id')
}

/**
 * Helper para determinar el tenant ID que debe usar el usuario
 */
export function determineTenantId(user: AuthenticatedUser, requestedTenantId?: string | null): string {
  // Si el usuario es admin y se especifica un tenant, usarlo
  if (user.isAdmin && requestedTenantId) {
    return requestedTenantId
  }

  // Si el usuario no es admin, usar su tenant asignado
  if (!user.isAdmin && user.tenantId) {
    return user.tenantId
  }

  // Si es admin sin tenant especificado, lanzar error
  if (user.isAdmin && !requestedTenantId) {
    throw new Error('Admin users must specify a tenant')
  }

  // Usuario sin tenant asignado
  throw new Error('User does not have a tenant assigned')
}
