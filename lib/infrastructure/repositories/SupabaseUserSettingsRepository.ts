import { SupabaseClient } from '@supabase/supabase-js'
import { UserSettings } from '../../domain/entities/UserSettings'
import { UserSettingsId } from '../../domain/value-objects/UserSettingsId'
import { UserId } from '../../domain/value-objects/UserId'
import { IUserSettingsRepository } from '../../domain/repositories/IUserSettingsRepository'

export class SupabaseUserSettingsRepository implements IUserSettingsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(userSettings: UserSettings): Promise<void> {
    const data = userSettings.toPlainObject()
    
    const { error } = await this.supabase
      .from('user_settings')
      .insert(data)

    if (error) {
      console.error('❌ [REPOSITORY] Error saving user settings:', error)
      throw new Error(`Database error: ${error.message}`)
    }
  }

  async findById(id: UserSettingsId): Promise<UserSettings | null> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('*')
      .eq('id', id.getValue())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No encontrado
      }
      console.error('❌ [REPOSITORY] Error finding user settings by id:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  async findByUserId(userId: UserId): Promise<UserSettings | null> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId.getValue())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No encontrado
      }
      console.error('❌ [REPOSITORY] Error finding user settings by user id:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  async update(userSettings: UserSettings): Promise<void> {
    const data = userSettings.toPlainObject()
    
    const { error } = await this.supabase
      .from('user_settings')
      .update({
        language: data.language,
        timezone: data.timezone,
        date_format: data.date_format,
        dashboard_layout: data.dashboard_layout,
        items_per_page: data.items_per_page,
        notifications_email: data.notifications_email,
        notifications_push: data.notifications_push,
        notifications_sms: data.notifications_sms,
        auto_logout_minutes: data.auto_logout_minutes,
        session_timeout: data.session_timeout,
        login_notifications: data.login_notifications,
        two_factor_enabled: data.two_factor_enabled,
        password_expiry_days: data.password_expiry_days,
        password_history_count: data.password_history_count,
        profile_visibility: data.profile_visibility,
        data_sharing: data.data_sharing,
        updated_at: data.updated_at
      })
      .eq('id', data.id)

    if (error) {
      console.error('❌ [REPOSITORY] Error updating user settings:', error)
      throw new Error(`Database error: ${error.message}`)
    }
  }

  private mapToEntity(row: any): UserSettings {
    return new UserSettings({
      id: new UserSettingsId(row.id),
      userId: new UserId(row.user_id),
      language: row.language,
      timezone: row.timezone,
      dateFormat: row.date_format,
      dashboardLayout: row.dashboard_layout,
      itemsPerPage: row.items_per_page,
      notificationsEmail: row.notifications_email,
      notificationsPush: row.notifications_push,
      notificationsSms: row.notifications_sms,
      autoLogoutMinutes: row.auto_logout_minutes,
      sessionTimeout: row.session_timeout,
      loginNotifications: row.login_notifications,
      twoFactorEnabled: row.two_factor_enabled,
      passwordExpiryDays: row.password_expiry_days,
      passwordHistoryCount: row.password_history_count,
      profileVisibility: row.profile_visibility,
      dataSharing: row.data_sharing,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    })
  }
}
