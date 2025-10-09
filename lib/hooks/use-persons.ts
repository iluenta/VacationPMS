"use client"

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useCurrentTenant } from '@/lib/hooks/use-current-tenant'

// Types
export interface Person {
  id: string
  tenantId: string
  personTypeId: string
  firstName: string | null
  lastName: string | null
  businessName: string | null
  identificationType: 'DNI' | 'CIF' | 'NIE' | 'PASSPORT'
  identificationNumber: string
  personCategory: 'PHYSICAL' | 'LEGAL'
  isActive: boolean
  createdAt: string
  updatedAt: string
  fullName: string
  displayName: string
  identificationDisplay: string
  primaryContact?: {
    id: string
    contactName: string
    phone: string | null
    email: string | null
    position: string | null
    isPrimary: boolean
    isActive: boolean
  }
}

export interface ContactInfo {
  id: string
  personId: string
  tenantId: string
  contactName: string
  phone: string | null
  email: string | null
  position: string | null
  isPrimary: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  displayName: string
  contactDisplay: string
  hasPhone: boolean
  hasEmail: boolean
}

export interface FiscalAddress {
  id: string
  personId: string
  tenantId: string
  street: string
  number: string | null
  floor: string | null
  door: string | null
  postalCode: string
  city: string
  province: string | null
  country: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  fullAddress: string
  shortAddress: string
  location: string
  isInSpain: boolean
}

export interface CreatePersonRequest {
  firstName?: string
  lastName?: string
  businessName?: string
  identificationType: 'DNI' | 'CIF' | 'NIE' | 'PASSPORT'
  identificationNumber: string
  personCategory: 'PHYSICAL' | 'LEGAL'
  personTypeId: string
  isActive?: boolean
}

export interface UpdatePersonRequest {
  firstName?: string
  lastName?: string
  businessName?: string
  identificationType?: 'DNI' | 'CIF' | 'NIE' | 'PASSPORT'
  identificationNumber?: string
  isActive?: boolean
}

export interface CreateContactInfoRequest {
  contactName: string
  phone?: string
  email?: string
  position?: string
  isPrimary?: boolean
}

export interface CreateFiscalAddressRequest {
  street: string
  number?: string
  floor?: string
  door?: string
  postalCode: string
  city: string
  province?: string
  country?: string
}

export interface PersonFilters {
  name?: string
  identificationNumber?: string
  personTypeId?: string
  category?: 'PHYSICAL' | 'LEGAL'
  isActive?: boolean
  limit?: number
  offset?: number
}

export function usePersons() {
  const { profile } = useAuth()
  const { currentTenant } = useCurrentTenant()
  const [persons, setPersons] = useState<Person[]>([])
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [contacts, setContacts] = useState<ContactInfo[]>([])
  const [fiscalAddress, setFiscalAddress] = useState<FiscalAddress | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // Obtener tenant_id del tenant actual (para admins usa selectedTenant, para usuarios regulares usa su tenant)
  const tenantId = currentTenant?.id || profile?.tenant_id || '00000000-0000-0000-0000-000000000001'

  /**
   * Fetch personas con filtros
   */
  const fetchPersons = useCallback(async (filters?: PersonFilters) => {
    try {
      setLoading(true)
      setError(null)

      // Construir query params
      const params = new URLSearchParams()
      params.append('tenant_id', tenantId)
      
      if (filters?.name) params.append('name', filters.name)
      if (filters?.identificationNumber) params.append('identification_number', filters.identificationNumber)
      if (filters?.personTypeId) params.append('person_type_id', filters.personTypeId)
      if (filters?.category) params.append('category', filters.category)
      if (filters?.isActive !== undefined) params.append('is_active', String(filters.isActive))
      params.append('limit', String(filters?.limit || 50))
      params.append('offset', String(filters?.offset || 0))

      const url = `/api/persons-v2?${params.toString()}`
      
      console.log('📡 [FRONTEND] Fetching persons...', { url, tenantId, filters })
      
      const response = await fetch(url)

      console.log('📡 [FRONTEND] Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [FRONTEND] Error response:', errorText)
        throw new Error('Error al obtener personas de la base de datos')
      }

      const result = await response.json()
      
      console.log('📡 [FRONTEND] Response data:', {
        success: result.success,
        personsCount: result.persons?.length || 0,
        total: result.total,
        page: result.page,
        hasMore: result.hasMore,
        error: result.error
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido')
      }

      setPersons(result.persons || [])
      setTotal(result.total || 0)
      setPage(result.page || 1)
      setHasMore(result.hasMore || false)
      
      console.log('✅ [FRONTEND] Personas cargadas:', result.persons?.length || 0)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  /**
   * Obtener persona por ID
   */
  const fetchPersonById = useCallback(async (personId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/persons-v2/${personId}?tenant_id=${tenantId}`)

      if (!response.ok) {
        throw new Error('Error al obtener persona')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido')
      }

      setSelectedPerson(result.data)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  /**
   * Crear nueva persona
   */
  const createPerson = useCallback(async (data: CreatePersonRequest) => {
    try {
      setLoading(true)
      setError(null)

      // Agregar header con tenant seleccionado si existe
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (currentTenant?.id) {
        headers['x-tenant-id'] = currentTenant.id
      }

      const response = await fetch('/api/persons-v2', {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear persona')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido')
      }

      // Refrescar lista
      await fetchPersons()

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchPersons])

  /**
   * Actualizar persona
   */
  const updatePerson = useCallback(async (personId: string, data: UpdatePersonRequest) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/persons-v2/${personId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar persona')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido')
      }

      // Refrescar lista
      await fetchPersons()

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchPersons])

  /**
   * Eliminar persona
   */
  const deletePerson = useCallback(async (personId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/persons-v2/${personId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar persona')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido')
      }

      // Refrescar lista
      await fetchPersons()

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchPersons])

  /**
   * Obtener contactos de una persona
   */
  const fetchContacts = useCallback(async (personId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/persons-v2/${personId}/contacts?tenant_id=${tenantId}`)

      if (!response.ok) {
        throw new Error('Error al obtener contactos')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido')
      }

      setContacts(result.data.contactInfos)
      return result.data.contactInfos
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  /**
   * Crear contacto para persona
   */
  const createContact = useCallback(async (personId: string, data: CreateContactInfoRequest) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/persons-v2/${personId}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear contacto')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido')
      }

      // Refrescar contactos
      await fetchContacts(personId)

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchContacts])

  /**
   * Obtener dirección fiscal de persona
   */
  const fetchFiscalAddress = useCallback(async (personId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/persons-v2/${personId}/fiscal-address?tenant_id=${tenantId}`)

      if (!response.ok) {
        throw new Error('Error al obtener dirección fiscal')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido')
      }

      setFiscalAddress(result.data)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  /**
   * Crear dirección fiscal para persona
   */
  const createFiscalAddress = useCallback(async (personId: string, data: CreateFiscalAddressRequest) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/persons-v2/${personId}/fiscal-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear dirección fiscal')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido')
      }

      setFiscalAddress(result.data)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  // Efecto para refrescar personas cuando cambia el tenant
  useEffect(() => {
    if (tenantId) {
      // Limpiar datos anteriores
      setPersons([])
      setSelectedPerson(null)
      setContacts([])
      setFiscalAddress(null)
      setError(null)
      setTotal(0)
      setPage(1)
      setHasMore(false)
      
      // Cargar personas del nuevo tenant
      fetchPersons({ limit: 50, offset: 0 })
    }
  }, [tenantId, fetchPersons])

  return {
    // State
    persons,
    selectedPerson,
    contacts,
    fiscalAddress,
    loading,
    error,
    total,
    page,
    hasMore,
    
    // Actions
    fetchPersons,
    fetchPersonById,
    createPerson,
    updatePerson,
    deletePerson,
    fetchContacts,
    createContact,
    fetchFiscalAddress,
    createFiscalAddress,
    setSelectedPerson,
    setError
  }
}
