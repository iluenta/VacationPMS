"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Settings,
  ChevronRight,
  AlertCircle,
  Search,
  X
} from "lucide-react"
import { ConfigurationTypeForm } from "./configuration-type-form"
import { useConfigurations } from "@/lib/hooks/use-configurations"
import { useCurrentTenant } from "@/lib/hooks/use-current-tenant"
import { toast } from "sonner"
import type { ConfigurationType } from "@/types/configuration"

// Función para obtener el componente de icono
const getIconComponent = (iconName: string) => {
  if (!iconName) return null
  
  try {
    const { [iconName]: IconComponent } = require('lucide-react')
    return IconComponent
  } catch {
    return null
  }
}

interface ConfigurationTypesListProps {
  onSelectConfiguration?: (configuration: ConfigurationType) => void
  selectedConfigurationId?: string
}

export function ConfigurationTypesList({ 
  onSelectConfiguration, 
  selectedConfigurationId 
}: ConfigurationTypesListProps) {
  const { currentTenant } = useCurrentTenant()
  const { 
    configurations, 
    loading, 
    error, 
    createConfiguration, 
    updateConfiguration, 
    deleteConfiguration 
  } = useConfigurations()

  const [showForm, setShowForm] = useState(false)
  const [editingConfiguration, setEditingConfiguration] = useState<ConfigurationType | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredConfigurations, setFilteredConfigurations] = useState<ConfigurationType[]>([])

  // Filtrar configuraciones cuando cambie la búsqueda o las configuraciones
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConfigurations(configurations)
    } else {
      const filtered = configurations.filter(config => 
        config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (config.description && config.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredConfigurations(filtered)
    }
  }, [configurations, searchQuery])

  const handleCreate = async (data: any) => {
    try {
      await createConfiguration(data)
      toast.success("Tipo de configuración creado exitosamente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear configuración")
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editingConfiguration) return

    try {
      await updateConfiguration(editingConfiguration.id, data)
      toast.success("Tipo de configuración actualizado exitosamente")
      setEditingConfiguration(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar configuración")
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteConfiguration(id)
      toast.success("Tipo de configuración eliminado exitosamente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar configuración")
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (configuration: ConfigurationType) => {
    try {
      await updateConfiguration(configuration.id, {
        is_active: !configuration.is_active
      })
      toast.success(`Tipo de configuración ${configuration.is_active ? 'desactivado' : 'activado'}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar configuración")
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="p-6 border-b bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Tipos de Configuración</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona los tipos de configuración de {currentTenant?.name || "tu organización"}
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">Cargando configuraciones...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="p-6 border-b bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Tipos de Configuración</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona los tipos de configuración de {currentTenant?.name || "tu organización"}
          </p>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-red-600 font-semibold mb-4">{error}</p>
            <div className="space-y-2 mb-6">
              <p className="text-sm text-gray-500">
                Si el error persiste, verifica que:
              </p>
              <ul className="text-sm text-gray-500 text-left max-w-md mx-auto space-y-1">
                <li>• Estés autenticado correctamente</li>
                <li>• Tengas un tenant asignado</li>
                <li>• Las tablas de configuración estén creadas</li>
              </ul>
            </div>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Reintentar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard'}
                className="border-gray-300 hover:bg-gray-50"
              >
                Volver al Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="p-6 border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Tipos de Configuración</h2>
              <p className="text-sm text-gray-500 mt-1">
                Gestiona los tipos de configuración de {currentTenant?.name || "tu organización"}
              </p>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Tipo
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Buscador */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar configuraciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {filteredConfigurations.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Settings className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay tipos de configuración</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Crea tu primer tipo de configuración para comenzar a organizar valores
              </p>
              <Button 
                onClick={() => setShowForm(true)}
                className="btn-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Tipo
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConfigurations.map((configuration) => {
                const IconComponent = getIconComponent(configuration.icon || "")
                const isSelected = selectedConfigurationId === configuration.id

                return (
                  <div
                    key={configuration.id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? "bg-primary/10 border-primary/20 shadow-sm" 
                        : "hover:bg-gray-50 hover:border-gray-300"
                    }`}
                    onClick={() => onSelectConfiguration?.(configuration)}
                  >
                    <div className="flex items-center space-x-3">
                      {IconComponent && (
                        <div 
                          className="p-2 rounded-lg"
                          style={{ 
                            backgroundColor: configuration.color ? `${configuration.color}20` : '#f3f4f6' 
                          }}
                        >
                          <IconComponent 
                            className="h-5 w-5" 
                            style={{ color: configuration.color || '#6b7280' }}
                          />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">{configuration.name}</h3>
                          {!configuration.is_active && (
                            <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                          )}
                        </div>
                        {configuration.description && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            {configuration.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Acciones visibles */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectConfiguration?.(configuration)}
                        className="hover:bg-gray-100"
                        title="Ver Valores"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingConfiguration(configuration)}
                        className="hover:bg-gray-100"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(configuration)}
                        className="hover:bg-gray-100"
                        title={configuration.is_active ? "Desactivar" : "Activar"}
                      >
                        {configuration.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(configuration.id)}
                        disabled={deletingId === configuration.id}
                        className="hover:bg-gray-100 text-red-600 hover:text-red-700"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Formulario para crear/editar */}
      <ConfigurationTypeForm
        open={showForm || !!editingConfiguration}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false)
            setEditingConfiguration(null)
          }
        }}
        configuration={editingConfiguration}
        onSubmit={editingConfiguration ? handleUpdate : handleCreate}
      />
    </>
  )
}
