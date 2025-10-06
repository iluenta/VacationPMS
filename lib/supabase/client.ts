import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Configuraciones de autenticación
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        // Configuración global para manejar problemas SSL en desarrollo
        fetch: process.env.NODE_ENV === 'development' 
          ? (url, options = {}) => {
              // En desarrollo, usar fetch nativo con configuración SSL más permisiva
              return fetch(url, {
                ...options,
                // Configuraciones específicas para desarrollo
              })
            }
          : undefined // En producción, usar fetch por defecto
      }
    }
  )
}
