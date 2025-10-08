import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener todos los tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name')
      .order('name')
    
    if (tenantsError) {
      return NextResponse.json({
        success: false,
        error: `Error obteniendo tenants: ${tenantsError.message}`
      }, { status: 500 })
    }
    
    if (!tenants || tenants.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se encontraron tenants en el sistema'
      }, { status: 404 })
    }
    
    let totalCreated = 0
    let totalSkipped = 0
    const results = []
    
    // Para cada tenant, crear los tipos de persona
    for (const tenant of tenants) {
      const tenantResults = {
        tenant: tenant.name,
        created: 0,
        skipped: 0,
        errors: []
      }
      
      for (const personType of PERSON_TYPES) {
        try {
          // Verificar si ya existe
          const { data: existing, error: checkError } = await supabase
            .from('configuration_types')
            .select('id')
            .eq('name', personType.name)
            .eq('tenant_id', tenant.id)
            .single()
          
          if (checkError && checkError.code !== 'PGRST116') {
            tenantResults.errors.push(`Error verificando ${personType.name}: ${checkError.message}`)
            continue
          }
          
          if (existing) {
            tenantResults.skipped++
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
            tenantResults.errors.push(`Error creando ${personType.name}: ${createError.message}`)
            continue
          }
          
          tenantResults.created++
          totalCreated++
          
        } catch (error) {
          tenantResults.errors.push(`Error procesando ${personType.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        }
      }
      
      results.push(tenantResults)
    }
    
    // Verificación final
    const { data: verification, error: verificationError } = await supabase
      .from('tenants')
      .select(`
        name,
        configuration_types!inner(
          name,
          tenant_id
        )
      `)
    
    let verificationResults = null
    if (!verificationError && verification) {
      // Agrupar por tenant
      const tenantGroups: Record<string, string[]> = {}
      verification.forEach((item: any) => {
        if (!tenantGroups[item.name]) {
          tenantGroups[item.name] = []
        }
        tenantGroups[item.name].push(item.configuration_types.name)
      })
      
      verificationResults = Object.entries(tenantGroups).map(([tenantName, types]) => {
        const personTypes = types.filter(type => 
          PERSON_TYPES.some(pt => pt.name === type)
        )
        return {
          tenant: tenantName,
          types_count: personTypes.length,
          total_expected: PERSON_TYPES.length,
          status: personTypes.length === PERSON_TYPES.length ? 'COMPLETO' : 'INCOMPLETO'
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Tipos de persona creados exitosamente',
      summary: {
        tenants_processed: tenants.length,
        total_created: totalCreated,
        total_skipped: totalSkipped,
        total_expected: tenants.length * PERSON_TYPES.length
      },
      results,
      verification: verificationResults
    })
    
  } catch (error) {
    console.error('Error creando tipos de persona:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener todos los tenants con sus tipos de persona
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select(`
        id,
        name,
        configuration_types!inner(
          name,
          tenant_id
        )
      `)
    
    if (tenantsError) {
      return NextResponse.json({
        success: false,
        error: `Error obteniendo datos: ${tenantsError.message}`
      }, { status: 500 })
    }
    
    // Agrupar por tenant
    const tenantGroups: Record<string, any> = {}
    tenants?.forEach((item: any) => {
      if (!tenantGroups[item.name]) {
        tenantGroups[item.name] = {
          id: item.id,
          name: item.name,
          types: []
        }
      }
      tenantGroups[item.name].types.push(item.configuration_types.name)
    })
    
    // Verificar tipos de persona
    const results = Object.values(tenantGroups).map((tenant: any) => {
      const personTypes = tenant.types.filter((type: string) => 
        PERSON_TYPES.some(pt => pt.name === type)
      )
      return {
        tenant: tenant.name,
        tenant_id: tenant.id,
        person_types_count: personTypes.length,
        total_expected: PERSON_TYPES.length,
        status: personTypes.length === PERSON_TYPES.length ? 'COMPLETO' : 'INCOMPLETO',
        missing_types: PERSON_TYPES
          .filter(pt => !personTypes.includes(pt.name))
          .map(pt => pt.name)
      }
    })
    
    return NextResponse.json({
      success: true,
      data: results
    })
    
  } catch (error) {
    console.error('Error obteniendo estado de tipos de persona:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
