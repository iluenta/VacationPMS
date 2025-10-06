import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/configurations/[id]/values/[valueId] - Obtener valor específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; valueId: string }> }
) {
  try {
    const { id, valueId } = await params;
    
    if (!id || !valueId) {
      return NextResponse.json(
        { success: false, error: "ID de configuración o valor no proporcionado" },
        { status: 400 }
      );
    }
    
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      )
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("tenant_id, is_admin")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "Perfil de usuario no encontrado" },
        { status: 404 }
      )
    }

    // Verificar que el tipo de configuración existe y el usuario tiene permisos
    let configQuery = supabase
      .from("configuration_types")
      .select("id, tenant_id")
      .eq("id", id)
      .single()

    if (!profile.is_admin) {
      configQuery = configQuery.eq("tenant_id", profile.tenant_id)
    }

    const { data: config, error: configError } = await configQuery

    if (configError || !config) {
      return NextResponse.json({ error: "Tipo de configuración no encontrado" }, { status: 404 })
    }

    // Obtener valor específico
    const { data: value, error } = await supabase
      .from("configuration_values")
      .select(`
        id,
        value,
        label,
        description,
        icon,
        color,
        is_active,
        sort_order,
        created_at,
        updated_at
      `)
      .eq("id", valueId)
      .eq("configuration_type_id", id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Valor de configuración no encontrado" }, { status: 404 })
      }
      console.error("[API] Error fetching configuration value:", error)
      return NextResponse.json({ error: "Error al obtener valor de configuración" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: value
    })

  } catch (error) {
    console.error("[API] Unexpected error in GET /api/configurations/[id]/values/[valueId]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// Helper function to get configuration ID (handles both numeric and UUID)
async function getConfigurationId(supabase: any, id: string) {
  // If it's a UUID, use it directly
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  
  // If it's a number, try to find the corresponding configuration
  if (/^\d+$/.test(id)) {
    const { data: config, error } = await supabase
      .from('configuration_types')
      .select('id')
      .eq('id', id)
      .single();
    
    if (error || !config) {
      return null;
    }
    return config.id;
  }
  
  return null;
}

// PUT /api/configurations/[id]/values/[valueId] - Actualizar valor de configuración
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; valueId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id, valueId } = await params;
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: "No autorizado" 
      }, { status: 401 })
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("tenant_id, is_admin")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil de usuario no encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const { value, label, description, icon, color, sort_order, is_active } = body
    
    // Obtener el ID de configuración correcto
    const configId = await getConfigurationId(supabase, id);
    if (!configId) {
      return NextResponse.json(
        { success: false, error: "Tipo de configuración no encontrado" },
        { status: 404 }
      );
    }

    // Validaciones
    if (value !== undefined && (typeof value !== 'string' || value.trim().length === 0)) {
      return NextResponse.json({ error: "El valor no puede estar vacío" }, { status: 400 })
    }

    if (label !== undefined && (typeof label !== 'string' || label.trim().length === 0)) {
      return NextResponse.json({ error: "La etiqueta no puede estar vacía" }, { status: 400 })
    }

    if (value && value.length > 100) {
      return NextResponse.json({ error: "El valor no puede exceder 100 caracteres" }, { status: 400 })
    }

    if (label && label.length > 100) {
      return NextResponse.json({ error: "La etiqueta no puede exceder 100 caracteres" }, { status: 400 })
    }

    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json({ error: "El color debe ser un código hexadecimal válido" }, { status: 400 })
    }

    // Verificar que el tipo de configuración existe y el usuario tiene permisos
    let configQuery = supabase
      .from("configuration_types")
      .select("id, tenant_id")
      .eq("id", id)
      .single()

    if (!profile.is_admin) {
      configQuery = configQuery.eq("tenant_id", profile.tenant_id)
    }

    const { data: config, error: configError } = await configQuery

    if (configError || !config) {
      return NextResponse.json({ error: "Tipo de configuración no encontrado" }, { status: 404 })
    }

    // Verificar que el valor existe
    const { data: existingValue, error: fetchError } = await supabase
      .from("configuration_values")
      .select("id")
      .eq("id", valueId)
      .eq("configuration_type_id", id)
      .single()

    if (fetchError || !existingValue) {
      return NextResponse.json({ error: "Valor de configuración no encontrado" }, { status: 404 })
    }

    // Preparar datos para actualización
    const updateData: any = {}
    if (value !== undefined) updateData.value = value.trim()
    if (label !== undefined) updateData.label = label.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (icon !== undefined) updateData.icon = icon?.trim() || null
    if (color !== undefined) updateData.color = color || null
    if (sort_order !== undefined) updateData.sort_order = sort_order
    if (is_active !== undefined) updateData.is_active = is_active

    // Actualizar valor
    const { data: configurationValue, error } = await supabase
      .from("configuration_values")
      .update(updateData)
      .eq("id", valueId)
      .select(`
        id,
        value,
        label,
        description,
        icon,
        color,
        is_active,
        sort_order,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      console.error("[API] Error updating configuration value:", error)
      
      // Manejar error de duplicado
      if (error.code === '23505') {
        return NextResponse.json({ error: "Ya existe un valor con ese nombre en este tipo de configuración" }, { status: 409 })
      }
      
      return NextResponse.json({ error: "Error al actualizar valor de configuración" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: configurationValue,
      message: "Valor de configuración actualizado exitosamente"
    })

  } catch (error) {
    console.error("[API] Unexpected error in PUT /api/configurations/[id]/values/[valueId]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// DELETE /api/configurations/[id]/values/[valueId] - Eliminar valor de configuración
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; valueId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id, valueId } = await params
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("tenant_id, is_admin")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil de usuario no encontrado" }, { status: 404 })
    }

    // Verificar que el tipo de configuración existe y el usuario tiene permisos
    let configQuery = supabase
      .from("configuration_types")
      .select("id, tenant_id")
      .eq("id", id)
      .single()

    if (!profile.is_admin) {
      configQuery = configQuery.eq("tenant_id", profile.tenant_id)
    }

    const { data: config, error: configError } = await configQuery

    if (configError || !config) {
      return NextResponse.json({ error: "Tipo de configuración no encontrado" }, { status: 404 })
    }

    // Verificar que el valor existe
    const { data: existingValue, error: fetchError } = await supabase
      .from("configuration_values")
      .select("id")
      .eq("id", valueId)
      .eq("configuration_type_id", id)
      .single()

    if (fetchError || !existingValue) {
      return NextResponse.json({ error: "Valor de configuración no encontrado" }, { status: 404 })
    }

    // TODO: Aquí se pueden agregar verificaciones de dependencias en el futuro
    // Por ejemplo, verificar si el valor está siendo usado en otras tablas

    // Eliminar valor
    const { error } = await supabase
      .from("configuration_values")
      .delete()
      .eq("id", valueId)

    if (error) {
      console.error("[API] Error deleting configuration value:", error)
      return NextResponse.json({ error: "Error al eliminar valor de configuración" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: "Valor de configuración eliminado exitosamente"
    })

  } catch (error) {
    console.error("[API] Unexpected error in DELETE /api/configurations/[id]/values/[valueId]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
