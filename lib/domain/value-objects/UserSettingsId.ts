import { v4 as uuidv4 } from 'uuid'

export class UserSettingsId {
  private readonly value: string

  constructor(value?: string) {
    if (value !== undefined) {
      if (!value || !this.isValidUuid(value)) {
        throw new Error('UserSettingsId must be a valid UUID')
      }
      this.value = value
    } else {
      this.value = uuidv4()
    }
  }

  private isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  getValue(): string {
    return this.value
  }

  equals(other: UserSettingsId): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }

  static fromString(value: string): UserSettingsId {
    return new UserSettingsId(value)
  }

  static create(value?: string): UserSettingsId {
    return new UserSettingsId(value)
  }
}
