"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PersonsTable } from '@/components/persons/persons-table'
import { PersonForm } from '@/components/persons/person-form'
import { PersonDetailDialog } from '@/components/persons/person-detail-dialog'
import { ContactInfoForm } from '@/components/persons/contact-info-form'
import { FiscalAddressForm } from '@/components/persons/fiscal-address-form'
import { usePersons, Person, CreatePersonRequest, CreateContactInfoRequest, CreateFiscalAddressRequest } from '@/lib/hooks/use-persons'
import { usePersonTypesOptimized } from '@/lib/hooks/use-person-types-optimized'
import { useMemoizedTenant } from '@/lib/hooks/use-memoized-tenant'
import { Plus, Search, Users, AlertCircle, Filter, X, Mail, Phone, Edit, Trash2, Eye } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

export default function PersonsPage() {
  const { toast } = useToast()
  const { currentTenant, hasTenant, tenantId } = useMemoizedTenant()
  const {
    persons,
    selectedPerson,
    contacts,
    fiscalAddress,
    loading,
    error,
    total,
    page,
    hasMore,
    fetchPersons,
    fetchPersonById,
    createPerson,
    updatePerson,
    deletePerson,
    fetchContacts,
    createContact,
    fetchFiscalAddress,
    createFiscalAddress,
    setSelectedPerson,
    setError
  } = usePersons()

  const { 
    personTypes, 
    refetch: fetchPersonTypes 
  } = usePersonTypesOptimized()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPersonType, setSelectedPersonType] = useState<string>('all')
  const [personForContact, setPersonForContact] = useState<Person | null>(null)
  const [personForAddress, setPersonForAddress] = useState<Person | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Los hooks usePersons y usePersonTypes ya cargan automáticamente
  // No necesitamos loadData() adicional que cause duplicaciones

  // Búsqueda automática con debounce - solo cuando cambian los filtros de búsqueda
  useEffect(() => {
    // Solo ejecutar si hay filtros activos (búsqueda o tipo seleccionado)
    const hasActiveFilters = searchQuery.trim() || selectedPersonType !== 'all'
    
    if (hasTenant && tenantId && hasActiveFilters) {
      setIsSearching(true)
      const timeoutId = setTimeout(() => {
        handleSearch()
      }, 150) // 150ms de debounce - optimizado para mejor respuesta

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, selectedPersonType, hasTenant, tenantId]) // Usar tenantId memoizado

  // loadData eliminado - los hooks ya cargan automáticamente

  // Buscar personas
  const handleSearch = async () => {
    try {
      const query = searchQuery?.trim()
      const filters: any = { limit: 50, offset: 0 }
      
      if (query) {
        filters.name = query
      }
      
      if (selectedPersonType && selectedPersonType !== 'all') {
        filters.personTypeId = selectedPersonType
      }

      await fetchPersons(filters)
    } catch (error) {
      console.error('Error searching persons:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Crear persona
  const handleCreate = async (data: CreatePersonRequest) => {
    try {
      await createPerson(data)
      setShowCreateDialog(false)
      toast({
        title: 'Persona creada',
        description: 'La persona ha sido creada exitosamente',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear persona',
        variant: 'destructive'
      })
    }
  }

  // Editar persona
  const handleEdit = (person: Person) => {
    setSelectedPerson(person)
    setShowEditDialog(true)
  }

  const handleUpdate = async (data: CreatePersonRequest) => {
    if (!selectedPerson) return

    try {
      await updatePerson(selectedPerson.id, data)
      setShowEditDialog(false)
      toast({
        title: 'Persona actualizada',
        description: 'Los datos han sido actualizados exitosamente',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al actualizar persona',
        variant: 'destructive'
      })
    }
  }

  // Eliminar persona
  const handleDelete = async (person: Person) => {
    try {
      await deletePerson(person.id)
      toast({
        title: 'Persona eliminada',
        description: 'La persona ha sido eliminada exitosamente',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al eliminar persona',
        variant: 'destructive'
      })
    }
  }

  // Ver detalles
  const handleView = async (person: Person) => {
    try {
      setSelectedPerson(person)
      await Promise.all([
        fetchContacts(person.id),
        fetchFiscalAddress(person.id)
      ])
      setShowDetailDialog(true)
    } catch (error) {
      console.error('Error loading person details:', error)
    }
  }

  // Ver contactos
  const handleViewContacts = async (person: Person) => {
    try {
      setPersonForContact(person)
      await fetchContacts(person.id)
      setShowContactDialog(true)
    } catch (error) {
      console.error('Error loading contacts:', error)
    }
  }

  // Ver dirección
  const handleViewAddress = async (person: Person) => {
    try {
      setPersonForAddress(person)
      await fetchFiscalAddress(person.id)
      setShowAddressDialog(true)
    } catch (error) {
      console.error('Error loading fiscal address:', error)
    }
  }

  // Crear contacto
  const handleCreateContact = async (data: CreateContactInfoRequest) => {
    if (!personForContact) return

    try {
      await createContact(personForContact.id, data)
      setShowContactDialog(false)
      toast({
        title: 'Contacto creado',
        description: 'El contacto ha sido agregado exitosamente',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear contacto',
        variant: 'destructive'
      })
    }
  }

  // Crear dirección fiscal
  const handleCreateAddress = async (data: CreateFiscalAddressRequest) => {
    if (!personForAddress) return

    try {
      await createFiscalAddress(personForAddress.id, data)
      setShowAddressDialog(false)
      toast({
        title: 'Dirección fiscal creada',
        description: 'La dirección fiscal ha sido agregada exitosamente',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear dirección fiscal',
        variant: 'destructive'
      })
    }
  }

  // Los tipos de persona ya vienen filtrados del hook
  const personTypesOptions = personTypes

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personas</h1>
          <p className="text-gray-600 mt-1">Gestiona huéspedes, propietarios y personal</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          variant="default"
          style={{
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            border: 'none'
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Añadir Persona
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters - Compact Layout */}
      <div className="flex items-center gap-3">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        {/* Type Filter */}
        <div className="w-48">
          <Select value={selectedPersonType} onValueChange={setSelectedPersonType}>
            <SelectTrigger className="border-gray-200">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {personTypesOptions.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearchQuery('')
            setSelectedPersonType('all')
            // El useEffect se encargará de ejecutar la búsqueda automáticamente
          }}
          className="border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600 hover:text-gray-800 px-3"
        >
          <X className="mr-1 h-4 w-4" />
          Limpiar
        </Button>
      </div>

      {/* Persons Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Listado de Personas
          </CardTitle>
          <CardDescription className="text-gray-600">
            {total} {total === 1 ? 'persona registrada' : 'personas registradas'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-100">
                  <TableHead className="font-semibold text-gray-700 uppercase text-xs tracking-wide">NOMBRE</TableHead>
                  <TableHead className="font-semibold text-gray-700 uppercase text-xs tracking-wide">EMAIL</TableHead>
                  <TableHead className="font-semibold text-gray-700 uppercase text-xs tracking-wide">TELÉFONO</TableHead>
                  <TableHead className="font-semibold text-gray-700 uppercase text-xs tracking-wide">TIPO</TableHead>
                  <TableHead className="font-semibold text-gray-700 uppercase text-xs tracking-wide">ESTADO</TableHead>
                  <TableHead className="font-semibold text-gray-700 uppercase text-xs tracking-wide">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2 text-gray-600">Cargando...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : persons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No se encontraron personas
                    </TableCell>
                  </TableRow>
                ) : (
                  persons.map((person) => (
                    <TableRow key={person.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">
                        {person.displayName}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {person.primaryContact?.email || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {person.primaryContact?.phone || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                          {personTypesOptions.find(type => type.id === person.personTypeId)?.name || 'Sin tipo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={`${
                            person.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {person.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(person)}
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(person)}
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                          >
                            <Edit className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(person)}
                            className="h-8 w-8 p-0 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-gray-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Person Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Persona</DialogTitle>
            <DialogDescription>
              Crea una nueva persona física o jurídica
            </DialogDescription>
          </DialogHeader>
          <PersonForm
            personTypes={personTypesOptions}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Person Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Persona</DialogTitle>
            <DialogDescription>
              Modifica los datos de la persona
            </DialogDescription>
          </DialogHeader>
          <PersonForm
            person={selectedPerson}
            personTypes={personTypesOptions}
            onSubmit={handleUpdate}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Person Detail Dialog */}
      <PersonDetailDialog
        person={selectedPerson}
        contacts={contacts}
        fiscalAddress={fiscalAddress}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      {/* Contact Info Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contactos de {personForContact?.displayName}</DialogTitle>
            <DialogDescription>
              Información de contacto de la persona
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Lista de Contactos</TabsTrigger>
              <TabsTrigger value="add">Agregar Contacto</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="space-y-4">
              {contacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay contactos registrados
                </div>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <Card key={contact.id} className="border-gray-200">
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">{contact.contactName}</h4>
                            {contact.isPrimary && (
                              <Badge className="bg-primary/10 text-primary">
                                Principal
                              </Badge>
                            )}
                          </div>
                          {contact.email && (
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {contact.email}
                            </p>
                          )}
                          {contact.phone && (
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {contact.phone}
                            </p>
                          )}
                          {contact.position && (
                            <p className="text-sm italic text-gray-500">{contact.position}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="add">
              <ContactInfoForm
                onSubmit={handleCreateContact}
                onCancel={() => setShowContactDialog(false)}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Fiscal Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dirección Fiscal de {personForAddress?.displayName}</DialogTitle>
            <DialogDescription>
              Dirección fiscal de la persona
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue={fiscalAddress ? "view" : "add"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="view">Ver Dirección</TabsTrigger>
              <TabsTrigger value="add">Agregar Dirección</TabsTrigger>
            </TabsList>
            
            <TabsContent value="view" className="space-y-4">
              {fiscalAddress ? (
                <Card className="border-gray-200">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Dirección Completa</h4>
                      <p className="text-sm text-gray-600">{fiscalAddress.fullAddress}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Código Postal:</span> {fiscalAddress.postalCode}
                        </div>
                        <div>
                          <span className="font-medium">Ciudad:</span> {fiscalAddress.city}
                        </div>
                        {fiscalAddress.province && (
                          <div>
                            <span className="font-medium">Provincia:</span> {fiscalAddress.province}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">País:</span> {fiscalAddress.country}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay dirección fiscal registrada
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="add">
              {fiscalAddress ? (
                <Alert>
                  <AlertDescription>
                    Esta persona ya tiene una dirección fiscal. Solo se permite una dirección por persona.
                  </AlertDescription>
                </Alert>
              ) : (
                <FiscalAddressForm
                  onSubmit={handleCreateAddress}
                  onCancel={() => setShowAddressDialog(false)}
                />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}