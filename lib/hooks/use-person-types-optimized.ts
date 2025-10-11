"use client"

import { useState, useEffect, useCallback } from "react"
import { useMemoizedTenant } from "./use-memoized-tenant"

export interface PersonType {
  id: string
  name: string
}

// Cache global para evitar llamadas repetidas
let personTypesCache: PersonType[] | null = null
let lastTenantId: string | null = null

export function usePersonTypesOptimized() {
  const { currentTenant, isAdmin, tenantId } = useMemoizedTenant()
  const [personTypes, setPersonTypes] = useState<PersonType[]>(personTypesCache || [])
  const [loading, setLoading] = useState(!personTypesCache)
  const [error, setError] = useState<string | null>(null)

  // Definir los tipos de persona válidos
  const VALID_PERSON_TYPES = [
    'Cliente Propiedad',
    'Cliente Herramienta', 
    'Plataforma Distribución',
    'Proveedor',
    'Usuario Plataforma'
  ]

  // Cargar tipos de persona
  const fetchPersonTypes = useCallback(async () => {
    if (!currentTenant && !isAdmin) {
      return
    }

    // Si ya tenemos datos en cache para este tenant, usar cache
    if (personTypesCache && lastTenantId === tenantId) {
      setPersonTypes(personTypesCache)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Agregar header con tenant seleccionado si existe
      const headers: HeadersInit = {}
      if (currentTenant?.id) {
        headers['x-tenant-id'] = currentTenant.id
      }
      
      const response = await fetch('/api/configurations', { headers })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar tipos de persona')
      }

      // Filtrar solo los tipos de persona válidos
      const filteredTypes = (result.data || [])
        .filter((type: any) => VALID_PERSON_TYPES.includes(type.name))
        .map((type: any) => ({
          id: type.id,
          name: type.name
        }))

      // Actualizar cache
      personTypesCache = filteredTypes
      lastTenantId = tenantId || null

      setPersonTypes(filteredTypes)
    } catch (err) {
      console.error('[usePersonTypesOptimized] Error fetching person types:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [tenantId, isAdmin, currentTenant?.id])

  // Cargar tipos cuando cambie el tenant - solo una vez cuando se monta el componente
  useEffect(() => {
    // Si no hay tenant y no es admin, no cargar
    if (!currentTenant && !isAdmin) {
      setLoading(false)
      setError('No tienes un tenant asignado. Contacta al administrador.')
      return
    }

    // Si ya tenemos datos en cache, no cargar
    if (personTypesCache && lastTenantId === tenantId) {
      setLoading(false)
      return
    }

    // Si hay tenant o es admin, cargar tipos de persona
    fetchPersonTypes()
  }, [tenantId, isAdmin, fetchPersonTypes])

  return {
    personTypes,
    loading,
    error,
    refetch: fetchPersonTypes,
  }
}
