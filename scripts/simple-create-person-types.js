#!/usr/bin/env node

/**
 * Script simple para crear tipos de persona para todos los tenants
 * Usa la API REST de Supabase directamente
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
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)?.replace(/"/g, '')
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Debug variables de entorno:')
console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('   SUPABASE_URL:', process.env.SUPABASE_URL)
console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌')
console.log('   supabaseUrl final:', supabaseUrl)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Tipos de persona a crear
const PERSON_TYPES = [
  {
    name: 'Cliente Propiedad',
    description: 'Clientes que alquilan o compran propiedades',
    icon: 'user',
    color: '#3B82F6',
    sort_order: 1
  },
  {
    name: 'Cliente Herramienta',
    description: 'Clientes que usan la plataforma como herramienta',
    icon: 'tool',
    color: '#10B981',
    sort_order: 2
  },
  {
    name: 'Plataforma Distribución',
    description: 'Plataformas que distribuyen alquileres',
    icon: 'globe',
    color: '#F59E0B',
    sort_order: 3
  },
  {
    name: 'Proveedor',
    description: 'Proveedores de servicios',
    icon: 'truck',
    color: '#EF4444',
    sort_order: 4
  },
  {
    name: 'Usuario Plataforma',
    description: 'Usuarios internos de la plataforma',
    icon: 'users',
    color: '#8B5CF6',
    sort_order: 5
  }
]

async function main() {
  console.log('🎯 CREANDO TIPOS DE PERSONA PARA TODOS LOS TENANTS')
  console.log('=' .repeat(60))
  
  try {
    // Paso 1: Obtener todos los tenants
    console.log('\n📋 Obteniendo lista de tenants...')
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name')
      .order('name')
    
    if (tenantsError) {
      throw new Error(`Error obteniendo tenants: ${tenantsError.message}`)
    }
    
    if (!tenants || tenants.length === 0) {
      throw new Error('No se encontraron tenants en el sistema')
    }
    
    console.log(`✅ Encontrados ${tenants.length} tenants:`)
    tenants.forEach(tenant => {
      console.log(`   - ${tenant.name} (${tenant.id})`)
    })
    
    // Paso 2: Para cada tenant, crear los tipos de persona
    console.log('\n🔧 Creando tipos de persona...')
    
    let totalCreated = 0
    let totalSkipped = 0
    
    for (const tenant of tenants) {
      console.log(`\n📝 Procesando tenant: ${tenant.name}`)
      
      for (const personType of PERSON_TYPES) {
        // Verificar si ya existe
        const { data: existing, error: checkError } = await supabase
          .from('configuration_types')
          .select('id')
          .eq('name', personType.name)
          .eq('tenant_id', tenant.id)
          .single()
        
        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`   ❌ Error verificando ${personType.name}: ${checkError.message}`)
          continue
        }
        
        if (existing) {
          console.log(`   ⏭️  ${personType.name} ya existe`)
          totalSkipped++
          continue
        }
        
        // Crear el tipo de persona
        const { data: created, error: createError } = await supabase
          .from('configuration_types')
          .insert({
            name: personType.name,
            description: personType.description,
            icon: personType.icon,
            color: personType.color,
            is_active: true,
            sort_order: personType.sort_order,
            tenant_id: tenant.id
          })
          .select()
          .single()
        
        if (createError) {
          console.error(`   ❌ Error creando ${personType.name}: ${createError.message}`)
          continue
        }
        
        console.log(`   ✅ Creado: ${personType.name}`)
        totalCreated++
      }
    }
    
    // Paso 3: Verificación final
    console.log('\n📊 VERIFICACIÓN FINAL')
    console.log('-'.repeat(40))
    
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
      console.log('⚠️ No se pudo verificar automáticamente')
    } else {
      // Agrupar por tenant
      const tenantGroups = {}
      verification.forEach(item => {
        if (!tenantGroups[item.name]) {
          tenantGroups[item.name] = []
        }
        tenantGroups[item.name].push(item.configuration_types.name)
      })
      
      console.log('📋 Tipos de persona por tenant:')
      Object.entries(tenantGroups).forEach(([tenantName, types]) => {
        const personTypes = types.filter(type => 
          PERSON_TYPES.some(pt => pt.name === type)
        )
        const status = personTypes.length === PERSON_TYPES.length ? '✅' : '⚠️'
        console.log(`   ${status} ${tenantName}: ${personTypes.length}/${PERSON_TYPES.length} tipos`)
      })
    }
    
    console.log('\n🎉 PROCESO COMPLETADO')
    console.log('=' .repeat(60))
    console.log(`📈 RESUMEN:`)
    console.log(`   - Tenants procesados: ${tenants.length}`)
    console.log(`   - Tipos creados: ${totalCreated}`)
    console.log(`   - Tipos ya existentes: ${totalSkipped}`)
    console.log(`   - Total esperado: ${tenants.length * PERSON_TYPES.length}`)
    
  } catch (error) {
    console.error('\n💥 ERROR:', error.message)
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { main, PERSON_TYPES }
