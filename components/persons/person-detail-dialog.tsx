"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Building, Mail, Phone, MapPin, Calendar, Hash, FileText } from 'lucide-react'
import { Person, ContactInfo, FiscalAddress } from '@/lib/hooks/use-persons'

interface PersonDetailDialogProps {
  person: Person | null
  contacts?: ContactInfo[]
  fiscalAddress?: FiscalAddress | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PersonDetailDialog({ person, contacts, fiscalAddress, open, onOpenChange }: PersonDetailDialogProps) {
  if (!person) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {person.personCategory === 'PHYSICAL' ? (
              <User className="h-5 w-5" />
            ) : (
              <Building className="h-5 w-5" />
            )}
            {person.displayName}
          </DialogTitle>
          <DialogDescription>
            Detalles completos de la persona
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Categoría:</span>
                <Badge variant={person.personCategory === 'PHYSICAL' ? 'default' : 'secondary'}>
                  {person.personCategory === 'PHYSICAL' ? 'Persona Física' : 'Persona Jurídica'}
                </Badge>
              </div>

              {person.personCategory === 'PHYSICAL' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Nombre:</span>
                      <p className="text-sm text-muted-foreground">{person.firstName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Apellido:</span>
                      <p className="text-sm text-muted-foreground">{person.lastName}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <span className="text-sm font-medium">Razón Social:</span>
                  <p className="text-sm text-muted-foreground">{person.businessName}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Identificación:</span>
                <p className="text-sm text-muted-foreground">{person.identificationDisplay}</p>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Fecha de creación:</span>
                <p className="text-sm text-muted-foreground">
                  {new Date(person.createdAt).toLocaleDateString('es-ES')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Estado:</span>
                <Badge variant={person.isActive ? 'default' : 'secondary'}>
                  {person.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Información de contacto */}
          {contacts && contacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="border-l-2 border-primary pl-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{contact.contactName}</span>
                      {contact.isPrimary && (
                        <Badge variant="default" className="text-xs">Principal</Badge>
                      )}
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </div>
                    )}
                    {contact.position && (
                      <p className="text-xs text-muted-foreground italic">{contact.position}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Dirección fiscal */}
          {fiscalAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Dirección Fiscal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{fiscalAddress.fullAddress}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {fiscalAddress.postalCode} - {fiscalAddress.city}
                  {fiscalAddress.province && `, ${fiscalAddress.province}`}
                </p>
                <p className="text-sm text-muted-foreground">{fiscalAddress.country}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
