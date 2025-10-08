"use client"

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { MoreHorizontal, User, Building, Mail, Phone, MapPin, Edit, Trash2, Eye } from 'lucide-react'
import { Person } from '@/lib/hooks/use-persons'

interface PersonsTableProps {
  persons: Person[]
  loading: boolean
  onEdit: (person: Person) => void
  onDelete: (person: Person) => void
  onView: (person: Person) => void
  onViewContacts: (person: Person) => void
  onViewAddress: (person: Person) => void
}

export function PersonsTable({ persons, loading, onEdit, onDelete, onView, onViewContacts, onViewAddress }: PersonsTableProps) {
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null)

  const handleDeleteConfirm = () => {
    if (personToDelete) {
      onDelete(personToDelete)
      setPersonToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Cargando personas...</div>
      </div>
    )
  }

  if (persons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No hay personas registradas</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Comienza creando una nueva persona
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoría</TableHead>
              <TableHead>Nombre / Razón Social</TableHead>
              <TableHead>Identificación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {persons.map((person) => (
              <TableRow key={person.id}>
                <TableCell>
                  <Badge variant={person.personCategory === 'PHYSICAL' ? 'default' : 'secondary'}>
                    {person.personCategory === 'PHYSICAL' ? (
                      <><User className="h-3 w-3 mr-1" /> Física</>
                    ) : (
                      <><Building className="h-3 w-3 mr-1" /> Jurídica</>
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {person.displayName}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {person.identificationDisplay}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={person.isActive ? 'default' : 'secondary'}>
                    {person.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onView(person)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onViewContacts(person)}>
                        <Mail className="mr-2 h-4 w-4" />
                        Ver contactos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewAddress(person)}>
                        <MapPin className="mr-2 h-4 w-4" />
                        Ver dirección fiscal
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(person)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setPersonToDelete(person)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={!!personToDelete} onOpenChange={() => setPersonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar persona?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la persona
              {personToDelete && (
                <span className="font-semibold"> {personToDelete.displayName}</span>
              )}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
