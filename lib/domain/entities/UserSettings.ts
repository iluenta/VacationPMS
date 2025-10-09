import { UserSettingsId } from '../value-objects/UserSettingsId'
import { UserId } from '../value-objects/UserId'

export interface UserSettingsProps {
  id: UserSettingsId
  userId: UserId
  
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

export class UserSettings {
  private readonly props: UserSettingsProps

  constructor(props: UserSettingsProps) {
    this.validate(props)
    this.props = props
  }

  private validate(props: UserSettingsProps): void {
    // Validar idioma
    if (!['es', 'en'].includes(props.language)) {
      throw new Error('Language must be either "es" or "en"')
    }

    // Validar formato de fecha
    if (!['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].includes(props.dateFormat)) {
      throw new Error('Date format must be one of: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD')
    }

    // Validar layout del dashboard
    if (!['default', 'compact', 'expanded'].includes(props.dashboardLayout)) {
      throw new Error('Dashboard layout must be one of: default, compact, expanded')
    }

    // Validar elementos por página
    if (props.itemsPerPage < 10 || props.itemsPerPage > 100) {
      throw new Error('Items per page must be between 10 and 100')
    }

    // Validar logout automático
    if (props.autoLogoutMinutes < 5 || props.autoLogoutMinutes > 480) {
      throw new Error('Auto logout minutes must be between 5 and 480')
    }

    // Validar expiración de contraseña
    if (props.passwordExpiryDays < 30 || props.passwordExpiryDays > 365) {
      throw new Error('Password expiry days must be between 30 and 365')
    }

    // Validar historial de contraseñas
    if (props.passwordHistoryCount < 3 || props.passwordHistoryCount > 10) {
      throw new Error('Password history count must be between 3 and 10')
    }

    // Validar visibilidad del perfil
    if (!['public', 'private', 'tenant_only'].includes(props.profileVisibility)) {
      throw new Error('Profile visibility must be one of: public, private, tenant_only')
    }
  }

  // Getters
  getId(): UserSettingsId {
    return this.props.id
  }

  getUserId(): UserId {
    return this.props.userId
  }

  getLanguage(): string {
    return this.props.language
  }

  getTimezone(): string {
    return this.props.timezone
  }

  getDateFormat(): string {
    return this.props.dateFormat
  }

  getDashboardLayout(): string {
    return this.props.dashboardLayout
  }

  getItemsPerPage(): number {
    return this.props.itemsPerPage
  }

  getNotificationsEmail(): boolean {
    return this.props.notificationsEmail
  }

  getNotificationsPush(): boolean {
    return this.props.notificationsPush
  }

  getNotificationsSms(): boolean {
    return this.props.notificationsSms
  }

  getAutoLogoutMinutes(): number {
    return this.props.autoLogoutMinutes
  }

  getSessionTimeout(): boolean {
    return this.props.sessionTimeout
  }

  getLoginNotifications(): boolean {
    return this.props.loginNotifications
  }

  getTwoFactorEnabled(): boolean {
    return this.props.twoFactorEnabled
  }

  getPasswordExpiryDays(): number {
    return this.props.passwordExpiryDays
  }

  getPasswordHistoryCount(): number {
    return this.props.passwordHistoryCount
  }

  getProfileVisibility(): string {
    return this.props.profileVisibility
  }

  getDataSharing(): boolean {
    return this.props.dataSharing
  }

  getCreatedAt(): Date {
    return this.props.createdAt
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt
  }

  // Métodos de negocio
  updateLanguage(language: string): UserSettings {
    return new UserSettings({
      ...this.props,
      language,
      updatedAt: new Date()
    })
  }

  updateTimezone(timezone: string): UserSettings {
    return new UserSettings({
      ...this.props,
      timezone,
      updatedAt: new Date()
    })
  }

  updateDateFormat(dateFormat: string): UserSettings {
    return new UserSettings({
      ...this.props,
      dateFormat,
      updatedAt: new Date()
    })
  }

  updateDashboardLayout(dashboardLayout: string): UserSettings {
    return new UserSettings({
      ...this.props,
      dashboardLayout,
      updatedAt: new Date()
    })
  }

  updateItemsPerPage(itemsPerPage: number): UserSettings {
    return new UserSettings({
      ...this.props,
      itemsPerPage,
      updatedAt: new Date()
    })
  }

  updateNotificationSettings(settings: {
    email?: boolean
    push?: boolean
    sms?: boolean
  }): UserSettings {
    return new UserSettings({
      ...this.props,
      notificationsEmail: settings.email ?? this.props.notificationsEmail,
      notificationsPush: settings.push ?? this.props.notificationsPush,
      notificationsSms: settings.sms ?? this.props.notificationsSms,
      updatedAt: new Date()
    })
  }

  updateSecuritySettings(settings: {
    autoLogoutMinutes?: number
    sessionTimeout?: boolean
    loginNotifications?: boolean
    twoFactorEnabled?: boolean
  }): UserSettings {
    return new UserSettings({
      ...this.props,
      autoLogoutMinutes: settings.autoLogoutMinutes ?? this.props.autoLogoutMinutes,
      sessionTimeout: settings.sessionTimeout ?? this.props.sessionTimeout,
      loginNotifications: settings.loginNotifications ?? this.props.loginNotifications,
      twoFactorEnabled: settings.twoFactorEnabled ?? this.props.twoFactorEnabled,
      updatedAt: new Date()
    })
  }

  updatePasswordSettings(settings: {
    expiryDays?: number
    historyCount?: number
  }): UserSettings {
    return new UserSettings({
      ...this.props,
      passwordExpiryDays: settings.expiryDays ?? this.props.passwordExpiryDays,
      passwordHistoryCount: settings.historyCount ?? this.props.passwordHistoryCount,
      updatedAt: new Date()
    })
  }

  updatePrivacySettings(settings: {
    profileVisibility?: string
    dataSharing?: boolean
  }): UserSettings {
    return new UserSettings({
      ...this.props,
      profileVisibility: settings.profileVisibility ?? this.props.profileVisibility,
      dataSharing: settings.dataSharing ?? this.props.dataSharing,
      updatedAt: new Date()
    })
  }

  // Método para crear configuraciones
  static create(params: {
    id?: UserSettingsId
    userId: UserId
    language?: string
    timezone?: string
    dateFormat?: string
    dashboardLayout?: string
    itemsPerPage?: number
    notificationsEmail?: boolean
    notificationsPush?: boolean
    notificationsSms?: boolean
    autoLogoutMinutes?: number
    sessionTimeout?: boolean
    loginNotifications?: boolean
    twoFactorEnabled?: boolean
    passwordExpiryDays?: number
    passwordHistoryCount?: number
    profileVisibility?: string
    dataSharing?: boolean
  }): UserSettings {
    const now = new Date()
    
    return new UserSettings({
      id: params.id || UserSettingsId.create(),
      userId: params.userId,
      language: params.language || 'es',
      timezone: params.timezone || 'UTC',
      dateFormat: params.dateFormat || 'DD/MM/YYYY',
      dashboardLayout: params.dashboardLayout || 'default',
      itemsPerPage: params.itemsPerPage || 50,
      notificationsEmail: params.notificationsEmail ?? true,
      notificationsPush: params.notificationsPush ?? true,
      notificationsSms: params.notificationsSms ?? false,
      autoLogoutMinutes: params.autoLogoutMinutes || 30,
      sessionTimeout: params.sessionTimeout ?? true,
      loginNotifications: params.loginNotifications ?? true,
      twoFactorEnabled: params.twoFactorEnabled ?? false,
      passwordExpiryDays: params.passwordExpiryDays || 90,
      passwordHistoryCount: params.passwordHistoryCount || 5,
      profileVisibility: params.profileVisibility || 'private',
      dataSharing: params.dataSharing ?? false,
      createdAt: now,
      updatedAt: now
    })
  }

  // Método para crear configuraciones por defecto
  static createDefault(userId: UserId): UserSettings {
    return UserSettings.create({ userId })
  }

  // Método para verificar si las notificaciones están habilitadas
  hasNotificationsEnabled(): boolean {
    return this.props.notificationsEmail || this.props.notificationsPush || this.props.notificationsSms
  }

  // Método para verificar si la seguridad está reforzada
  hasEnhancedSecurity(): boolean {
    return this.props.twoFactorEnabled && this.props.sessionTimeout && this.props.loginNotifications
  }

  // Método genérico para actualizar múltiples campos
  update(data: Partial<Omit<UserSettingsProps, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): void {
    Object.assign(this.props, data)
    this.props.updatedAt = new Date()
  }

  // Método para obtener configuración como objeto plano para BD
  toPlainObject(): Record<string, any> {
    return {
      id: this.props.id.getValue(),
      user_id: this.props.userId.getValue(),
      language: this.props.language,
      timezone: this.props.timezone,
      date_format: this.props.dateFormat,
      dashboard_layout: this.props.dashboardLayout,
      items_per_page: this.props.itemsPerPage,
      notifications_email: this.props.notificationsEmail,
      notifications_push: this.props.notificationsPush,
      notifications_sms: this.props.notificationsSms,
      auto_logout_minutes: this.props.autoLogoutMinutes,
      session_timeout: this.props.sessionTimeout,
      login_notifications: this.props.loginNotifications,
      two_factor_enabled: this.props.twoFactorEnabled,
      password_expiry_days: this.props.passwordExpiryDays,
      password_history_count: this.props.passwordHistoryCount,
      profile_visibility: this.props.profileVisibility,
      data_sharing: this.props.dataSharing,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    }
  }

  // Método para convertir a DTO
  toDto(): any {
    return {
      id: this.props.id.getValue(),
      userId: this.props.userId.getValue(),
      language: this.props.language,
      timezone: this.props.timezone,
      dateFormat: this.props.dateFormat,
      dashboardLayout: this.props.dashboardLayout,
      itemsPerPage: this.props.itemsPerPage,
      notificationsEmail: this.props.notificationsEmail,
      notificationsPush: this.props.notificationsPush,
      notificationsSms: this.props.notificationsSms,
      autoLogoutMinutes: this.props.autoLogoutMinutes,
      sessionTimeout: this.props.sessionTimeout,
      loginNotifications: this.props.loginNotifications,
      twoFactorEnabled: this.props.twoFactorEnabled,
      passwordExpiryDays: this.props.passwordExpiryDays,
      passwordHistoryCount: this.props.passwordHistoryCount,
      profileVisibility: this.props.profileVisibility,
      dataSharing: this.props.dataSharing,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt
    }
  }

  // Método para crear desde objeto plano (de BD)
  static fromPlainObject(obj: any): UserSettings {
    return new UserSettings({
      id: UserSettingsId.create(obj.id),
      userId: UserId.create(obj.userId),
      language: obj.language,
      timezone: obj.timezone,
      dateFormat: obj.dateFormat,
      dashboardLayout: obj.dashboardLayout,
      itemsPerPage: obj.itemsPerPage,
      notificationsEmail: obj.notificationsEmail,
      notificationsPush: obj.notificationsPush,
      notificationsSms: obj.notificationsSms,
      autoLogoutMinutes: obj.autoLogoutMinutes,
      sessionTimeout: obj.sessionTimeout,
      loginNotifications: obj.loginNotifications,
      twoFactorEnabled: obj.twoFactorEnabled,
      passwordExpiryDays: obj.passwordExpiryDays,
      passwordHistoryCount: obj.passwordHistoryCount,
      profileVisibility: obj.profileVisibility,
      dataSharing: obj.dataSharing,
      createdAt: new Date(obj.createdAt),
      updatedAt: new Date(obj.updatedAt)
    })
  }

  // Getters para acceso a propiedades (para compatibilidad)
  get id(): UserSettingsId {
    return this.props.id
  }

  get userId(): UserId {
    return this.props.userId
  }

  get language(): string {
    return this.props.language
  }

  get timezone(): string {
    return this.props.timezone
  }

  get dateFormat(): string {
    return this.props.dateFormat
  }

  get dashboardLayout(): string {
    return this.props.dashboardLayout
  }

  get itemsPerPage(): number {
    return this.props.itemsPerPage
  }

  get notificationsEmail(): boolean {
    return this.props.notificationsEmail
  }

  get notificationsPush(): boolean {
    return this.props.notificationsPush
  }

  get notificationsSms(): boolean {
    return this.props.notificationsSms
  }

  get autoLogoutMinutes(): number {
    return this.props.autoLogoutMinutes
  }

  get sessionTimeout(): boolean {
    return this.props.sessionTimeout
  }

  get loginNotifications(): boolean {
    return this.props.loginNotifications
  }

  get twoFactorEnabled(): boolean {
    return this.props.twoFactorEnabled
  }

  get passwordExpiryDays(): number {
    return this.props.passwordExpiryDays
  }

  get passwordHistoryCount(): number {
    return this.props.passwordHistoryCount
  }

  get profileVisibility(): string {
    return this.props.profileVisibility
  }

  get dataSharing(): boolean {
    return this.props.dataSharing
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }
}
