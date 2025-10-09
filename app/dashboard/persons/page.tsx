"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PersonsTable } from '@/components/persons/persons-table'
import { PersonForm } from '@/components/persons/person-form'
import { PersonDetailDialog } from '@/components/persons/person-detail-dialog'
import { ContactInfoForm } from '@/components/persons/contact-info-form'
import { FiscalAddressForm } from '@/components/persons/fiscal-address-form'
import { usePersons, Person, CreatePersonRequest, CreateContactInfoRequest, CreateFiscalAddressRequest } from '@/lib/hooks/use-persons'
import { useConfigurations } from '@/lib/hooks/use-configurations'
import { Plus, Search, Users, AlertCircle, Filter, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

export default function PersonsPage() {
  const { toast } = useToast()
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
    configurations: personTypes, 
    refetch: fetchConfigurations 
  } = useConfigurations()

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

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [])

  // Búsqueda automática con debounce
  useEffect(() => {
    setIsSearching(true)
    const timeoutId = setTimeout(() => {
      handleSearch()
    }, 300) // 300ms de debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedPersonType])

  const loadData = async () => {
    try {
      await Promise.all([
        fetchPersons({ limit: 50, offset: 0 }),
        fetchConfigurations()
      ])
    } catch (error) {
      console.error('Error loading initial data:', error)
    }
  }

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

  // Filtrar tipos de persona
  const personTypesOptions = personTypes
    .filter(type => 
      type.name.toLowerCase().includes('persona') || 
      type.name.toLowerCase().includes('cliente') ||
      type.name.toLowerCase().includes('proveedor')
    )
    .map(type => ({
      id: type.id,
      name: type.name
    }))

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Personas</h1>
            <p className="text-muted-foreground">
              Administra personas físicas y jurídicas del sistema
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Persona
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Resumen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground">Total de personas</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{persons.length}</div>
                <p className="text-xs text-muted-foreground">En esta página</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{page}</div>
                <p className="text-xs text-muted-foreground">Página actual</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{hasMore ? 'Sí' : 'No'}</div>
                <p className="text-xs text-muted-foreground">Hay más resultados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Buscar Personas</CardTitle>
            <CardDescription>Búsqueda en tiempo real por nombre, razón social, identificación, teléfono o email</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Escribe para buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('')
                  setSelectedPersonType('all')
                }}>
                  <X className="mr-2 h-4 w-4" />
                  Limpiar
                </Button>
              </div>
              
              <div className="flex gap-4">
                <div className="w-64">
                  <Select value={selectedPersonType} onValueChange={setSelectedPersonType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por tipo de persona" />
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Persons Table */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Personas</CardTitle>
            <CardDescription>
              {total} {total === 1 ? 'persona registrada' : 'personas registradas'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PersonsTable
              persons={persons}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              onViewContacts={handleViewContacts}
              onViewAddress={handleViewAddress}
            />
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
                  <div className="text-center py-8 text-muted-foreground">
                    No hay contactos registrados
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <Card key={contact.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{contact.contactName}</h4>
                              {contact.isPrimary && (
                                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                  Principal
                                </span>
                              )}
                            </div>
                            {contact.email && (
                              <p className="text-sm text-muted-foreground">✉️ {contact.email}</p>
                            )}
                            {contact.phone && (
                              <p className="text-sm text-muted-foreground">📞 {contact.phone}</p>
                            )}
                            {contact.position && (
                              <p className="text-sm italic text-muted-foreground">{contact.position}</p>
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
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Dirección Completa</h4>
                        <p className="text-sm">{fiscalAddress.fullAddress}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
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
                  <div className="text-center py-8 text-muted-foreground">
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
    </div>
  )
}
