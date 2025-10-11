"use client"

import { useState, useEffect, useCallback } from "react"
import { useMemoizedTenant } from "./use-memoized-tenant"
import type { ConfigurationType } from "@/types/configuration"

export interface PersonType {
  id: string
  name: string
}

export function usePersonTypes() {
  const { currentTenant, isAdmin, tenantId } = useMemoizedTenant()
  const [personTypes, setPersonTypes] = useState<PersonType[]>([])
  const [loading, setLoading] = useState(true)
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
        .filter((type: ConfigurationType) => VALID_PERSON_TYPES.includes(type.name))
        .map((type: ConfigurationType) => ({
          id: type.id,
          name: type.name
        }))

      setPersonTypes(filteredTypes)
    } catch (err) {
      console.error('[usePersonTypes] Error fetching person types:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [tenantId, isAdmin]) // Usar tenantId memoizado

  // Cargar tipos cuando cambie el tenant - solo una vez cuando se monta el componente
  useEffect(() => {
    // Si no hay tenant y no es admin, no cargar
    if (!currentTenant && !isAdmin) {
      setLoading(false)
      setError('No tienes un tenant asignado. Contacta al administrador.')
      return
    }

    // Si hay tenant o es admin, cargar tipos de persona
    fetchPersonTypes()
  }, [tenantId, isAdmin]) // Usar tenantId memoizado

  return {
    personTypes,
    loading,
    error,
    refetch: fetchPersonTypes,
  }
}

