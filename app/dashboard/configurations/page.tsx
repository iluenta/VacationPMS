"use client"

import { useState } from "react"
import { ConfigurationTypesList } from "@/components/configuration/configuration-types-list"
import { ConfigurationValuesList } from "@/components/configuration/configuration-values-list"
import type { ConfigurationType } from "@/types/configuration"

export default function ConfigurationsPage() {
  const [selectedConfiguration, setSelectedConfiguration] = useState<ConfigurationType | null>(null)

  const handleSelectConfiguration = (configuration: ConfigurationType) => {
    setSelectedConfiguration(configuration)
  }

  const handleBack = () => {
    setSelectedConfiguration(null)
  }

  return (
    <div className="container py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuraciones</h1>
          <p className="text-muted-foreground">
            Gestiona los tipos de configuración y sus valores para personalizar tu sistema
          </p>
        </div>

        {/* Content */}
        {selectedConfiguration ? (
          <ConfigurationValuesList
            configurationType={selectedConfiguration}
            onBack={handleBack}
          />
        ) : (
          <ConfigurationTypesList
            onSelectConfiguration={handleSelectConfiguration}
          />
        )}
      </div>
    </div>
  )
}
