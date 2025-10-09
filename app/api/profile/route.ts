import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function PUT(request: NextRequest) {
  try {
    console.log('🔧 [PROFILE] Updating user profile...')
    
    const supabase = await createClient()
    
    // Obtener usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Parsear datos del body
    const body = await request.json()
    const { full_name, theme_color } = body
    
    console.log('🔧 [PROFILE] Update data:', { full_name, theme_color })
    
    // Usar cliente admin para evitar triggers problemáticos
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Actualizar perfil usando cliente admin
    const { data, error } = await adminSupabase
      .from('users')
      .update({
        full_name,
        theme_color,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
    
    if (error) {
      console.error('❌ [PROFILE] Update error:', error)
      
      // Si es el error del trigger de password_hash, intentar sin updated_at
      if (error.message.includes('password_hash')) {
        console.log('🔧 [PROFILE] Retrying without updated_at due to password_hash trigger error...')
        
        const { data: retryData, error: retryError } = await adminSupabase
          .from('users')
          .update({
            full_name,
            theme_color,
            // No incluir updated_at para evitar el trigger
          })
          .eq('id', user.id)
          .select()
        
        if (retryError) {
          console.error('❌ [PROFILE] Retry also failed:', retryError)
          
          return NextResponse.json(
            { 
              success: false, 
              error: 'Failed to update profile',
              details: retryError.message,
              code: retryError.code
            },
            { status: 400 }
          )
        }
        
        console.log('✅ [PROFILE] Profile updated successfully (retry):', retryData)
        
        return NextResponse.json({
          success: true,
          message: 'Profile updated successfully',
          data: retryData[0]
        })
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update profile',
          details: error.message,
          code: error.code
        },
        { status: 400 }
      )
    }
    
    console.log('✅ [PROFILE] Profile updated successfully:', data)
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: data[0]
    })
    
  } catch (error) {
    console.error('❌ [PROFILE] Unexpected error:', error)
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
