import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { 
  GetConfigurationsSchema, 
  CreateConfigurationTypeSchema,
  validateQueryParams,
  validateRequestBody,
  validateHeaders,
  TenantHeaderSchema,
  createValidationErrorResponse
} from "@/lib/validations/configurations"
import { auditLogger } from "@/lib/logging/logger"
import { getClientInfo } from "@/lib/logging/edge-logger"

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

    // Validar query parameters
    let queryParams
    try {
      queryParams = validateQueryParams(GetConfigurationsSchema, request.nextUrl.searchParams)
    } catch (error) {
      const clientInfo = getClientInfo(request)
      return NextResponse.json(createValidationErrorResponse(error as any, {
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        endpoint: '/api/configurations',
        payload: Object.fromEntries(request.nextUrl.searchParams.entries())
      }), { status: 400 })
    }

    // Validar headers de tenant (para admins)
    let tenantHeaders
    try {
      tenantHeaders = validateHeaders(TenantHeaderSchema, {
        'x-tenant-id': request.headers.get('x-tenant-id') || undefined
      })
    } catch (error) {
      return NextResponse.json(createValidationErrorResponse(error as any), { status: 400 })
    }

    // Si es admin, obtener el tenant del header o query param
    let tenantId = profile.tenant_id
    if (profile.is_admin) {
      const selectedTenantId = tenantHeaders['x-tenant-id'] || queryParams.tenant_id
      if (selectedTenantId) {
        tenantId = selectedTenantId
      }
    }

    // Construir query base para configuraciones
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
        tenant_id
      `)

    // Solo filtrar por tenant_id si no es null
    if (tenantId) {
      query = query.eq("tenant_id", tenantId)
    } else {
      // Si no hay tenant_id, filtrar por registros que tampoco tengan tenant_id
      query = query.is("tenant_id", null)
    }

    // Aplicar filtros de query parameters
    if (queryParams.is_active !== undefined) {
      query = query.eq("is_active", queryParams.is_active === "true")
    }

    // Aplicar paginación
    const { data: configurations, error } = await query
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .range(queryParams.offset, queryParams.offset + queryParams.limit - 1)

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
      count: configurations?.length || 0,
      pagination: {
        limit: queryParams.limit,
        offset: queryParams.offset,
        hasMore: configurations?.length === queryParams.limit
      }
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

    // Validar body del request
    let validatedData
    let requestBody
    try {
      requestBody = await request.json()
      validatedData = validateRequestBody(CreateConfigurationTypeSchema, requestBody)
    } catch (error) {
      const clientInfo = getClientInfo(request)
      
      // Verificar si es un ZodError
      if (error && typeof error === 'object' && 'errors' in error) {
        return NextResponse.json(createValidationErrorResponse(error as any, {
          ip: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          endpoint: '/api/configurations',
          payload: requestBody || {}
        }), { status: 400 })
      } else {
        // Si no es un ZodError, crear una respuesta de error genérica
        return NextResponse.json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 400 })
      }
    }

    // Validar headers de tenant (para admins)
    let tenantHeaders
    try {
      tenantHeaders = validateHeaders(TenantHeaderSchema, {
        'x-tenant-id': request.headers.get('x-tenant-id') || undefined
      })
    } catch (error) {
      return NextResponse.json(createValidationErrorResponse(error as any), { status: 400 })
    }

    // Si es admin, obtener el tenant del header o query param
    let tenant_id = profile.tenant_id
    if (profile.is_admin) {
      const selectedTenantId = tenantHeaders['x-tenant-id'] || 
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
        name: validatedData.name,
        description: validatedData.description || null,
        icon: validatedData.icon,
        color: validatedData.color,
        sort_order: validatedData.sort_order,
        is_active: validatedData.is_active
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

    // Logear evento de auditoría
    auditLogger.resourceCreated({
      userId: user.id,
      resourceType: 'configuration_type',
      resourceId: configuration.id,
      details: {
        name: configuration.name,
        tenant_id: tenant_id,
        created_at: configuration.created_at
      }
    })

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
