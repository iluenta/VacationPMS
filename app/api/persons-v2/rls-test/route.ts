import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [RLS TEST] Iniciando prueba de RLS...')

    const tenantId = '00000000-0000-0000-0000-000000000001'

    // 1. Cliente CON contexto de usuario (usa cookies)
    const { createClient: createServerClient } = await import('@/lib/supabase/server')
    const supabaseWithUser = await createServerClient()

    console.log('🔐 [RLS TEST] Probando con cliente CON contexto de usuario...')
    const { data: dataWithUser, error: errorWithUser } = await supabaseWithUser
      .from('persons')
      .select('*')
      .eq('tenant_id', tenantId)

    console.log('📊 [RLS TEST] Resultado CON contexto de usuario:', {
      count: dataWithUser?.length || 0,
      error: errorWithUser?.message,
      firstPerson: dataWithUser?.[0] ? {
        id: dataWithUser[0].id,
        first_name: dataWithUser[0].first_name,
        tenant_id: dataWithUser[0].tenant_id
      } : null
    })

    // 2. Cliente SIN contexto de usuario (Service Role puro)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔓 [RLS TEST] Probando con cliente SIN contexto de usuario (Admin)...')
    const { data: dataAdmin, error: errorAdmin } = await supabaseAdmin
      .from('persons')
      .select('*')
      .eq('tenant_id', tenantId)

    console.log('📊 [RLS TEST] Resultado SIN contexto de usuario (Admin):', {
      count: dataAdmin?.length || 0,
      error: errorAdmin?.message,
      firstPerson: dataAdmin?.[0] ? {
        id: dataAdmin[0].id,
        first_name: dataAdmin[0].first_name,
        tenant_id: dataAdmin[0].tenant_id
      } : null
    })

    // 3. Verificar RLS en la tabla persons
    const { data: rlsPolicies, error: rlsError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'persons')

    console.log('🛡️ [RLS TEST] Políticas RLS en tabla persons:', {
      count: rlsPolicies?.length || 0,
      error: rlsError?.message
    })

    return NextResponse.json({
      success: true,
      withUserContext: {
        count: dataWithUser?.length || 0,
        error: errorWithUser?.message,
        hasData: !!dataWithUser && dataWithUser.length > 0
      },
      withoutUserContext: {
        count: dataAdmin?.length || 0,
        error: errorAdmin?.message,
        hasData: !!dataAdmin && dataAdmin.length > 0
      },
      rlsPolicies: {
        count: rlsPolicies?.length || 0,
        error: rlsError?.message
      }
    })
  } catch (error) {
    console.error('❌ [RLS TEST] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

