export class ContactInfoId {
  private readonly value: string

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('ContactInfoId cannot be empty')
    }
    
    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(value)) {
      throw new Error('ContactInfoId must be a valid UUID')
    }
    
    this.value = value.trim()
  }

  getValue(): string {
    return this.value
  }

  equals(other: ContactInfoId): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }

  static fromString(value: string): ContactInfoId {
    return new ContactInfoId(value)
  }

  static isValid(value: string): boolean {
    try {
      new ContactInfoId(value)
      return true
    } catch {
      return false
    }
  }

  static generate(): ContactInfoId {
    // Generar UUID v4
    const chars = '0123456789abcdef'
    let uuid = ''
    
    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid += '-'
      } else if (i === 14) {
        uuid += '4' // Version 4
      } else if (i === 19) {
        uuid += chars[Math.floor(Math.random() * 4) + 8] // 8, 9, a, b
      } else {
        uuid += chars[Math.floor(Math.random() * 16)]
      }
    }
    
    return new ContactInfoId(uuid)
  }
}
