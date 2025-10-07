/**
 * DTOs: AdminDto
 * 
 * Data Transfer Objects para administración.
 * Define las estructuras de datos que se transfieren entre capas.
 */

export interface SecurityMetricsDto {
  totalAlerts: number
  activeAlerts: number
  criticalAlerts: number
  alertsBySeverity: {
    low: number
    medium: number
    high: number
    critical: number
  }
  alertsByType: Record<string, number>
  recentAlerts: SecurityAlertDto[]
  systemHealth: {
    uptime: number
    memoryUsage: number
    cpuUsage: number
    diskUsage: number
  }
  securityEvents: {
    loginAttempts: number
    failedLogins: number
    blockedIPs: number
    rateLimitHits: number
  }
  lastUpdated: string
}

export interface SecurityAlertDto {
  id: string
  tenantId: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed'
  title: string
  description: string
  details: Record<string, any>
  source: string
  count: number
  firstOccurrence: string
  lastOccurrence: string
  createdAt: string
  updatedAt: string
  acknowledgedAt?: string
  acknowledgedBy?: string
  resolvedAt?: string
  resolvedBy?: string
}

export interface SecurityAlertListDto {
  alerts: SecurityAlertDto[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface SecurityAlertFiltersDto {
  severity?: 'low' | 'medium' | 'high' | 'critical'
  status?: 'active' | 'acknowledged' | 'resolved' | 'dismissed'
  type?: string
  source?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface AcknowledgeAlertRequestDto {
  acknowledgedBy: string
}

export interface AcknowledgeAlertResponseDto {
  success: boolean
  message: string
  alert: SecurityAlertDto
}

export interface ResolveAlertRequestDto {
  resolvedBy: string
}

export interface ResolveAlertResponseDto {
  success: boolean
  message: string
  alert: SecurityAlertDto
}

export interface DismissAlertResponseDto {
  success: boolean
  message: string
  alert: SecurityAlertDto
}

export interface SystemHealthDto {
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu: {
    usage: number
    cores: number
  }
  disk: {
    used: number
    total: number
    percentage: number
  }
  network: {
    requestsPerMinute: number
    averageResponseTime: number
    errorRate: number
  }
  database: {
    connections: number
    maxConnections: number
    queryTime: number
  }
  lastChecked: string
}

export interface UserActivityDto {
  userId: string
  email: string
  name: string
  lastLogin: string
  loginCount: number
  failedLoginCount: number
  isActive: boolean
  has2FA: boolean
  sessions: number
  ipAddresses: string[]
  userAgent: string
}

export interface UserActivityListDto {
  users: UserActivityDto[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface UserActivityFiltersDto {
  isActive?: boolean
  has2FA?: boolean
  lastLoginFrom?: string
  lastLoginTo?: string
  page?: number
  limit?: number
}

export interface AuditLogDto {
  id: string
  userId: string
  userEmail: string
  action: string
  resource: string
  resourceId?: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: string
  success: boolean
  errorMessage?: string
}

export interface AuditLogListDto {
  logs: AuditLogDto[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface AuditLogFiltersDto {
  userId?: string
  action?: string
  resource?: string
  success?: boolean
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface SystemSettingsDto {
  id: string
  key: string
  value: any
  description: string
  category: string
  isPublic: boolean
  updatedAt: string
  updatedBy: string
}

export interface SystemSettingsListDto {
  settings: SystemSettingsDto[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface UpdateSystemSettingRequestDto {
  value: any
  updatedBy: string
}

export interface UpdateSystemSettingResponseDto {
  success: boolean
  message: string
  setting: SystemSettingsDto
}
