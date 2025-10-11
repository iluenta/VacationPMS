// Script para verificar y corregir theme_color en Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAndFixThemeColor() {
  try {
    console.log('🔍 Checking theme_color column...')
    
    // Verificar si la columna existe
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'users')
      .eq('column_name', 'theme_color')

    if (columnError) {
      console.error('❌ Error checking columns:', columnError)
      return
    }

    if (columns.length === 0) {
      console.log('⚠️ theme_color column does not exist. Creating it...')
      
      // Crear la columna
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_color VARCHAR(20) DEFAULT 'blue'`
      })

      if (alterError) {
        console.error('❌ Error creating theme_color column:', alterError)
        return
      }
      
      console.log('✅ theme_color column created')
    } else {
      console.log('✅ theme_color column exists:', columns[0])
    }

    // Verificar datos del usuario
    console.log('🔍 Checking user data...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, theme_color, is_admin, tenant_id')
      .eq('email', 'veratespera@gmail.com')
      .single()

    if (userError) {
      console.error('❌ Error fetching user data:', userError)
      return
    }

    console.log('👤 User data:', userData)

    // Si theme_color es null o undefined, actualizarlo
    if (!userData.theme_color) {
      console.log('⚠️ theme_color is null/undefined. Setting to green...')
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ theme_color: 'green' })
        .eq('email', 'veratespera@gmail.com')

      if (updateError) {
        console.error('❌ Error updating theme_color:', updateError)
        return
      }
      
      console.log('✅ theme_color updated to green')
    } else {
      console.log('✅ theme_color is already set:', userData.theme_color)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkAndFixThemeColor()
