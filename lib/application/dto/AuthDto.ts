/**
 * DTOs: AuthDto
 * 
 * Data Transfer Objects para autenticación.
 * Define las estructuras de datos que se transfieren entre capas.
 */

export interface LoginRequestDto {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponseDto {
  user: UserAuthDto
  accessToken: string
  refreshToken: string
  expiresIn: number
  requires2FA?: boolean
}

export interface UserAuthDto {
  id: string
  email: string
  name: string
  tenantId: string
  isAdmin: boolean
  isActive: boolean
  has2FA: boolean
  createdAt: string
  updatedAt: string
}

export interface RefreshTokenRequestDto {
  refreshToken: string
}

export interface RefreshTokenResponseDto {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LogoutRequestDto {
  refreshToken?: string
  allSessions?: boolean
}

export interface LogoutResponseDto {
  success: boolean
  message: string
}

export interface SessionDto {
  id: string
  userId: string
  tenantId: string
  userAgent: string
  ipAddress: string
  isActive: boolean
  createdAt: string
  lastActivityAt: string
  expiresAt: string
  isCurrent?: boolean
}

export interface SessionListDto {
  sessions: SessionDto[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface RevokeSessionRequestDto {
  sessionId: string
}

export interface RevokeSessionResponseDto {
  success: boolean
  message: string
}

export interface RevokeAllSessionsRequestDto {
  confirm: boolean
}

export interface RevokeAllSessionsResponseDto {
  success: boolean
  message: string
  revokedCount: number
}

export interface TwoFactorSetupRequestDto {
  password: string
}

export interface TwoFactorSetupResponseDto {
  secret: string
  qrCode: string
  backupCodes: string[]
}

export interface TwoFactorVerifyRequestDto {
  code: string
  backupCode?: string
}

export interface TwoFactorVerifyResponseDto {
  success: boolean
  message: string
  backupCodes?: string[]
}

export interface TwoFactorDisableRequestDto {
  password: string
  code: string
}

export interface TwoFactorDisableResponseDto {
  success: boolean
  message: string
}

export interface ChangePasswordRequestDto {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordResponseDto {
  success: boolean
  message: string
}

export interface ValidatePasswordRequestDto {
  password: string
}

export interface ValidatePasswordResponseDto {
  isValid: boolean
  score: number
  feedback: string[]
  requirements: {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumbers: boolean
    hasSpecialChars: boolean
    notCommon: boolean
  }
}

export interface GeneratePasswordResponseDto {
  password: string
  score: number
}

export interface OAuthInitiateRequestDto {
  provider: 'google' | 'github' | 'microsoft'
  redirectUrl?: string
}

export interface OAuthInitiateResponseDto {
  authorizationUrl: string
  state: string
}

export interface OAuthCallbackRequestDto {
  code: string
  state: string
  provider: 'google' | 'github' | 'microsoft'
}

export interface OAuthCallbackResponseDto {
  user: UserAuthDto
  accessToken: string
  refreshToken: string
  expiresIn: number
  isNewUser: boolean
}
