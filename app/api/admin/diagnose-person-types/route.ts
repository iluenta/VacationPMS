import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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
    
    // Obtener todos los tipos de configuración
    const { data: configurations, error: configError } = await supabase
      .from('configuration_types')
      .select('id, name, description, tenant_id, is_active')
      .order('name')
    
    if (configError) {
      return NextResponse.json({
        success: false,
        error: `Error obteniendo configuraciones: ${configError.message}`
      }, { status: 500 })
    }
    
    // Filtrar tipos de persona
    const personTypes = [
      'Cliente Propiedad',
      'Cliente Herramienta',
      'Plataforma Distribución',
      'Proveedor',
      'Usuario Plataforma'
    ]
    
    const personConfigurations = configurations?.filter(config => 
      personTypes.includes(config.name)
    ) || []
    
    // Agrupar por tenant
    const tenantGroups: Record<string, any> = {}
    
    tenants?.forEach(tenant => {
      tenantGroups[tenant.id] = {
        id: tenant.id,
        name: tenant.name,
        types: []
      }
    })
    
    personConfigurations.forEach(config => {
      if (tenantGroups[config.tenant_id]) {
        tenantGroups[config.tenant_id].types.push({
          name: config.name,
          description: config.description,
          is_active: config.is_active
        })
      }
    })
    
    // Crear resumen
    const summary = Object.values(tenantGroups).map((tenant: any) => ({
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      person_types_count: tenant.types.length,
      total_expected: personTypes.length,
      status: tenant.types.length === personTypes.length ? 'COMPLETO' : 'INCOMPLETO',
      types: tenant.types.map((t: any) => t.name),
      missing_types: personTypes.filter(type => 
        !tenant.types.some((t: any) => t.name === type)
      )
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        tenants_count: tenants?.length || 0,
        total_configurations: configurations?.length || 0,
        person_configurations: personConfigurations.length,
        summary
      }
    })
    
  } catch (error) {
    console.error('Error en diagnóstico:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
