import { NextRequest, NextResponse } from 'next/server'
import { TenantId } from '@/lib/domain/value-objects/TenantId'
import { UserId } from '@/lib/domain/value-objects/UserId'

/**
 * Endpoint para probar validación de UUIDs
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [UUID TEST] Iniciando prueba de UUIDs...')

    const results: any = {
      testUuids: []
    }

    // Probar diferentes UUIDs
    const testUuids = [
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      '00000001-0000-4000-8000-000000000000',
      '453129fb-950e-4934-a1ff-2cb83ca697cd',
      'invalid-uuid',
      '12345678-1234-1234-1234-123456789012'
    ]

    for (const uuid of testUuids) {
      try {
        const tenantId = TenantId.fromString(uuid)
        results.testUuids.push({
          uuid,
          valid: true,
          value: tenantId.getValue()
        })
        console.log(`✅ [UUID TEST] ${uuid} es válido`)
      } catch (error) {
        results.testUuids.push({
          uuid,
          valid: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
        console.log(`❌ [UUID TEST] ${uuid} es inválido: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    }

    // Probar UserId también
    try {
      const userId = UserId.fromString('453129fb-950e-4934-a1ff-2cb83ca697cd')
      results.userIdTest = {
        valid: true,
        value: userId.getValue()
      }
      console.log('✅ [UUID TEST] UserId válido')
    } catch (error) {
      results.userIdTest = {
        valid: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
      console.log('❌ [UUID TEST] UserId inválido:', error instanceof Error ? error.message : 'Error desconocido')
    }

    const response = {
      success: true,
      message: 'Prueba de UUIDs completada',
      results,
      timestamp: new Date().toISOString()
    }

    console.log('🎉 [UUID TEST] Prueba completada')
    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ [UUID TEST] Error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Error en prueba de UUIDs',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
