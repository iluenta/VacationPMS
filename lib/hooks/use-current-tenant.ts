import { useAuth } from "@/lib/auth-context"

/**
 * Hook personalizado para obtener el tenant actual
 * Para administradores: retorna el tenant seleccionado
 * Para usuarios regulares: retorna su tenant asignado
 */
export function useCurrentTenant() {
  const { profile, tenant, selectedTenant } = useAuth()
  
  // Determinar qué tenant usar
  const currentTenant = profile?.is_admin ? selectedTenant : tenant
  
  return {
    currentTenant,
    isAdmin: profile?.is_admin || false,
    hasTenant: !!currentTenant
  }
}