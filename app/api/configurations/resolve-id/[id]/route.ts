import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Check if it's already a UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ data: id })
    }

    // If it's a number, try to find the corresponding configuration by numeric_id
    if (/^\d+$/.test(id)) {
      const numericId = parseInt(id, 10)
      
      // First try to find by numeric_id if the column exists
      const { data: config, error } = await supabase
        .from('configuration_types')
        .select('id, numeric_id')
        .or(`numeric_id.eq.${numericId},id.eq.${id}`)
        .single()

      if (error || !config) {
        return NextResponse.json(
          { error: `Tipo de configuración con ID ${id} no encontrado` },
          { status: 404 }
        )
      }
      
      console.log(`[resolve-id] Resolved ID ${id} to ${config.id}`)
      return NextResponse.json({ data: config.id })
    }

    return NextResponse.json(
      { error: "ID de configuración no válido" },
      { status: 400 }
    )
  } catch (error) {
    console.error("[API] Error resolving configuration ID:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
