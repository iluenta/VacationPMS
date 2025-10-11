import { useMemo } from 'react'
import { useCurrentTenant } from './use-current-tenant'

/**
 * Hook que memoiza los valores del tenant para evitar re-renders innecesarios
 * Solo cambia cuando realmente cambia el ID del tenant
 */
export function useMemoizedTenant() {
  const { currentTenant, isAdmin, hasTenant } = useCurrentTenant()
  
  const memoizedTenant = useMemo(() => {
    return {
      currentTenant,
      isAdmin,
      hasTenant,
      tenantId: currentTenant?.id
    }
  }, [currentTenant?.id, isAdmin, hasTenant])
  
  return memoizedTenant
}
