"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Mail, Phone, Briefcase } from 'lucide-react'
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
    <div className="space-y-6">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Nombre de contacto */}
        <div className="space-y-2">
          <Label htmlFor="contactName" className="text-sm font-medium">Nombre de Contacto *</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="contactName"
              {...register('contactName')}
              placeholder="Juan Pérez"
              className="pl-10"
            />
          </div>
          {errors.contactName && (
            <p className="text-sm text-red-500">{errors.contactName.message}</p>
          )}
        </div>

        {/* Email y Teléfono */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="juan@example.com"
                className="pl-10"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">Teléfono</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+34 600 123 456"
                className="pl-10"
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>
        </div>

        {/* Cargo */}
        <div className="space-y-2">
          <Label htmlFor="position" className="text-sm font-medium">Cargo</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="position"
              {...register('position')}
              placeholder="Director General"
              className="pl-10"
            />
          </div>
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

        <div className="flex justify-end gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            variant="default"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              border: 'none'
            }}
          >
            {isSubmitting ? 'Guardando...' : 'Crear Contacto'}
          </Button>
        </div>
      </form>
    </div>
  )
}