#!/usr/bin/env node

/**
 * Script de validación para verificar tenant_ids en la base de datos
 * Ejecutar con: node scripts/validate_tenant_ids.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Cargar variables de entorno desde .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        process.env[key.trim()] = value.trim()
      }
    })
  }
}

loadEnvFile()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno faltantes')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function validateTenantIds() {
  console.log('🔍 Validando tenant_ids en configuration_types...\n')

  try {
    // Verificar registros problemáticos
    const { data: problematicRecords, error: error1 } = await supabase
      .from('configuration_types')
      .select('id, name, tenant_id, created_at')
      .in('tenant_id', ['null', 'NULL'])

    if (error1) {
      console.error('❌ Error al consultar registros problemáticos:', error1)
      return
    }

    if (problematicRecords && problematicRecords.length > 0) {
      console.log('⚠️  Registros problemáticos encontrados:')
      problematicRecords.forEach(record => {
        console.log(`  - ID: ${record.id}, Name: ${record.name}, tenant_id: "${record.tenant_id}"`)
      })
      console.log(`\n📊 Total de registros problemáticos: ${problematicRecords.length}`)
    } else {
      console.log('✅ No se encontraron registros problemáticos')
    }

    // Verificar registros con tenant_id NULL válido
    const { data: nullRecords, error: error2 } = await supabase
      .from('configuration_types')
      .select('id, name, tenant_id, created_at')
      .is('tenant_id', null)

    if (error2) {
      console.error('❌ Error al consultar registros con tenant_id NULL:', error2)
      return
    }

    console.log(`\n📊 Registros con tenant_id NULL (válidos): ${nullRecords?.length || 0}`)

    // Verificar total de registros
    const { data: allRecords, error: error3 } = await supabase
      .from('configuration_types')
      .select('id, tenant_id')

    if (error3) {
      console.error('❌ Error al consultar todos los registros:', error3)
      return
    }

    const totalRecords = allRecords?.length || 0
    const recordsWithTenant = allRecords?.filter(r => r.tenant_id !== null).length || 0
    const recordsWithoutTenant = totalRecords - recordsWithTenant

    console.log('\n📊 Resumen:')
    console.log(`  - Total de registros: ${totalRecords}`)
    console.log(`  - Con tenant_id: ${recordsWithTenant}`)
    console.log(`  - Sin tenant_id (NULL): ${recordsWithoutTenant}`)

    if (problematicRecords && problematicRecords.length > 0) {
      console.log('\n🔧 Para corregir los registros problemáticos, ejecuta:')
      console.log('   psql -h [HOST] -U [USER] -d [DATABASE] -f scripts/091_fix_null_tenant_ids.sql')
    } else {
      console.log('\n✅ Todos los tenant_ids están correctos')
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

// Ejecutar validación
validateTenantIds()
  .then(() => {
    console.log('\n🎉 Validación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error en la validación:', error)
    process.exit(1)
  })
