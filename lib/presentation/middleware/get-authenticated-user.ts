import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Obtiene el usuario autenticado desde la sesión de Supabase
 * 
 * @param request NextRequest object
 * @returns userId si está autenticado, null si no
 * @throws Error si hay un problema con la autenticación
 */
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  try {
    console.log('🔐 [AUTH] Iniciando autenticación...')
    console.log('🔐 [AUTH] Headers:', {
      authorization: request.headers.get('authorization') ? '✅ Presente' : '❌ Ausente',
      cookie: request.headers.get('cookie') ? '✅ Presente' : '❌ Ausente',
      'user-agent': request.headers.get('user-agent')?.substring(0, 50),
    })
    
    const supabase = await createClient()
    
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    console.log('🔐 [AUTH] Resultado de getUser:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasError: !!error,
      errorMessage: error?.message,
      errorStatus: error?.status,
    })

    if (error) {
      console.error('❌ [AUTH] Error getting user:', error)
      return null
    }

    if (!user) {
      console.log('⚠️ [AUTH] No hay usuario en la sesión')
      return null
    }

    console.log('✅ [AUTH] Usuario autenticado:', { id: user.id, email: user.email })
    return user.id
  } catch (error) {
    console.error('❌ [AUTH] Unexpected error:', error)
    return null
  }
}

/**
 * Obtiene el usuario autenticado y lanza error si no está autenticado
 * 
 * @param request NextRequest object
 * @returns userId
 * @throws Error si no está autenticado
 */
export async function requireAuthenticatedUser(request: NextRequest): Promise<string> {
  const userId = await getAuthenticatedUserId(request)
  
  if (!userId) {
    throw new Error('Authorization header required')
  }
  
  return userId
}
