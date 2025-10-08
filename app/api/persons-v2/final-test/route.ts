import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/presentation/middleware/get-authenticated-user'

/**
 * Endpoint de prueba final para verificar autenticación
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [FINAL TEST] Probando autenticación...')

    // Intentar obtener el usuario autenticado
    try {
      const userId = await requireAuthenticatedUser(request)
      console.log('✅ [FINAL TEST] Usuario autenticado:', userId)

      return NextResponse.json({
        success: true,
        message: 'Usuario autenticado correctamente',
        userId: userId,
        timestamp: new Date().toISOString()
      }, { status: 200 })

    } catch (authError) {
      console.error('❌ [FINAL TEST] Error de autenticación:', authError)

      return NextResponse.json({
        success: false,
        message: 'No autenticado',
        error: authError instanceof Error ? authError.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

  } catch (error) {
    console.error('❌ [FINAL TEST] Error general:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Error en prueba final',
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
