import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/configurations/[id]/values - Listar valores de configuración
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de configuración no proporcionado" },
        { status: 400 }
      );
    }
    
    const supabase = await createClient()
    
    // Verificar autenticaci n
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

    // Si el ID es num rico, intentar obtener el primer tipo de configuraci n
    let configId = id;
    if (/^\d+$/.test(id)) {
      const { data: configs, error: configError } = await supabase
        .from('configuration_types')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1);
      
      if (configError || !configs?.[0]?.id) {
        return NextResponse.json(
          { success: false, error: "No se pudo determinar el tipo de configuraci n" },
          { status: 404 }
        );
      }
      
      configId = configs[0].id;
    }

    // Verificar que el tipo de configuraci n existe
    let query = supabase
      .from("configuration_types")
      .select("id, tenant_id")
      .eq("id", configId);

    if (!profile.is_admin) {
      query = query.eq("tenant_id", profile.tenant_id);
    }

    const { data: config, error: configError } = await query.single();

    if (configError || !config) {
      return NextResponse.json(
        { success: false, error: "Tipo de configuraci n no encontrado o no tienes permiso" },
        { status: 404 }
      );
    }

    // Obtener valores de configuraci n
    const { data: values, error: valuesError } = await supabase
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
        updated_at
      `)
      .eq("configuration_type_id", configId)
      .order("sort_order", { ascending: true });

    if (valuesError) {
      console.error("[API] Error fetching configuration values:", valuesError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Error al obtener valores de configuraci n",
          details: valuesError instanceof Error ? valuesError.message : String(valuesError)
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: values || [],
      count: values?.length || 0
    });

  } catch (error) {
    console.error("[API] Unexpected error in GET /api/configurations/[id]/values:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST /api/configurations/[id]/values - Crear un nuevo valor de configuraci n
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de configuraci n no proporcionado" },
        { status: 400 }
      );
    }

    const supabase = await createClient()
    
    // Verificar autenticaci n
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

    // Obtener datos del cuerpo de la solicitud
    const { value, label, description, icon, color, sort_order } = await request.json()

    // Validar campos requeridos
    if (!value || !label) {
      return NextResponse.json(
        { 
          success: false,
          error: "Los campos 'value' y 'label' son requeridos"
        },
        { status: 400 }
      )
    }

    // Verificar que el tipo de configuraci n existe
    let query = supabase
      .from("configuration_types")
      .select("id, tenant_id")
      .eq("id", id)

    if (!profile.is_admin) {
      query = query.eq("tenant_id", profile.tenant_id)
    }

    const { data: config, error: configError } = await query.single()

    if (configError || !config) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Tipo de configuraci n no encontrado o no tienes permiso" 
        },
        { status: 404 }
      )
    }

    // Crear el valor de configuraci n
    const { data: newValue, error: createError } = await supabase
      .from("configuration_values")
      .insert({
        configuration_type_id: id,
        value: value.trim(),
        label: label.trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        color: color || null,
        sort_order: sort_order || 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error("[API] Error creating configuration value:", createError)
      return NextResponse.json(
        { 
          success: false, 
          error: "Error al crear el valor de configuraci n",
          details: createError instanceof Error ? createError.message : String(createError)
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data: newValue 
    })

  } catch (error) {
    console.error("[API] Unexpected error in POST /api/configurations/[id]/values:", error)
    return NextResponse.json({ 
      success: false,
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
