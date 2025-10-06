"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Check } from "lucide-react"
import { PREDEFINED_ICONS, type PredefinedIcon } from "@/types/configuration"

interface IconPickerProps {
  value?: string
  onChange: (icon: string) => void
  placeholder?: string
}

// Mapeo de iconos a componentes Lucide
const iconMap: Record<string, any> = {
  'users': 'Users',
  'user': 'User',
  'user-check': 'UserCheck',
  'user-plus': 'UserPlus',
  'user-minus': 'UserMinus',
  'shield': 'Shield',
  'shield-check': 'ShieldCheck',
  'calendar': 'Calendar',
  'calendar-days': 'CalendarDays',
  'calendar-check': 'CalendarCheck',
  'credit-card': 'CreditCard',
  'banknote': 'Banknote',
  'wallet': 'Wallet',
  'building': 'Building',
  'building-2': 'Building2',
  'home': 'Home',
  'map-pin': 'MapPin',
  'star': 'Star',
  'heart': 'Heart',
  'settings': 'Settings',
  'cog': 'Cog',
  'wrench': 'Wrench',
  'tool': 'Wrench',
  'tag': 'Tag',
  'tags': 'Tags',
  'bookmark': 'Bookmark',
  'flag': 'Flag',
  'alert-circle': 'AlertCircle',
  'check-circle': 'CheckCircle',
  'x-circle': 'XCircle',
  'info': 'Info',
  'help-circle': 'HelpCircle',
}

export function IconPicker({ value, onChange, placeholder = "Seleccionar icono" }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filteredIcons = PREDEFINED_ICONS.filter(icon =>
    icon.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (icon: string) => {
    onChange(icon)
    setOpen(false)
    setSearch("")
  }

  const getIconComponent = (iconName: string) => {
    const componentName = iconMap[iconName]
    if (!componentName) return null

    // Importar dinámicamente el icono de Lucide
    try {
      const { [componentName]: IconComponent } = require('lucide-react')
      return IconComponent
    } catch {
      return null
    }
  }

  const SelectedIcon = value ? getIconComponent(value) : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start"
          type="button"
        >
          {SelectedIcon ? (
            <>
              <SelectedIcon className="mr-2 h-4 w-4" />
              {value}
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              {placeholder}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccionar Icono</DialogTitle>
          <DialogDescription>
            Elige un icono para representar este elemento
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar iconos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-64">
            <div className="grid grid-cols-6 gap-2">
              {filteredIcons.map((icon) => {
                const IconComponent = getIconComponent(icon)
                const isSelected = value === icon

                return (
                  <Button
                    key={icon}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="h-12 flex-col gap-1"
                    onClick={() => handleSelect(icon)}
                  >
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    <span className="text-xs truncate w-full">{icon}</span>
                    {isSelected && <Check className="h-3 w-3" />}
                  </Button>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
