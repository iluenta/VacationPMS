// Tipos para el sistema de configuraciones

export interface ConfigurationType {
  id: string
  tenant_id: string
  name: string
  description?: string
  icon?: string
  color?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  tenants?: {
    name: string
  }
}

export interface ConfigurationValue {
  id: string
  configuration_type_id: string
  value: string
  label: string
  description?: string
  icon?: string
  color?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreateConfigurationTypeRequest {
  name: string
  description?: string
  icon?: string
  color?: string
  sort_order?: number
  tenant_id?: string // Solo para admins
}

export interface UpdateConfigurationTypeRequest {
  name?: string
  description?: string
  icon?: string
  color?: string
  sort_order?: number
  is_active?: boolean
}

export interface CreateConfigurationValueRequest {
  value: string
  label: string
  description?: string
  icon?: string
  color?: string
  sort_order?: number
}

export interface UpdateConfigurationValueRequest {
  value?: string
  label?: string
  description?: string
  icon?: string
  color?: string
  sort_order?: number
  is_active?: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  count?: number
}

export interface ConfigurationDependency {
  table_name: string
  record_count: number
  can_delete: boolean
}

// Colores predefinidos para la UI
export const PREDEFINED_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
] as const

// Iconos predefinidos para la UI
export const PREDEFINED_ICONS = [
  'users',
  'user',
  'user-check',
  'user-plus',
  'user-minus',
  'shield',
  'shield-check',
  'calendar',
  'calendar-days',
  'calendar-check',
  'credit-card',
  'banknote',
  'wallet',
  'building',
  'building-2',
  'home',
  'map-pin',
  'star',
  'heart',
  'settings',
  'cog',
  'wrench',
  'tool',
  'tag',
  'tags',
  'bookmark',
  'flag',
  'alert-circle',
  'check-circle',
  'x-circle',
  'info',
  'help-circle',
] as const

export type PredefinedColor = typeof PREDEFINED_COLORS[number]
export type PredefinedIcon = typeof PREDEFINED_ICONS[number]
