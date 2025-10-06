import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/configurations - Listar tipos de configuración
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener perfil del usuario para determinar tenant
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("tenant_id, is_admin")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error("[API] Error fetching user profile:", profileError)
      return NextResponse.json({ 
        error: "No se pudo obtener el perfil del usuario. Contacte al administrador." 
      }, { status: 500 })
    }

    // Validar que el usuario tenga un tenant asignado (excepto admins)
    if (!profile.tenant_id && !profile.is_admin) {
      return NextResponse.json({ 
        error: "Usuario sin tenant asignado. Contacte al administrador." 
      }, { status: 403 })
    }

    // Si es admin, obtener el tenant del header o query param
    let tenantId = profile.tenant_id
    if (profile.is_admin) {
      const selectedTenantId = request.headers.get('x-tenant-id') || 
                               request.nextUrl.searchParams.get('tenant_id')
      if (selectedTenantId) {
        tenantId = selectedTenantId
      }
    }

    // Construir query base para configuraciones
    const { data: configurations, error } = await supabase
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
        tenant_id
      `)
      .eq("tenant_id", tenantId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })

    if (error) {
      console.error("[API] Error fetching configurations:", error)
      return NextResponse.json({ 
        error: "Error al obtener configuraciones de la base de datos",
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: configurations || [],
      count: configurations?.length || 0
    })

  } catch (error) {
    console.error("[API] Unexpected error in GET /api/configurations:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// POST /api/configurations - Crear tipo de configuración
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
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
      console.error("[API] Error fetching user profile:", profileError)
      return NextResponse.json({ 
        error: "No se pudo obtener el perfil del usuario. Contacte al administrador." 
      }, { status: 500 })
    }

    // Validar que el usuario tenga un tenant asignado (excepto admins)
    if (!profile.tenant_id && !profile.is_admin) {
      return NextResponse.json({ 
        error: "Usuario sin tenant asignado. Contacte al administrador." 
      }, { status: 403 })
    }

    // Parsear datos del request
    const body = await request.json()
    const { name, description, icon, color, sort_order } = body

    // Validaciones
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    if (name.length > 100) {
      return NextResponse.json({ error: "El nombre no puede exceder 100 caracteres" }, { status: 400 })
    }

    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json({ error: "El color debe ser un código hexadecimal válido" }, { status: 400 })
    }

    // Si es admin, obtener el tenant del header o query param
    let tenant_id = profile.tenant_id
    if (profile.is_admin) {
      const selectedTenantId = request.headers.get('x-tenant-id') || 
                               request.nextUrl.searchParams.get('tenant_id')
      if (selectedTenantId) {
        tenant_id = selectedTenantId
      }
    }

    // Crear configuración real en la base de datos
    
    const { data: configuration, error } = await supabase
      .from("configuration_types")
      .insert({
        tenant_id,
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        color: color || null,
        sort_order: sort_order || 0,
        is_active: true
      })
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
        tenant_id
      `)
      .single()

    if (error) {
      console.error("[API] Error creating configuration:", error)
      
      // Manejar error de duplicado
      if (error.code === '23505') {
        return NextResponse.json({ error: "Ya existe un tipo de configuración con ese nombre en este tenant" }, { status: 409 })
      }
      
      return NextResponse.json({ error: "Error al crear configuración" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: configuration,
      message: "Tipo de configuración creado exitosamente"
    }, { status: 201 })

  } catch (error) {
    console.error("[API] Unexpected error in POST /api/configurations:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
