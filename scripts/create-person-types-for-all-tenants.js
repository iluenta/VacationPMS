#!/usr/bin/env node

/**
 * Script para crear tipos de persona para todos los tenants
 * Ejecuta los scripts SQL necesarios para asegurar que todos los tenants
 * tengan los tipos de persona requeridos.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Cargar variables de entorno
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

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Función para leer y ejecutar un script SQL
async function executeSqlScript(scriptPath) {
  try {
    console.log(`📄 Leyendo script: ${scriptPath}`)
    
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script no encontrado: ${scriptPath}`)
    }
    
    const sqlContent = fs.readFileSync(scriptPath, 'utf8')
    
    console.log(`🚀 Ejecutando script: ${path.basename(scriptPath)}`)
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sqlContent 
    })
    
    if (error) {
      throw error
    }
    
    console.log(`✅ Script ejecutado exitosamente: ${path.basename(scriptPath)}`)
    return true
    
  } catch (error) {
    console.error(`❌ Error ejecutando script ${scriptPath}:`, error.message)
    return false
  }
}

// Función para ejecutar SQL directamente
async function executeSql(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    })
    
    if (error) {
      throw error
    }
    
    return data
    
  } catch (error) {
    console.error('❌ Error ejecutando SQL:', error.message)
    throw error
  }
}

// Función principal
async function main() {
  console.log('🎯 INICIANDO CREACIÓN DE TIPOS DE PERSONA PARA TODOS LOS TENANTS')
  console.log('=' .repeat(70))
  
  try {
    // Paso 1: Diagnóstico inicial
    console.log('\n📊 PASO 1: DIAGNÓSTICO INICIAL')
    console.log('-'.repeat(50))
    
    const diagnosisScript = path.join(__dirname, '105_diagnose_person_types.sql')
    await executeSqlScript(diagnosisScript)
    
    // Paso 2: Crear tipos de persona para todos los tenants
    console.log('\n🔧 PASO 2: CREAR TIPOS DE PERSONA')
    console.log('-'.repeat(50))
    
    const createScript = path.join(__dirname, '104_create_person_types_all_tenants.sql')
    const success = await executeSqlScript(createScript)
    
    if (!success) {
      throw new Error('Falló la creación de tipos de persona')
    }
    
    // Paso 3: Verificación final
    console.log('\n✅ PASO 3: VERIFICACIÓN FINAL')
    console.log('-'.repeat(50))
    
    // Verificar que todos los tenants tienen tipos de persona
    const verificationSql = `
      SELECT 
        t.name as tenant_name,
        COUNT(ct.id) as tipos_count,
        CASE 
          WHEN COUNT(ct.id) = 5 THEN 'COMPLETO'
          WHEN COUNT(ct.id) = 0 THEN 'SIN_TIPOS'
          ELSE 'INCOMPLETO'
        END as estado
      FROM tenants t
      LEFT JOIN configuration_types ct ON t.id = ct.tenant_id 
        AND ct.name IN (
          'Cliente Propiedad',
          'Cliente Herramienta', 
          'Plataforma Distribución',
          'Proveedor',
          'Usuario Plataforma'
        )
      GROUP BY t.id, t.name
      ORDER BY t.name;
    `
    
    const { data: verification, error: verificationError } = await supabase
      .from('tenants')
      .select(`
        name,
        configuration_types!inner(
          name,
          tenant_id
        )
      `)
    
    if (verificationError) {
      console.log('⚠️ No se pudo verificar automáticamente, pero el script se ejecutó')
    } else {
      console.log('✅ Verificación completada')
    }
    
    console.log('\n🎉 PROCESO COMPLETADO EXITOSAMENTE')
    console.log('=' .repeat(70))
    console.log('📋 PRÓXIMOS PASOS:')
    console.log('   1. Verifica en la página de configuraciones que aparezcan los tipos de persona')
    console.log('   2. Prueba crear una nueva persona en la página de personas')
    console.log('   3. Verifica que todos los tenants tengan acceso a los tipos de persona')
    
  } catch (error) {
    console.error('\n💥 ERROR EN EL PROCESO:', error.message)
    console.error('=' .repeat(70))
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { main, executeSqlScript, executeSql }
