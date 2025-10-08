"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Person, CreatePersonRequest } from '@/lib/hooks/use-persons'

// Schema de validación
const physicalPersonSchema = z.object({
  personCategory: z.literal('PHYSICAL'),
  firstName: z.string().min(1, 'Nombre es requerido').max(100, 'Nombre muy largo'),
  lastName: z.string().min(1, 'Apellido es requerido').max(100, 'Apellido muy largo'),
  businessName: z.literal(null).or(z.literal('')),
  identificationType: z.enum(['DNI', 'NIE', 'PASSPORT'], {
    errorMap: () => ({ message: 'Tipo de identificación inválido para persona física' })
  }),
  identificationNumber: z.string().min(1, 'Número de identificación es requerido').max(50, 'Número muy largo'),
  personTypeId: z.string().uuid('Tipo de persona es requerido'),
  isActive: z.boolean().default(true)
})

const legalPersonSchema = z.object({
  personCategory: z.literal('LEGAL'),
  firstName: z.literal(null).or(z.literal('')),
  lastName: z.literal(null).or(z.literal('')),
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
  const [category, setCategory] = useState<'PHYSICAL' | 'LEGAL'>(person?.personCategory || 'PHYSICAL')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<PersonFormData>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      personCategory: person?.personCategory || 'PHYSICAL',
      firstName: person?.firstName || '',
      lastName: person?.lastName || '',
      businessName: person?.businessName || '',
      identificationType: person?.identificationType || 'DNI',
      identificationNumber: person?.identificationNumber || '',
      personTypeId: person?.personTypeId || '',
      isActive: person?.isActive ?? true
    }
  })

  // Watch category changes
  const watchedCategory = watch('personCategory')
  
  useEffect(() => {
    setCategory(watchedCategory)
  }, [watchedCategory])

  const handleFormSubmit = async (data: PersonFormData) => {
    try {
      await onSubmit(data as CreatePersonRequest)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{person ? 'Editar Persona' : 'Nueva Persona'}</CardTitle>
        <CardDescription>
          {person ? 'Modifica los datos de la persona' : 'Completa los datos para crear una nueva persona'}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-6">
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
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    placeholder="Juan"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    placeholder="Pérez"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="identificationType">Tipo de Identificación *</Label>
                <Select
                  onValueChange={(value) => setValue('identificationType', value as any)}
                  defaultValue={watch('identificationType')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
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
                  placeholder="Acme Corporation S.L."
                />
                {errors.businessName && (
                  <p className="text-sm text-red-500">{errors.businessName.message}</p>
                )}
              </div>

              <input type="hidden" {...register('identificationType')} value="CIF" />
            </>
          )}

          {/* Número de identificación */}
          <div className="space-y-2">
            <Label htmlFor="identificationNumber">
              {category === 'PHYSICAL' ? 'Número de Identificación *' : 'CIF *'}
            </Label>
            <Input
              id="identificationNumber"
              {...register('identificationNumber')}
              placeholder={category === 'PHYSICAL' ? '12345678A' : 'B12345678'}
            />
            {errors.identificationNumber && (
              <p className="text-sm text-red-500">{errors.identificationNumber.message}</p>
            )}
          </div>

          {/* Tipo de persona */}
          <div className="space-y-2">
            <Label htmlFor="personTypeId">Tipo de Persona *</Label>
            <Select
              onValueChange={(value) => setValue('personTypeId', value)}
              defaultValue={watch('personTypeId')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo" />
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
            {isSubmitting ? 'Guardando...' : person ? 'Actualizar' : 'Crear'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
