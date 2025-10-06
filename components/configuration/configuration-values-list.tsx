"use client"

import { useState } from "react"
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
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  ArrowLeft,
  List
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
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Valores de {configurationType.name}</CardTitle>
              <CardDescription>
                Gestiona los valores para este tipo de configuración
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando valores...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Valores de {configurationType.name}</CardTitle>
              <CardDescription>
                Gestiona los valores para este tipo de configuración
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  {configurationType.icon && (() => {
                    const IconComponent = getIconComponent(configurationType.icon)
                    return IconComponent ? (
                      <IconComponent 
                        className="h-5 w-5" 
                        style={{ color: configurationType.color }}
                      />
                    ) : null
                  })()}
                  <span>Valores de {configurationType.name}</span>
                </CardTitle>
                <CardDescription>
                  {configurationType.description || "Gestiona los valores para este tipo de configuración"}
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Valor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {values.length === 0 ? (
            <div className="text-center py-8">
              <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay valores</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer valor para este tipo de configuración
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Valor
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {values.map((value) => {
                const IconComponent = getIconComponent(value.icon || configurationType.icon || "")

                return (
                  <div
                    key={value.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {IconComponent && (
                        <div 
                          className="p-2 rounded-md"
                          style={{ 
                            backgroundColor: (value.color || configurationType.color) ? 
                              `${(value.color || configurationType.color)}20` : undefined 
                          }}
                        >
                          <IconComponent 
                            className="h-4 w-4" 
                            style={{ color: value.color || configurationType.color }}
                          />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{value.label}</h3>
                          <Badge variant="outline" className="text-xs">
                            {value.value}
                          </Badge>
                          {!value.is_active && (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                        </div>
                        {value.description && (
                          <p className="text-sm text-muted-foreground">
                            {value.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setEditingValue(value)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleToggleActive(value)}
                          >
                            {value.is_active ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Activar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(value.id)}
                            className="text-destructive"
                            disabled={deletingId === value.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingId === value.id ? "Eliminando..." : "Eliminar"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
