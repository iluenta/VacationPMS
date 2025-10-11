"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Mail, Phone, MapPin, Shield } from 'lucide-react'
import { Person, CreatePersonRequest } from '@/lib/hooks/use-persons'

// Schema de validación
const physicalPersonSchema = z.object({
  personCategory: z.literal('PHYSICAL'),
  firstName: z.string().min(1, 'Nombre es requerido').max(100, 'Nombre muy largo'),
  lastName: z.string().min(1, 'Apellido es requerido').max(100, 'Apellido muy largo'),
  businessName: z.string().optional(),
  identificationType: z.enum(['DNI', 'NIE', 'PASSPORT'], {
    errorMap: () => ({ message: 'Tipo de identificación inválido para persona física' })
  }),
  identificationNumber: z.string().min(1, 'Número de identificación es requerido').max(50, 'Número muy largo'),
  personTypeId: z.string().uuid('Tipo de persona es requerido'),
  isActive: z.boolean().default(true)
})

const legalPersonSchema = z.object({
  personCategory: z.literal('LEGAL'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  businessName: z.string().min(1, 'Razón social es requerida').max(200, 'Razón social muy larga'),
  identificationType: z.literal('CIF'),
  identificationNumber: z.string().min(1, 'CIF es requerido').max(50, 'CIF muy largo'),
  personTypeId: z.string().uuid('Tipo de persona es requerido'),
  isActive: z.boolean().default(true)
})

const personFormSchema = z.discriminatedUnion('personCategory', [
  physicalPersonSchema,
  legalPersonSchema
])

type PersonFormData = z.infer<typeof personFormSchema>

interface PersonFormProps {
  person?: Person | null
  personTypes: Array<{ id: string; name: string }>
  onSubmit: (data: CreatePersonRequest) => Promise<void>
  onCancel: () => void
}

export function PersonForm({ person, personTypes, onSubmit, onCancel }: PersonFormProps) {
  const [category, setCategory] = useState<'PHYSICAL' | 'LEGAL'>('PHYSICAL')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<PersonFormData>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      personCategory: 'PHYSICAL',
      firstName: person?.firstName || '',
      lastName: person?.lastName || '',
      businessName: person?.businessName || '',
      identificationType: 'DNI',
      identificationNumber: person?.identificationNumber || '',
      personTypeId: person?.personTypeId || '',
      isActive: person?.isActive ?? true
    }
  })

  useEffect(() => {
    if (person) {
      // Determinar categoría basada en si tiene businessName
      const personCategory = person.businessName ? 'LEGAL' : 'PHYSICAL'
      setCategory(personCategory)
      setValue('personCategory', personCategory)
    }
  }, [person, setValue])

  const handleFormSubmit = async (data: PersonFormData) => {
    try {
      // Convertir datos del formulario al formato esperado por la API
      const submitData: CreatePersonRequest = {
        personCategory: data.personCategory,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        businessName: data.businessName || undefined,
        identificationType: data.identificationType,
        identificationNumber: data.identificationNumber,
        personTypeId: data.personTypeId,
        isActive: data.isActive
      }
      await onSubmit(submitData)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-6">
        {/* Categoría de persona */}
        <div className="space-y-2">
          <Label>Categoría de Persona</Label>
          <RadioGroup
            defaultValue={category}
            onValueChange={(value) => {
              setValue('personCategory', value as 'PHYSICAL' | 'LEGAL')
              setCategory(value as 'PHYSICAL' | 'LEGAL')
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="PHYSICAL" id="physical" />
              <Label htmlFor="physical">Persona Física</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="LEGAL" id="legal" />
              <Label htmlFor="legal">Persona Jurídica</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Campos para persona física */}
        {category === 'PHYSICAL' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">Nombre *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    placeholder="Juan"
                    className="pl-10"
                  />
                </div>
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">Apellido *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    placeholder="Pérez"
                    className="pl-10"
                  />
                </div>
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="identificationType" className="text-sm font-medium">Tipo de Identificación *</Label>
                <Select
                  value={watch('identificationType')}
                  onValueChange={(value) => setValue('identificationType', value as 'DNI' | 'NIE' | 'PASSPORT')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNI">DNI</SelectItem>
                    <SelectItem value="NIE">NIE</SelectItem>
                    <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
                {errors.identificationType && (
                  <p className="text-sm text-red-500">{errors.identificationType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="identificationNumber" className="text-sm font-medium">Número de Identificación *</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="identificationNumber"
                    {...register('identificationNumber')}
                    placeholder="12345678A"
                    className="pl-10"
                  />
                </div>
                {errors.identificationNumber && (
                  <p className="text-sm text-red-500">{errors.identificationNumber.message}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Campos para persona jurídica */}
        {category === 'LEGAL' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="businessName">Razón Social *</Label>
              <Input
                id="businessName"
                {...register('businessName')}
                placeholder="Empresa S.L."
              />
              {errors.businessName && (
                <p className="text-sm text-red-500">{errors.businessName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="identificationType">Tipo de Identificación *</Label>
                <Select
                  value={watch('identificationType')}
                  onValueChange={(value) => setValue('identificationType', value as 'CIF')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="CIF" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CIF">CIF</SelectItem>
                  </SelectContent>
                </Select>
                {errors.identificationType && (
                  <p className="text-sm text-red-500">{errors.identificationType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="identificationNumber">CIF *</Label>
                <Input
                  id="identificationNumber"
                  {...register('identificationNumber')}
                  placeholder="A12345678"
                />
                {errors.identificationNumber && (
                  <p className="text-sm text-red-500">{errors.identificationNumber.message}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Campos comunes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="personTypeId">Tipo de Persona *</Label>
            <Select
              value={watch('personTypeId')}
              onValueChange={(value) => setValue('personTypeId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                {personTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.personTypeId && (
              <p className="text-sm text-red-500">{errors.personTypeId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="isActive">Estado</Label>
            <Select
              value={watch('isActive') ? 'true' : 'false'}
              onValueChange={(value) => setValue('isActive', value === 'true')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Activo</SelectItem>
                <SelectItem value="false">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
            {isSubmitting ? 'Guardando...' : person ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </div>
  )
}