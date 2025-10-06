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
import { Check, Palette } from "lucide-react"
import { PREDEFINED_COLORS, type PredefinedColor } from "@/types/configuration"

interface ColorPickerProps {
  value?: string
  onChange: (color: string) => void
  placeholder?: string
}

export function ColorPicker({ value, onChange, placeholder = "Seleccionar color" }: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [customColor, setCustomColor] = useState("")

  const handleSelect = (color: string) => {
    onChange(color)
    setOpen(false)
  }

  const handleCustomColor = () => {
    if (customColor && /^#[0-9A-Fa-f]{6}$/.test(customColor)) {
      handleSelect(customColor)
      setCustomColor("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start"
          type="button"
        >
          {value ? (
            <>
              <div 
                className="mr-2 h-4 w-4 rounded border"
                style={{ backgroundColor: value }}
              />
              {value}
            </>
          ) : (
            <>
              <Palette className="mr-2 h-4 w-4" />
              {placeholder}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccionar Color</DialogTitle>
          <DialogDescription>
            Elige un color para representar este elemento
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Colores predefinidos */}
          <div>
            <Label className="text-sm font-medium">Colores Predefinidos</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {PREDEFINED_COLORS.map((color) => {
                const isSelected = value === color

                return (
                  <Button
                    key={color}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="h-10 w-full relative"
                    onClick={() => handleSelect(color)}
                    style={{ backgroundColor: color }}
                  >
                    {isSelected && <Check className="h-4 w-4 text-white" />}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Color personalizado */}
          <div>
            <Label className="text-sm font-medium">Color Personalizado</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="color"
                value={customColor || "#000000"}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                placeholder="#000000"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleCustomColor}
                disabled={!customColor || !/^#[0-9A-Fa-f]{6}$/.test(customColor)}
                size="sm"
              >
                Aplicar
              </Button>
            </div>
          </div>

          {/* Botón para quitar color */}
          <Button
            variant="outline"
            onClick={() => handleSelect("")}
            className="w-full"
          >
            Sin Color
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
