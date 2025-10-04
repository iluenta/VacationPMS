"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useRouter } from "next/navigation"

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
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [themeColor, setThemeColor] = useState(profile?.theme_color || "blue")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setIsUpdating(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("users")
        .update({
          full_name: fullName,
          theme_color: themeColor,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      await refreshProfile()
      setMessage({ type: "success", text: "Perfil actualizado correctamente" })
    } catch (error) {
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

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setMessage({ type: "success", text: "Contraseña actualizada correctamente" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Error al cambiar la contraseña",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  if (!profile) return null

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Perfil y Configuración</h1>
          <p className="text-muted-foreground">Gestiona tu información personal y preferencias</p>
        </div>

        {message && (
          <div
            className={`rounded-md p-4 ${
              message.type === "success" ? "bg-green-50 text-green-800" : "bg-destructive/10 text-destructive"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Information */}
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

              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Guardando..." : "Guardar cambios"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Cambiar Contraseña</CardTitle>
            <CardDescription>Actualiza tu contraseña para mantener tu cuenta segura</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="grid gap-4">
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

              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? "Cambiando..." : "Cambiar contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Actions */}
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
      </div>
    </div>
  )
}
