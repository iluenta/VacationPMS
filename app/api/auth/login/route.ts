import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { JWTManager, setAuthCookies } from "@/lib/auth/jwt-manager"
import { TwoFactorManager, isTwoFactorEnabled } from "@/lib/auth/2fa-manager"
import { securityLogger, getClientInfo } from "@/lib/logging/edge-logger"
import { sanitizeEmail } from "@/lib/security/sanitization"

// ============================================================================
// POST /api/auth/login - Iniciar sesión
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, twoFactorCode } = body

    // Sanitizar entrada
    const sanitizedEmail = sanitizeEmail(email)
    if (!sanitizedEmail) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    const clientInfo = getClientInfo(request)

    // Verificar credenciales con Supabase
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password
    })

    if (authError || !authData.user) {
      // Logear intento fallido
      securityLogger.authAttempt({
        email: sanitizedEmail,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        success: false,
        reason: authError?.message || 'Credenciales inválidas'
      })

      return NextResponse.json({ 
        error: "Credenciales inválidas",
        message: "Email o contraseña incorrectos"
      }, { status: 401 })
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('tenant_id, is_admin, is_active')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: "Error al obtener perfil del usuario" 
      }, { status: 500 })
    }

    if (!profile.is_active) {
      securityLogger.authAttempt({
        userId: authData.user.id,
        email: sanitizedEmail,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        success: false,
        reason: 'Usuario inactivo'
      })

      return NextResponse.json({ 
        error: "Cuenta desactivada",
        message: "Tu cuenta ha sido desactivada. Contacta al administrador."
      }, { status: 403 })
    }

    // Verificar si tiene 2FA habilitado
    const has2FA = await isTwoFactorEnabled(authData.user.id)
    
    if (has2FA) {
      if (!twoFactorCode) {
        return NextResponse.json({
          error: "Código 2FA requerido",
          requiresTwoFactor: true,
          message: "Ingresa el código de tu aplicación de autenticación"
        }, { status: 200 }) // 200 porque es un paso válido del proceso
      }

      // Verificar código 2FA
      const twoFactorResult = await TwoFactorManager.verifyLogin(authData.user.id, twoFactorCode)
      
      if (!twoFactorResult.isValid) {
        securityLogger.authAttempt({
          userId: authData.user.id,
          email: sanitizedEmail,
          ip: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          success: false,
          reason: 'Código 2FA inválido'
        })

        return NextResponse.json({
          error: "Código 2FA inválido",
          requiresTwoFactor: true,
          message: "El código de autenticación es incorrecto"
        }, { status: 401 })
      }
    }

    // Generar tokens JWT
    const tokenPair = await JWTManager.generateTokenPair({
      userId: authData.user.id,
      email: sanitizedEmail,
      isAdmin: profile.is_admin,
      tenantId: profile.tenant_id,
      userAgent: clientInfo.userAgent,
      ip: clientInfo.ip
    })

    // Logear login exitoso
    securityLogger.authAttempt({
      userId: authData.user.id,
      email: sanitizedEmail,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      success: true,
      reason: has2FA ? 'Login con 2FA' : 'Login exitoso'
    })

    // Configurar cookies
    const cookies = setAuthCookies(tokenPair)
    const response = NextResponse.json({
      success: true,
      message: "Inicio de sesión exitoso",
      user: {
        id: authData.user.id,
        email: sanitizedEmail,
        isAdmin: profile.is_admin,
        tenantId: profile.tenant_id,
        has2FA
      }
    })

    // Aplicar cookies
    cookies.forEach(cookie => {
      response.headers.append('Set-Cookie', cookie)
    })

    return response

  } catch (error) {
    console.error('[API] Error in login:', error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      message: "Ocurrió un error durante el inicio de sesión"
    }, { status: 500 })
  }
}
