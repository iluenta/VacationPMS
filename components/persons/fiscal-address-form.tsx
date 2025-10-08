"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreateFiscalAddressRequest } from '@/lib/hooks/use-persons'

const fiscalAddressFormSchema = z.object({
  street: z.string().min(1, 'Calle es requerida').max(200, 'Calle muy larga'),
  number: z.string().max(10, 'Número muy largo').optional().or(z.literal('')),
  floor: z.string().max(10, 'Piso muy largo').optional().or(z.literal('')),
  door: z.string().max(10, 'Puerta muy larga').optional().or(z.literal('')),
  postalCode: z.string().min(1, 'Código postal es requerido').max(10, 'Código postal muy largo'),
  city: z.string().min(1, 'Ciudad es requerida').max(100, 'Ciudad muy larga'),
  province: z.string().max(100, 'Provincia muy larga').optional().or(z.literal('')),
  country: z.string().max(100, 'País muy largo').default('España')
})

type FiscalAddressFormData = z.infer<typeof fiscalAddressFormSchema>

interface FiscalAddressFormProps {
  onSubmit: (data: CreateFiscalAddressRequest) => Promise<void>
  onCancel: () => void
}

export function FiscalAddressForm({ onSubmit, onCancel }: FiscalAddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FiscalAddressFormData>({
    resolver: zodResolver(fiscalAddressFormSchema),
    defaultValues: {
      street: '',
      number: '',
      floor: '',
      door: '',
      postalCode: '',
      city: '',
      province: '',
      country: 'España'
    }
  })

  const handleFormSubmit = async (data: FiscalAddressFormData) => {
    try {
      await onSubmit({
        street: data.street,
        number: data.number || undefined,
        floor: data.floor || undefined,
        door: data.door || undefined,
        postalCode: data.postalCode,
        city: data.city,
        province: data.province || undefined,
        country: data.country || 'España'
      })
    } catch (error) {
      console.error('Error submitting fiscal address form:', error)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Agregar Dirección Fiscal</CardTitle>
        <CardDescription>
          Completa los datos de la dirección fiscal
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-4">
          {/* Calle y número */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="street">Calle *</Label>
              <Input
                id="street"
                {...register('street')}
                placeholder="Calle Mayor"
              />
              {errors.street && (
                <p className="text-sm text-red-500">{errors.street.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                {...register('number')}
                placeholder="123"
              />
              {errors.number && (
                <p className="text-sm text-red-500">{errors.number.message}</p>
              )}
            </div>
          </div>

          {/* Piso y puerta */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floor">Piso</Label>
              <Input
                id="floor"
                {...register('floor')}
                placeholder="2º"
              />
              {errors.floor && (
                <p className="text-sm text-red-500">{errors.floor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="door">Puerta</Label>
              <Input
                id="door"
                {...register('door')}
                placeholder="A"
              />
              {errors.door && (
                <p className="text-sm text-red-500">{errors.door.message}</p>
              )}
            </div>
          </div>

          {/* Código postal y ciudad */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Código Postal *</Label>
              <Input
                id="postalCode"
                {...register('postalCode')}
                placeholder="28001"
              />
              {errors.postalCode && (
                <p className="text-sm text-red-500">{errors.postalCode.message}</p>
              )}
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="Madrid"
              />
              {errors.city && (
                <p className="text-sm text-red-500">{errors.city.message}</p>
              )}
            </div>
          </div>

          {/* Provincia */}
          <div className="space-y-2">
            <Label htmlFor="province">Provincia</Label>
            <Input
              id="province"
              {...register('province')}
              placeholder="Madrid"
            />
            {errors.province && (
              <p className="text-sm text-red-500">{errors.province.message}</p>
            )}
          </div>

          {/* País */}
          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Input
              id="country"
              {...register('country')}
              placeholder="España"
            />
            {errors.country && (
              <p className="text-sm text-red-500">{errors.country.message}</p>
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
            {isSubmitting ? 'Guardando...' : 'Crear Dirección'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
