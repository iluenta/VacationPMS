import { NextRequest, NextResponse } from "next/server"
import { PasswordPolicyManager, generateSecurePassword } from "@/lib/auth/password-policies"

// ============================================================================
// POST /api/auth/password/validate - Validar contraseña
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password, userInfo } = body

    if (!password) {
      return NextResponse.json({ 
        error: "Contraseña requerida",
        message: "Debes proporcionar una contraseña para validar"
      }, { status: 400 })
    }

    // Validar contraseña
    const validation = PasswordPolicyManager.validatePassword(password, userInfo)
    const strength = PasswordPolicyManager.getPasswordStrength(password)

    return NextResponse.json({
      success: true,
      data: {
        isValid: validation.isValid,
        errors: validation.errors,
        score: validation.score,
        strength: {
          score: strength.score,
          level: strength.level,
          feedback: strength.feedback
        }
      }
    })

  } catch (error) {
    console.error('[API] Error validating password:', error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      message: "Error al validar contraseña"
    }, { status: 500 })
  }
}

// ============================================================================
// GET /api/auth/password/generate - Generar contraseña segura
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const length = parseInt(url.searchParams.get('length') || '12')

    // Validar longitud
    if (length < 8 || length > 128) {
      return NextResponse.json({ 
        error: "Longitud inválida",
        message: "La longitud debe estar entre 8 y 128 caracteres"
      }, { status: 400 })
    }

    // Generar contraseña segura
    const password = generateSecurePassword(length)
    const strength = PasswordPolicyManager.getPasswordStrength(password)

    return NextResponse.json({
      success: true,
      data: {
        password,
        length,
        strength: {
          score: strength.score,
          level: strength.level,
          feedback: strength.feedback
        }
      }
    })

  } catch (error) {
    console.error('[API] Error generating password:', error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      message: "Error al generar contraseña"
    }, { status: 500 })
  }
}
