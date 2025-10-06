"use client"

import { useState, useEffect, useCallback } from "react"
import { useCurrentTenant } from "./use-current-tenant"
import type { 
  ConfigurationType, 
  ConfigurationValue, 
  CreateConfigurationTypeRequest,
  UpdateConfigurationTypeRequest,
  CreateConfigurationValueRequest,
  UpdateConfigurationValueRequest,
  ApiResponse 
} from "@/types/configuration"

export function useConfigurations() {
  const { currentTenant, isAdmin } = useCurrentTenant()
  const [configurations, setConfigurations] = useState<ConfigurationType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar configuraciones
  const fetchConfigurations = useCallback(async () => {
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
      const result: ApiResponse<ConfigurationType[]> = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar configuraciones')
      }

      setConfigurations(result.data || [])
    } catch (err) {
      console.error('[useConfigurations] Error fetching configurations:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [currentTenant, isAdmin])

  // Crear configuración
  const createConfiguration = useCallback(async (data: CreateConfigurationTypeRequest) => {
    try {
      const requestData = {
        ...data,
        ...(isAdmin && currentTenant ? { tenant_id: currentTenant.id } : {})
      }

      // Agregar header con tenant seleccionado si existe
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (currentTenant?.id) {
        headers['x-tenant-id'] = currentTenant.id
      }
      
      const response = await fetch('/api/configurations', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData),
      })

      const result: ApiResponse<ConfigurationType> = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear configuración')
      }

      // Actualizar lista local
      await fetchConfigurations()
      return result.data
    } catch (err) {
      console.error('[useConfigurations] Error creating configuration:', err)
      throw err
    }
  }, [isAdmin, currentTenant, fetchConfigurations])

  // Actualizar configuración
  const updateConfiguration = useCallback(async (id: string, data: UpdateConfigurationTypeRequest) => {
    try {
      const response = await fetch(`/api/configurations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result: ApiResponse<ConfigurationType> = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar configuración')
      }

      // Actualizar lista local
      await fetchConfigurations()
      return result.data
    } catch (err) {
      console.error('[useConfigurations] Error updating configuration:', err)
      throw err
    }
  }, [fetchConfigurations])

  // Eliminar configuración
  const deleteConfiguration = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/configurations/${id}`, {
        method: 'DELETE',
      })

      const result: ApiResponse<void> = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar configuración')
      }

      // Actualizar lista local
      await fetchConfigurations()
    } catch (err) {
      console.error('[useConfigurations] Error deleting configuration:', err)
      throw err
    }
  }, [fetchConfigurations])

  // Cargar configuraciones cuando cambie el tenant
  useEffect(() => {
    // Si no hay tenant y no es admin, no cargar
    if (!currentTenant && !isAdmin) {
      setLoading(false)
      setError('No tienes un tenant asignado. Contacta al administrador.')
      return
    }

    // Si hay tenant o es admin, cargar configuraciones
    fetchConfigurations()
  }, [fetchConfigurations, currentTenant, isAdmin])

  return {
    configurations,
    loading,
    error,
    refetch: fetchConfigurations,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
  }
}

export function useConfigurationValues(configurationTypeId: string | null) {
  const [values, setValues] = useState<ConfigurationValue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar valores de configuración
  const fetchValues = useCallback(async () => {
    if (!configurationTypeId) {
      setValues([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Primero, resolver el ID de configuración
      const resolveResponse = await fetch(`/api/configurations/resolve-id/${configurationTypeId}`)
      const resolveData = await resolveResponse.json()
      
      if (!resolveResponse.ok || !resolveData.data) {
        // Error controlado - no lanzar excepción, solo establecer el estado
        console.warn('[useConfigurationValues] No se pudo resolver el ID:', resolveData.error)
        setError(resolveData.error || 'No se pudo resolver el ID de configuración')
        setValues([])
        setLoading(false)
        return
      }

      // Luego cargar los valores con el ID resuelto
      const response = await fetch(`/api/configurations/${resolveData.data}/values`)
      const result: ApiResponse<ConfigurationValue[]> = await response.json()

      if (!response.ok) {
        // Error controlado - no lanzar excepción, solo establecer el estado
        console.warn('[useConfigurationValues] Error al cargar valores:', result.error)
        setError(result.error || 'Error al cargar valores')
        setValues([])
        setLoading(false)
        return
      }
      
      setValues(result.data || [])
      setLoading(false)
    } catch (err) {
      // Este catch solo captura errores de red o errores inesperados
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión'
      console.error('[useConfigurationValues] Error inesperado:', err)
      setError(errorMessage)
      setValues([])
      setLoading(false)
    }
  }, [configurationTypeId])

  // Crear nuevo valor
  const createValue = useCallback(async (data: CreateConfigurationValueRequest) => {
    if (!configurationTypeId) throw new Error('ID de configuración requerido')

    try {
      // Primero, resolver el ID de configuración
      const resolveResponse = await fetch(`/api/configurations/resolve-id/${configurationTypeId}`)
      const resolveData = await resolveResponse.json()
      
      if (!resolveResponse.ok || !resolveData.data) {
        throw new Error(resolveData.error || 'No se pudo resolver el ID de configuración')
      }

      // Luego crear el valor con el ID resuelto
      const response = await fetch(`/api/configurations/${resolveData.data}/values`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result: ApiResponse<ConfigurationValue> = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear valor')
      }

      // Actualizar lista local
      await fetchValues()
      return result.data
    } catch (err) {
      console.error('[useConfigurationValues] Error al crear valor:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      throw err
    }
  }, [configurationTypeId, fetchValues])

  // Actualizar valor
  const updateValue = useCallback(async (valueId: string, data: UpdateConfigurationValueRequest) => {
    if (!configurationTypeId) throw new Error('ID de configuración requerido')

    try {
      // Primero, resolver el ID de configuración
      const resolveResponse = await fetch(`/api/configurations/resolve-id/${configurationTypeId}`)
      const resolveData = await resolveResponse.json()
      
      if (!resolveResponse.ok || !resolveData.data) {
        throw new Error(resolveData.error || 'No se pudo resolver el ID de configuración')
      }

      // Luego actualizar el valor con el ID resuelto
      const updateResponse = await fetch(`/api/configurations/${resolveData.data}/values/${valueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result: ApiResponse<ConfigurationValue> = await updateResponse.json()

      if (!updateResponse.ok) {
        throw new Error(result.error || 'Error al actualizar valor')
      }

      // Actualizar lista local
      await fetchValues()
      return result.data
    } catch (err) {
      console.error('[useConfigurationValues] Error al actualizar valor:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      throw err
    }
  }, [configurationTypeId, fetchValues])

  // Eliminar valor
  const deleteValue = useCallback(async (valueId: string) => {
    if (!configurationTypeId) throw new Error('ID de configuración requerido')

    try {
      // Primero, resolver el ID de configuración
      const resolveResponse = await fetch(`/api/configurations/resolve-id/${configurationTypeId}`)
      const resolveData = await resolveResponse.json()
      
      if (!resolveResponse.ok || !resolveData.data) {
        throw new Error(resolveData.error || 'No se pudo resolver el ID de configuración')
      }

      const response = await fetch(`/api/configurations/${resolveData.data}/values/${valueId}`, {
        method: 'DELETE',
      })

      const result: ApiResponse<void> = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar valor')
      }

      // Actualizar lista local
      await fetchValues()
    } catch (err) {
      console.error('[useConfigurationValues] Error al eliminar valor:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      throw err
    }
  }, [configurationTypeId, fetchValues])

  // Cargar valores cuando cambie el ID de configuración
  useEffect(() => {
    fetchValues()
  }, [fetchValues])

  return {
    values,
    loading,
    error,
    refetch: fetchValues,
    createValue,
    updateValue,
    deleteValue,
  }
}
