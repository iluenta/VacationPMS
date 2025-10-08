import { ContactInfoId } from '../value-objects/ContactInfoId'
import { PersonId } from '../value-objects/PersonId'
import { TenantId } from '../value-objects/TenantId'

export class ContactInfo {
  constructor(
    private readonly id: ContactInfoId,
    private readonly personId: PersonId,
    private readonly tenantId: TenantId,
    private readonly contactName: string,
    private readonly phone: string | null,
    private readonly email: string | null,
    private readonly position: string | null,
    private readonly isPrimary: boolean,
    private readonly isActive: boolean,
    private readonly createdAt: Date,
    private readonly updatedAt: Date
  ) {
    this.validate()
  }

  private validate(): void {
    // Validar que al menos un método de contacto esté presente
    if (!this.phone && !this.email) {
      throw new Error('ContactInfo must have at least a phone or email')
    }

    // Validar nombre de contacto
    if (!this.contactName || this.contactName.trim().length === 0) {
      throw new Error('Contact name is required')
    }

    if (this.contactName.length > 100) {
      throw new Error('Contact name cannot exceed 100 characters')
    }

    // Validar teléfono
    if (this.phone && this.phone.length > 20) {
      throw new Error('Phone cannot exceed 20 characters')
    }

    // Validar email
    if (this.email) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
      if (!emailRegex.test(this.email)) {
        throw new Error('Email must be in valid format')
      }

      if (this.email.length > 255) {
        throw new Error('Email cannot exceed 255 characters')
      }
    }

    // Validar posición
    if (this.position && this.position.length > 100) {
      throw new Error('Position cannot exceed 100 characters')
    }
  }

  // Getters
  getId(): ContactInfoId { return this.id }
  getPersonId(): PersonId { return this.personId }
  getTenantId(): TenantId { return this.tenantId }
  getContactName(): string { return this.contactName }
  getPhone(): string | null { return this.phone }
  getEmail(): string | null { return this.email }
  getPosition(): string | null { return this.position }
  getIsPrimary(): boolean { return this.isPrimary }
  getIsActive(): boolean { return this.isActive }
  getCreatedAt(): Date { return this.createdAt }
  getUpdatedAt(): Date { return this.updatedAt }

  // Métodos de negocio
  public getDisplayName(): string {
    if (this.position) {
      return `${this.contactName} (${this.position})`
    }
    return this.contactName
  }

  public getContactDisplay(): string {
    const parts: string[] = []
    
    if (this.phone) {
      parts.push(`📞 ${this.phone}`)
    }
    
    if (this.email) {
      parts.push(`✉️ ${this.email}`)
    }
    
    return parts.join(' | ')
  }

  public hasPhone(): boolean {
    return !!this.phone
  }

  public hasEmail(): boolean {
    return !!this.email
  }

  public activate(): ContactInfo {
    if (this.isActive) return this
    
    return new ContactInfo(
      this.id,
      this.personId,
      this.tenantId,
      this.contactName,
      this.phone,
      this.email,
      this.position,
      this.isPrimary,
      true,
      this.createdAt,
      new Date()
    )
  }

  public deactivate(): ContactInfo {
    if (!this.isActive) return this
    
    return new ContactInfo(
      this.id,
      this.personId,
      this.tenantId,
      this.contactName,
      this.phone,
      this.email,
      this.position,
      this.isPrimary,
      false,
      this.createdAt,
      new Date()
    )
  }

  public setAsPrimary(): ContactInfo {
    if (this.isPrimary) return this
    
    return new ContactInfo(
      this.id,
      this.personId,
      this.tenantId,
      this.contactName,
      this.phone,
      this.email,
      this.position,
      true,
      this.isActive,
      this.createdAt,
      new Date()
    )
  }

  public setAsSecondary(): ContactInfo {
    if (!this.isPrimary) return this
    
    return new ContactInfo(
      this.id,
      this.personId,
      this.tenantId,
      this.contactName,
      this.phone,
      this.email,
      this.position,
      false,
      this.isActive,
      this.createdAt,
      new Date()
    )
  }

  public updateContact(
    contactName: string,
    phone: string | null,
    email: string | null,
    position: string | null
  ): ContactInfo {
    return new ContactInfo(
      this.id,
      this.personId,
      this.tenantId,
      contactName,
      phone,
      email,
      position,
      this.isPrimary,
      this.isActive,
      this.createdAt,
      new Date()
    )
  }

  public belongsToPerson(personId: PersonId): boolean {
    return this.personId.equals(personId)
  }

  public belongsToTenant(tenantId: TenantId): boolean {
    return this.tenantId.equals(tenantId)
  }

  // Serialización
  public toPlainObject(): any {
    return {
      id: this.id.getValue(),
      personId: this.personId.getValue(),
      tenantId: this.tenantId.getValue(),
      contactName: this.contactName,
      phone: this.phone,
      email: this.email,
      position: this.position,
      isPrimary: this.isPrimary,
      isActive: this.isActive,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    }
  }

  public static fromPlainObject(data: any): ContactInfo {
    return new ContactInfo(
      ContactInfoId.fromString(data.id),
      PersonId.fromString(data.personId),
      TenantId.fromString(data.tenantId),
      data.contactName,
      data.phone,
      data.email,
      data.position,
      data.isPrimary,
      data.isActive,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    )
  }

  public static create(
    personId: PersonId,
    tenantId: TenantId,
    contactName: string,
    phone: string | null,
    email: string | null,
    position: string | null = null,
    isPrimary: boolean = false
  ): ContactInfo {
    const now = new Date()
    return new ContactInfo(
      ContactInfoId.generate(),
      personId,
      tenantId,
      contactName,
      phone,
      email,
      position,
      isPrimary,
      true,
      now,
      now
    )
  }
}
