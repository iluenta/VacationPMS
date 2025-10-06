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
  Settings,
  ChevronRight
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
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Configuración</CardTitle>
          <CardDescription>
            Gestiona los tipos de configuración de {currentTenant?.name || "tu organización"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando configuraciones...</p>
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
          <CardTitle>Tipos de Configuración</CardTitle>
          <CardDescription>
            Gestiona los tipos de configuración de {currentTenant?.name || "tu organización"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Si el error persiste, verifica que:
              </p>
              <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto">
                <li>• Estés autenticado correctamente</li>
                <li>• Tengas un tenant asignado</li>
                <li>• Las tablas de configuración estén creadas</li>
              </ul>
            </div>
            <div className="flex gap-2 justify-center mt-4">
              <Button onClick={() => window.location.reload()}>
                Reintentar
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                Volver al Dashboard
              </Button>
            </div>
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
            <div>
              <CardTitle>Tipos de Configuración</CardTitle>
              <CardDescription>
                Gestiona los tipos de configuración de {currentTenant?.name || "tu organización"}
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Tipo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {configurations.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay tipos de configuración</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer tipo de configuración para comenzar a organizar valores
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Tipo
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {configurations.map((configuration) => {
                const IconComponent = getIconComponent(configuration.icon || "")
                const isSelected = selectedConfigurationId === configuration.id

                return (
                  <div
                    key={configuration.id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? "bg-primary/5 border-primary" 
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => onSelectConfiguration?.(configuration)}
                  >
                    <div className="flex items-center space-x-3">
                      {IconComponent && (
                        <div 
                          className="p-2 rounded-md"
                          style={{ 
                            backgroundColor: configuration.color ? `${configuration.color}20` : undefined 
                          }}
                        >
                          <IconComponent 
                            className="h-4 w-4" 
                            style={{ color: configuration.color }}
                          />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{configuration.name}</h3>
                          {!configuration.is_active && (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                        </div>
                        {configuration.description && (
                          <p className="text-sm text-muted-foreground">
                            {configuration.description}
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
                          <DropdownMenuItem onClick={() => onSelectConfiguration?.(configuration)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Valores
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setEditingConfiguration(configuration)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleToggleActive(configuration)}
                          >
                            {configuration.is_active ? (
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
                            onClick={() => handleDelete(configuration.id)}
                            className="text-destructive"
                            disabled={deletingId === configuration.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingId === configuration.id ? "Eliminando..." : "Eliminar"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
