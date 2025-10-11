"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useUserSettings } from "@/lib/hooks/use-user-settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Shield, Bell, Globe, Palette, Settings, User, Key } from "lucide-react"

const THEME_COLORS = [
  { value: "blue", label: "Azul", color: "bg-blue-500" },
  { value: "green", label: "Verde", color: "bg-green-500" },
  { value: "purple", label: "Morado", color: "bg-purple-500" },
  { value: "orange", label: "Naranja", color: "bg-orange-500" },
  { value: "red", label: "Rojo", color: "bg-red-500" },
  { value: "pink", label: "Rosa", color: "bg-pink-500" },
]

export default function ProfilePage() {
  const { user, profile, tenant, signOut, refreshProfile } = useAuth()
  const { settings, loading: settingsLoading, error: settingsError, updateSettings, changePassword } = useUserSettings()
  
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [themeColor, setThemeColor] = useState(profile?.theme_color || "blue")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  // Sincronizar configuraciones cuando se cargan
  useEffect(() => {
    if (profile?.theme_color) {
      setThemeColor(profile.theme_color)
    }
  }, [profile?.theme_color])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setIsUpdating(true)
    setMessage(null)

    try {
      console.log('📡 [FRONTEND] Updating profile via API...')
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName,
          theme_color: themeColor,
        }),
      })

      console.log('📡 [FRONTEND] Profile update response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to update profile')
      }

      const result = await response.json()
      console.log('📡 [FRONTEND] Profile update response:', result)

      if (result.success) {
        await refreshProfile()
        setMessage({ type: "success", text: "Perfil actualizado correctamente" })
      } else {
        throw new Error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error updating profile:', error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Error al actualizar el perfil",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" })
      setIsChangingPassword(false)
      return
    }

    const result = await changePassword(currentPassword, newPassword, confirmPassword)
    
    console.log('🔍 [PAGE] Password change result:', result)
    
    if (result.success) {
      console.log('✅ [PAGE] Setting success message')
      setMessage({ type: "success", text: "Contraseña actualizada correctamente" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } else {
      // Mostrar el error retornado directamente
      const errorText = result.error || "Error al cambiar la contraseña. Verifica los requisitos."
      console.log('⚠️ [PAGE] Setting error message:', errorText)
      const errorMsg = { 
        type: "error" as const, 
        text: errorText
      }
      setMessage(errorMsg)
    }
    
    setIsChangingPassword(false)
  }

  const handleUpdateSettings = async (field: string, value: any) => {
    try {
      const success = await updateSettings({ [field]: value })
      if (success) {
        setMessage({ type: "success", text: "Configuración actualizada correctamente" })
      } else {
        setMessage({ type: "error", text: "Error al actualizar la configuración" })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Error al actualizar la configuración",
      })
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  if (!profile) return null

  if (settingsLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando configuraciones...</span>
        </div>
      </div>
    )
  }


  return (
    <div className="container max-w-7xl py-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Perfil y Configuración</h1>
          <p className="text-muted-foreground">Gestiona tu información personal y preferencias</p>
        </div>

        {message && (
          <div
            className={`rounded-md p-4 border-2 ${
              message.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <div className="font-bold">Mensaje:</div>
            <div>{message.text}</div>
          </div>
        )}

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Contraseña
            </TabsTrigger>
            <TabsTrigger value="interface" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Interfaz
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Seguridad
            </TabsTrigger>
          </TabsList>

          {/* Tab: Perfil */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Actualiza tu nombre y preferencias de tema</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input id="email" type="email" value={profile.email} disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground">El correo electrónico no se puede cambiar</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="fullName">Nombre completo</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Tu nombre completo"
                      />
                    </div>

                    {tenant && (
                      <div className="grid gap-2">
                        <Label htmlFor="tenant">Organización</Label>
                        <Input id="tenant" type="text" value={tenant.name} disabled className="bg-muted" />
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="themeColor">Color del tema</Label>
                      <Select value={themeColor} onValueChange={setThemeColor}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {THEME_COLORS.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div className={`h-4 w-4 rounded-full ${color.color}`} />
                                <span>{color.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Personaliza el color principal de la interfaz</p>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isUpdating}
                    style={{
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      border: 'none'
                    }}
                  >
                    {isUpdating ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Contraseña */}
          <TabsContent value="password" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Cambiar Contraseña
                </CardTitle>
                <CardDescription>Actualiza tu contraseña para mantener tu cuenta segura</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="currentPassword">Contraseña actual</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Ingresa tu contraseña actual"
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="newPassword">Nueva contraseña</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ingresa tu nueva contraseña"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        La contraseña debe tener: mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirma tu nueva contraseña"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isChangingPassword}
                    style={{
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      border: 'none'
                    }}
                  >
                    {isChangingPassword ? "Cambiando..." : "Cambiar contraseña"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Interfaz */}
          <TabsContent value="interface" className="space-y-6">
            {settings && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Configuración de Interfaz
                  </CardTitle>
                  <CardDescription>Personaliza la apariencia y comportamiento de la aplicación</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="language">Idioma</Label>
                      <Select 
                        value={settings.language} 
                        onValueChange={(value) => handleUpdateSettings('language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="timezone">Zona horaria</Label>
                      <Select 
                        value={settings.timezone} 
                        onValueChange={(value) => handleUpdateSettings('timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/Mexico_City">México (GMT-6)</SelectItem>
                          <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                          <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="dateFormat">Formato de fecha</Label>
                      <Select 
                        value={settings.dateFormat} 
                        onValueChange={(value) => handleUpdateSettings('dateFormat', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="dashboardLayout">Layout del dashboard</Label>
                      <Select 
                        value={settings.dashboardLayout} 
                        onValueChange={(value) => handleUpdateSettings('dashboardLayout', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Por defecto</SelectItem>
                          <SelectItem value="compact">Compacto</SelectItem>
                          <SelectItem value="expanded">Expandido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="itemsPerPage">Elementos por página</Label>
                      <Select 
                        value={settings.itemsPerPage.toString()} 
                        onValueChange={(value) => handleUpdateSettings('itemsPerPage', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Notificaciones */}
          <TabsContent value="notifications" className="space-y-6">
            {settings && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Configuración de Notificaciones
                  </CardTitle>
                  <CardDescription>Gestiona cómo recibes las notificaciones del sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notificationsEmail">Notificaciones por email</Label>
                      <p className="text-sm text-muted-foreground">Recibir notificaciones importantes por correo electrónico</p>
                    </div>
                    <Switch
                      id="notificationsEmail"
                      checked={settings.notificationsEmail}
                      onCheckedChange={(checked) => handleUpdateSettings('notificationsEmail', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notificationsPush">Notificaciones push</Label>
                      <p className="text-sm text-muted-foreground">Recibir notificaciones en tiempo real en el navegador</p>
                    </div>
                    <Switch
                      id="notificationsPush"
                      checked={settings.notificationsPush}
                      onCheckedChange={(checked) => handleUpdateSettings('notificationsPush', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notificationsSms">Notificaciones por SMS</Label>
                      <p className="text-sm text-muted-foreground">Recibir notificaciones críticas por mensaje de texto</p>
                    </div>
                    <Switch
                      id="notificationsSms"
                      checked={settings.notificationsSms}
                      onCheckedChange={(checked) => handleUpdateSettings('notificationsSms', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Seguridad */}
          <TabsContent value="security" className="space-y-6">
            {settings && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Configuración de Seguridad
                    </CardTitle>
                    <CardDescription>Gestiona las opciones de seguridad de tu cuenta</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="twoFactorEnabled">Autenticación de dos factores</Label>
                        <p className="text-sm text-muted-foreground">Añade una capa extra de seguridad a tu cuenta</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="twoFactorEnabled"
                          checked={settings.twoFactorEnabled}
                          onCheckedChange={(checked) => handleUpdateSettings('twoFactorEnabled', checked)}
                        />
                        {settings.twoFactorEnabled && (
                          <Badge variant="secondary">Activo</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sessionTimeout">Timeout de sesión</Label>
                        <p className="text-sm text-muted-foreground">Cerrar sesión automáticamente por inactividad</p>
                      </div>
                      <Switch
                        id="sessionTimeout"
                        checked={settings.sessionTimeout}
                        onCheckedChange={(checked) => handleUpdateSettings('sessionTimeout', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="loginNotifications">Notificaciones de inicio de sesión</Label>
                        <p className="text-sm text-muted-foreground">Recibir alertas cuando alguien accede a tu cuenta</p>
                      </div>
                      <Switch
                        id="loginNotifications"
                        checked={settings.loginNotifications}
                        onCheckedChange={(checked) => handleUpdateSettings('loginNotifications', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="autoLogoutMinutes">Logout automático (minutos)</Label>
                        <Select 
                          value={settings.autoLogoutMinutes.toString()} 
                          onValueChange={(value) => handleUpdateSettings('autoLogoutMinutes', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 minutos</SelectItem>
                            <SelectItem value="15">15 minutos</SelectItem>
                            <SelectItem value="30">30 minutos</SelectItem>
                            <SelectItem value="60">1 hora</SelectItem>
                            <SelectItem value="120">2 horas</SelectItem>
                            <SelectItem value="480">8 horas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="passwordExpiryDays">Expiración de contraseña (días)</Label>
                        <Select 
                          value={settings.passwordExpiryDays.toString()} 
                          onValueChange={(value) => handleUpdateSettings('passwordExpiryDays', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 días</SelectItem>
                            <SelectItem value="60">60 días</SelectItem>
                            <SelectItem value="90">90 días</SelectItem>
                            <SelectItem value="180">180 días</SelectItem>
                            <SelectItem value="365">1 año</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Configuración de Privacidad
                    </CardTitle>
                    <CardDescription>Controla la visibilidad de tu información personal</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-2">
                      <Label htmlFor="profileVisibility">Visibilidad del perfil</Label>
                      <Select 
                        value={settings.profileVisibility} 
                        onValueChange={(value) => handleUpdateSettings('profileVisibility', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Privado</SelectItem>
                          <SelectItem value="tenant_only">Solo organización</SelectItem>
                          <SelectItem value="public">Público</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Controla quién puede ver tu información de perfil</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="dataSharing">Compartir datos para análisis</Label>
                        <p className="text-sm text-muted-foreground">Permitir el uso de datos anónimos para mejorar el servicio</p>
                      </div>
                      <Switch
                        id="dataSharing"
                        checked={settings.dataSharing}
                        onCheckedChange={(checked) => handleUpdateSettings('dataSharing', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Acciones de Cuenta</CardTitle>
                    <CardDescription>Gestiona tu sesión y acceso al sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" onClick={handleSignOut}>
                      Cerrar sesión
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
