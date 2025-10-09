export interface UserSettingsDto {
  id: string
  userId: string
  
  // Configuraciones de interfaz
  language: string
  timezone: string
  dateFormat: string
  dashboardLayout: string
  itemsPerPage: number
  
  // Configuraciones de notificaciones
  notificationsEmail: boolean
  notificationsPush: boolean
  notificationsSms: boolean
  
  // Configuraciones de seguridad
  autoLogoutMinutes: number
  sessionTimeout: boolean
  loginNotifications: boolean
  twoFactorEnabled: boolean
  
  // Configuraciones de contraseña
  passwordExpiryDays: number
  passwordHistoryCount: number
  
  // Configuraciones de privacidad
  profileVisibility: string
  dataSharing: boolean
  
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserSettingsDto {
  userId: string
  
  // Configuraciones de interfaz
  language?: string
  timezone?: string
  dateFormat?: string
  dashboardLayout?: string
  itemsPerPage?: number
  
  // Configuraciones de notificaciones
  notificationsEmail?: boolean
  notificationsPush?: boolean
  notificationsSms?: boolean
  
  // Configuraciones de seguridad
  autoLogoutMinutes?: number
  sessionTimeout?: boolean
  loginNotifications?: boolean
  twoFactorEnabled?: boolean
  
  // Configuraciones de contraseña
  passwordExpiryDays?: number
  passwordHistoryCount?: number
  
  // Configuraciones de privacidad
  profileVisibility?: string
  dataSharing?: boolean
}

export interface UpdateUserSettingsDto {
  // Configuraciones de interfaz
  language?: string
  timezone?: string
  dateFormat?: string
  dashboardLayout?: string
  itemsPerPage?: number
  
  // Configuraciones de notificaciones
  notificationsEmail?: boolean
  notificationsPush?: boolean
  notificationsSms?: boolean
  
  // Configuraciones de seguridad
  autoLogoutMinutes?: number
  sessionTimeout?: boolean
  loginNotifications?: boolean
  twoFactorEnabled?: boolean
  
  // Configuraciones de contraseña
  passwordExpiryDays?: number
  passwordHistoryCount?: number
  
  // Configuraciones de privacidad
  profileVisibility?: string
  dataSharing?: boolean
}

export interface UserSettingsFilters {
  userId?: string
  language?: string
  timezone?: string
  dashboardLayout?: string
  twoFactorEnabled?: boolean
  profileVisibility?: string
}

export interface UserSettingsListResponse {
  success: boolean
  settings: UserSettingsDto[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface UserSettingsResponse {
  success: boolean
  settings?: UserSettingsDto
  error?: string
  message?: string
}
