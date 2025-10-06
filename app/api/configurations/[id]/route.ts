import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/configurations/[id] - Obtener tipo de configuración específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
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

    // Construir query
    let query = supabase
      .from("configuration_types")
      .select(`
        id,
        name,
        description,
        icon,
        color,
        is_active,
        sort_order,
        created_at,
        updated_at,
        tenant_id,
        tenants!inner(name)
      `)
      .eq("id", id)
      .single()

    // Si no es admin, filtrar por tenant
    if (!profile.is_admin) {
      query = query.eq("tenant_id", profile.tenant_id)
    }

    const { data: configuration, error } = await query

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Tipo de configuración no encontrado" }, { status: 404 })
      }
      console.error("[API] Error fetching configuration:", error)
      return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: configuration
    })

  } catch (error) {
    console.error("[API] Unexpected error in GET /api/configurations/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// PUT /api/configurations/[id] - Actualizar tipo de configuración
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
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

    const body = await request.json()
    const { name, description, icon, color, sort_order, is_active } = body

    // Validaciones
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: "El nombre no puede estar vacío" }, { status: 400 })
    }

    if (name && name.length > 100) {
      return NextResponse.json({ error: "El nombre no puede exceder 100 caracteres" }, { status: 400 })
    }

    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json({ error: "El color debe ser un código hexadecimal válido" }, { status: 400 })
    }

    // Verificar que la configuración existe y el usuario tiene permisos
    let query = supabase
      .from("configuration_types")
      .select("id, tenant_id")
      .eq("id", id)
      .single()

    if (!profile.is_admin) {
      query = query.eq("tenant_id", profile.tenant_id)
    }

    const { data: existingConfig, error: fetchError } = await query

    if (fetchError || !existingConfig) {
      return NextResponse.json({ error: "Tipo de configuración no encontrado" }, { status: 404 })
    }

    // Preparar datos para actualización
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (icon !== undefined) updateData.icon = icon?.trim() || null
    if (color !== undefined) updateData.color = color || null
    if (sort_order !== undefined) updateData.sort_order = sort_order
    if (is_active !== undefined) updateData.is_active = is_active

    // Actualizar configuración
    const { data: configuration, error } = await supabase
      .from("configuration_types")
      .update(updateData)
      .eq("id", id)
      .select(`
        id,
        name,
        description,
        icon,
        color,
        is_active,
        sort_order,
        created_at,
        updated_at,
        tenant_id,
        tenants!inner(name)
      `)
      .single()

    if (error) {
      console.error("[API] Error updating configuration:", error)
      
      // Manejar error de duplicado
      if (error.code === '23505') {
        return NextResponse.json({ error: "Ya existe un tipo de configuración con ese nombre en este tenant" }, { status: 409 })
      }
      
      return NextResponse.json({ error: "Error al actualizar configuración" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: configuration,
      message: "Tipo de configuración actualizado exitosamente"
    })

  } catch (error) {
    console.error("[API] Unexpected error in PUT /api/configurations/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// DELETE /api/configurations/[id] - Eliminar tipo de configuración
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
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

    // Verificar que la configuración existe y el usuario tiene permisos
    let query = supabase
      .from("configuration_types")
      .select("id, tenant_id")
      .eq("id", id)
      .single()

    if (!profile.is_admin) {
      query = query.eq("tenant_id", profile.tenant_id)
    }

    const { data: existingConfig, error: fetchError } = await query

    if (fetchError || !existingConfig) {
      return NextResponse.json({ error: "Tipo de configuración no encontrado" }, { status: 404 })
    }

    // Verificar dependencias antes de eliminar
    const { data: dependencies, error: depsError } = await supabase
      .rpc('check_configuration_type_dependencies', { config_type_id: id })

    if (depsError) {
      console.error("[API] Error checking dependencies:", depsError)
      return NextResponse.json({ error: "Error al verificar dependencias" }, { status: 500 })
    }

    // Verificar si se puede eliminar
    const canDelete = dependencies?.every((dep: any) => dep.can_delete) ?? true
    if (!canDelete) {
      const blockingTables = dependencies
        ?.filter((dep: any) => !dep.can_delete)
        ?.map((dep: any) => dep.table_name)
        ?.join(', ')
      
      return NextResponse.json({ 
        error: `No se puede eliminar este tipo de configuración porque está siendo usado en: ${blockingTables}`,
        dependencies: dependencies
      }, { status: 409 })
    }

    // Eliminar configuración
    const { error } = await supabase
      .from("configuration_types")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[API] Error deleting configuration:", error)
      return NextResponse.json({ error: "Error al eliminar configuración" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: "Tipo de configuración eliminado exitosamente"
    })

  } catch (error) {
    console.error("[API] Unexpected error in DELETE /api/configurations/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
