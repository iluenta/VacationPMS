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
  ArrowLeft,
  List,
  AlertCircle,
  Search,
  X
} from "lucide-react"
import { ConfigurationValueForm } from "./configuration-value-form"
import { useConfigurationValues } from "@/lib/hooks/use-configurations"
import { toast } from "sonner"
import type { ConfigurationType, ConfigurationValue } from "@/types/configuration"

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

interface ConfigurationValuesListProps {
  configurationType: ConfigurationType
  onBack: () => void
}

export function ConfigurationValuesList({ 
  configurationType, 
  onBack 
}: ConfigurationValuesListProps) {
  const { 
    values, 
    loading, 
    error, 
    createValue, 
    updateValue, 
    deleteValue 
  } = useConfigurationValues(configurationType.id)

  const [showForm, setShowForm] = useState(false)
  const [editingValue, setEditingValue] = useState<ConfigurationValue | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredValues, setFilteredValues] = useState<ConfigurationValue[]>([])

  // Filtrar valores cuando cambie la búsqueda o los valores
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredValues(values)
    } else {
      const filtered = values.filter(value => 
        value.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        value.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (value.description && value.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredValues(filtered)
    }
  }, [values, searchQuery])

  const handleCreate = async (data: any) => {
    try {
      await createValue(data)
      toast.success("Valor creado exitosamente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear valor")
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editingValue) return

    try {
      await updateValue(editingValue.id, data)
      toast.success("Valor actualizado exitosamente")
      setEditingValue(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar valor")
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteValue(id)
      toast.success("Valor eliminado exitosamente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar valor")
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (value: ConfigurationValue) => {
    try {
      await updateValue(value.id, {
        is_active: !value.is_active
      })
      toast.success(`Valor ${value.is_active ? 'desactivado' : 'activado'}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar valor")
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="p-6 border-b bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Valores de {configurationType.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Gestiona los valores para este tipo de configuración
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">Cargando valores...</p>
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
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Valores de {configurationType.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Gestiona los valores para este tipo de configuración
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-red-600 font-semibold mb-6">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              variant="default"
            >
              Reintentar
            </Button>
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
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center space-x-2">
                  {configurationType.icon && (() => {
                    const IconComponent = getIconComponent(configurationType.icon)
                    return IconComponent ? (
                      <IconComponent 
                        className="h-5 w-5" 
                        style={{ color: configurationType.color }}
                      />
                    ) : null
                  })()}
                  <h2 className="text-lg font-semibold text-gray-900">
                    Valores de {configurationType.name}
                  </h2>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {configurationType.description || "Gestiona los valores para este tipo de configuración"}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              variant="default"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Valor
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
                placeholder="Buscar valores..."
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

          {filteredValues.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <List className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay valores</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Crea tu primer valor para este tipo de configuración
              </p>
              <Button 
                onClick={() => setShowForm(true)}
                variant="default"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Valor
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredValues.map((value) => {
                const IconComponent = getIconComponent(value.icon || configurationType.icon || "")

                return (
                  <div
                    key={value.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      {IconComponent && (
                        <div 
                          className="p-2 rounded-lg"
                          style={{ 
                            backgroundColor: (value.color || configurationType.color) ? 
                              `${(value.color || configurationType.color)}20` : '#f3f4f6' 
                          }}
                        >
                          <IconComponent 
                            className="h-5 w-5" 
                            style={{ color: value.color || configurationType.color || '#6b7280' }}
                          />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">{value.label}</h3>
                          <Badge variant="outline" className="text-xs border-primary/20 text-primary bg-primary/10">
                            {value.value}
                          </Badge>
                          {!value.is_active && (
                            <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                          )}
                        </div>
                        {value.description && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            {value.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Acciones visibles */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingValue(value)}
                        className="hover:bg-gray-100"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(value)}
                        className="hover:bg-gray-100"
                        title={value.is_active ? "Desactivar" : "Activar"}
                      >
                        {value.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(value.id)}
                        disabled={deletingId === value.id}
                        className="hover:bg-gray-100 text-red-600 hover:text-red-700"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Formulario para crear/editar */}
      <ConfigurationValueForm
        open={showForm || !!editingValue}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false)
            setEditingValue(null)
          }
        }}
        value={editingValue}
        onSubmit={editingValue ? handleUpdate : handleCreate}
      />
    </>
  )
}

