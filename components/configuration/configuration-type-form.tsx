"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { IconPicker } from "@/components/ui/icon-picker"
import { ColorPicker } from "@/components/ui/color-picker"
import { Loader2, User, Settings, Palette, Hash } from "lucide-react"
import type { 
  ConfigurationType, 
  CreateConfigurationTypeRequest,
  UpdateConfigurationTypeRequest 
} from "@/types/configuration"

const configurationTypeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "El nombre no puede exceder 100 caracteres"),
  description: z.string().optional(),
  icon: z.string().min(1, "El icono es requerido").max(50, "El icono no puede exceder 50 caracteres"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Color debe ser un código hexadecimal válido (ej: #3B82F6)"),
  sort_order: z.number().min(0).max(999).default(0),
  is_active: z.boolean().default(true),
})

type ConfigurationTypeFormData = z.infer<typeof configurationTypeSchema>

interface ConfigurationTypeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  configuration?: ConfigurationType | null
  onSubmit: (data: CreateConfigurationTypeRequest | UpdateConfigurationTypeRequest) => Promise<void>
  loading?: boolean
}

export function ConfigurationTypeForm({
  open,
  onOpenChange,
  configuration,
  onSubmit,
  loading = false
}: ConfigurationTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ConfigurationTypeFormData>({
    resolver: zodResolver(configurationTypeSchema),
    defaultValues: {
      name: configuration?.name || "",
      description: configuration?.description || "",
      icon: configuration?.icon || "settings",
      color: configuration?.color || "#3B82F6",
      sort_order: configuration?.sort_order || 0,
      is_active: configuration?.is_active ?? true,
    },
  })

  const handleSubmit = async (data: ConfigurationTypeFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen)
      if (!newOpen) {
        form.reset()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {configuration ? "Editar Tipo de Configuración" : "Nuevo Tipo de Configuración"}
          </DialogTitle>
          <DialogDescription>
            {configuration 
              ? "Modifica los datos del tipo de configuración"
              : "Crea un nuevo tipo de configuración para organizar valores"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Nombre *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input 
                            placeholder="ej. Tipo de Usuario" 
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Nombre único para este tipo de configuración
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Orden</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="0"
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Orden de visualización (menor número = más arriba)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-sm font-medium">Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción opcional del tipo de configuración"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Descripción opcional del tipo de configuración
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Icono</FormLabel>
                      <FormControl>
                        <IconPicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Seleccionar icono"
                        />
                      </FormControl>
                      <FormDescription>
                        Icono que representará este tipo de configuración
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Color</FormLabel>
                      <FormControl>
                        <ColorPicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Seleccionar color"
                        />
                      </FormControl>
                      <FormDescription>
                        Color que representará este tipo de configuración
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">Activo</FormLabel>
                      <FormDescription>
                        Los tipos inactivos no se mostrarán en las listas
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-primary"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
                className="bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || loading}
                variant="default"
                style={{
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  border: 'none'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {configuration ? "Actualizando..." : "Creando..."}
                  </>
                ) : (
                  configuration ? "Actualizar" : "Crear"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
