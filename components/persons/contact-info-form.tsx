"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreateContactInfoRequest } from '@/lib/hooks/use-persons'

const contactFormSchema = z.object({
  contactName: z.string().min(1, 'Nombre de contacto es requerido').max(100, 'Nombre muy largo'),
  phone: z.string().max(20, 'Teléfono muy largo').optional().or(z.literal('')),
  email: z.string().email('Email inválido').max(100, 'Email muy largo').optional().or(z.literal('')),
  position: z.string().max(100, 'Cargo muy largo').optional().or(z.literal('')),
  isPrimary: z.boolean().default(false)
})

type ContactFormData = z.infer<typeof contactFormSchema>

interface ContactInfoFormProps {
  onSubmit: (data: CreateContactInfoRequest) => Promise<void>
  onCancel: () => void
}

export function ContactInfoForm({ onSubmit, onCancel }: ContactInfoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      contactName: '',
      phone: '',
      email: '',
      position: '',
      isPrimary: false
    }
  })

  const handleFormSubmit = async (data: ContactFormData) => {
    try {
      await onSubmit({
        contactName: data.contactName,
        phone: data.phone || undefined,
        email: data.email || undefined,
        position: data.position || undefined,
        isPrimary: data.isPrimary
      })
    } catch (error) {
      console.error('Error submitting contact form:', error)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Agregar Contacto</CardTitle>
        <CardDescription>
          Completa los datos del nuevo contacto
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-4">
          {/* Nombre de contacto */}
          <div className="space-y-2">
            <Label htmlFor="contactName">Nombre de Contacto *</Label>
            <Input
              id="contactName"
              {...register('contactName')}
              placeholder="Juan Pérez"
            />
            {errors.contactName && (
              <p className="text-sm text-red-500">{errors.contactName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="juan@example.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="+34 600 123 456"
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          {/* Cargo */}
          <div className="space-y-2">
            <Label htmlFor="position">Cargo</Label>
            <Input
              id="position"
              {...register('position')}
              placeholder="Director General"
            />
            {errors.position && (
              <p className="text-sm text-red-500">{errors.position.message}</p>
            )}
          </div>

          {/* Es primario */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPrimary"
              checked={watch('isPrimary')}
              onCheckedChange={(checked) => setValue('isPrimary', checked as boolean)}
            />
            <Label htmlFor="isPrimary" className="text-sm font-normal cursor-pointer">
              Marcar como contacto principal
            </Label>
          </div>

          {/* Errores generales */}
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                Por favor, corrige los errores en el formulario
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Crear Contacto'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
