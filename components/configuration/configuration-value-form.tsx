"use client"

import { useState, useEffect } from "react"
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
import { Loader2 } from "lucide-react"
import type { 
  ConfigurationValue, 
  CreateConfigurationValueRequest,
  UpdateConfigurationValueRequest 
} from "@/types/configuration"

const configurationValueSchema = z.object({
  value: z.string().min(1, "El valor es requerido").max(100, "El valor no puede exceder 100 caracteres"),
  label: z.string().min(1, "La etiqueta es requerida").max(100, "La etiqueta no puede exceder 100 caracteres"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  sort_order: z.number().min(0).default(0),
  is_active: z.boolean().default(true),
})

type ConfigurationValueFormData = z.infer<typeof configurationValueSchema>

interface ConfigurationValueFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value?: ConfigurationValue | null
  onSubmit: (data: CreateConfigurationValueRequest | UpdateConfigurationValueRequest) => Promise<void>
  loading?: boolean
}

export function ConfigurationValueForm({
  open,
  onOpenChange,
  value,
  onSubmit,
  loading = false
}: ConfigurationValueFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ConfigurationValueFormData>({
    resolver: zodResolver(configurationValueSchema),
    defaultValues: {
      value: "",
      label: "",
      description: "",
      icon: "",
      color: "",
      sort_order: 0,
      is_active: true,
    },
  })

  // Actualizar los valores del formulario cuando cambia el valor
  useEffect(() => {
    if (value) {
      form.reset({
        value: value.value || "",
        label: value.label || "",
        description: value.description || "",
        icon: value.icon || "",
        color: value.color || "",
        sort_order: value.sort_order || 0,
        is_active: value.is_active ?? true,
      })
    } else {
      form.reset({
        value: "",
        label: "",
        description: "",
        icon: "",
        color: "",
        sort_order: 0,
        is_active: true,
      })
    }
  }, [value, form.reset, open])

  const handleSubmit = async (data: ConfigurationValueFormData) => {
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {value ? "Editar Valor" : "Nuevo Valor"}
          </DialogTitle>
          <DialogDescription>
            {value 
              ? "Modifica los datos del valor de configuración"
              : "Crea un nuevo valor para este tipo de configuración"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor *</FormLabel>
                  <FormControl>
                    <Input placeholder="ej. admin" {...field} />
                  </FormControl>
                  <FormDescription>
                    Valor único para este elemento (usado internamente)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etiqueta *</FormLabel>
                  <FormControl>
                    <Input placeholder="ej. Administrador" {...field} />
                  </FormControl>
                  <FormDescription>
                    Etiqueta que se mostrará al usuario
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción opcional del valor"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icono</FormLabel>
                  <FormControl>
                    <IconPicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccionar icono"
                    />
                  </FormControl>
                  <FormDescription>
                    Icono específico para este valor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <ColorPicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccionar color"
                    />
                  </FormControl>
                  <FormDescription>
                    Color específico para este valor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orden</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Orden de visualización (menor número = más arriba)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Activo</FormLabel>
                    <FormDescription>
                      Los valores inactivos no se mostrarán en las listas
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || loading}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {value ? "Actualizando..." : "Creando..."}
                  </>
                ) : (
                  value ? "Actualizar" : "Crear"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
