import { PersonId } from '../value-objects/PersonId'
import { TenantId } from '../value-objects/TenantId'
import { ConfigurationId } from '../value-objects/ConfigurationId'

export type PersonCategory = 'PHYSICAL' | 'LEGAL'
export type IdentificationType = 'DNI' | 'CIF' | 'NIE' | 'PASSPORT'

export class Person {
  constructor(
    private readonly id: PersonId,
    private readonly tenantId: TenantId,
    private readonly personTypeId: ConfigurationId,
    private readonly firstName: string | null,
    private readonly lastName: string | null,
    private readonly businessName: string | null,
    private readonly identificationType: IdentificationType,
    private readonly identificationNumber: string,
    private readonly personCategory: PersonCategory,
    private readonly isActive: boolean,
    private readonly createdAt: Date,
    private readonly updatedAt: Date
  ) {
    this.validate()
  }

  private validate(): void {
    // Validar que al menos un nombre esté presente
    if (!this.firstName && !this.lastName && !this.businessName) {
      throw new Error('Person must have at least a name or business name')
    }

    // Validar consistencia de categoría
    if (this.personCategory === 'PHYSICAL') {
      if (!this.firstName || !this.lastName) {
        throw new Error('Physical person must have first name and last name')
      }
      if (this.businessName) {
        throw new Error('Physical person cannot have business name')
      }
    } else if (this.personCategory === 'LEGAL') {
      if (!this.businessName) {
        throw new Error('Legal person must have business name')
      }
      if (this.firstName || this.lastName) {
        throw new Error('Legal person cannot have first name or last name')
      }
    }

    // Validar identificación
    if (!this.identificationNumber || this.identificationNumber.trim().length === 0) {
      throw new Error('Identification number is required')
    }

    if (this.identificationNumber.length > 50) {
      throw new Error('Identification number cannot exceed 50 characters')
    }

    // Validar nombres
    if (this.firstName && this.firstName.length > 100) {
      throw new Error('First name cannot exceed 100 characters')
    }

    if (this.lastName && this.lastName.length > 100) {
      throw new Error('Last name cannot exceed 100 characters')
    }

    if (this.businessName && this.businessName.length > 200) {
      throw new Error('Business name cannot exceed 200 characters')
    }
  }

  // Getters
  getId(): PersonId { return this.id }
  getTenantId(): TenantId { return this.tenantId }
  getPersonTypeId(): ConfigurationId { return this.personTypeId }
  getFirstName(): string | null { return this.firstName }
  getLastName(): string | null { return this.lastName }
  getBusinessName(): string | null { return this.businessName }
  getIdentificationType(): IdentificationType { return this.identificationType }
  getIdentificationNumber(): string { return this.identificationNumber }
  getPersonCategory(): PersonCategory { return this.personCategory }
  getIsActive(): boolean { return this.isActive }
  getCreatedAt(): Date { return this.createdAt }
  getUpdatedAt(): Date { return this.updatedAt }

  // Métodos de negocio
  public getFullName(): string {
    if (this.personCategory === 'PHYSICAL') {
      return `${this.firstName || ''} ${this.lastName || ''}`.trim()
    } else {
      return this.businessName || ''
    }
  }

  public getDisplayName(): string {
    const fullName = this.getFullName()
    return fullName || `Person ${this.id.getValue().substring(0, 8)}`
  }

  public getIdentificationDisplay(): string {
    return `${this.identificationType}: ${this.identificationNumber}`
  }

  public activate(): Person {
    if (this.isActive) return this
    
    return new Person(
      this.id,
      this.tenantId,
      this.personTypeId,
      this.firstName,
      this.lastName,
      this.businessName,
      this.identificationType,
      this.identificationNumber,
      this.personCategory,
      true,
      this.createdAt,
      new Date()
    )
  }

  public deactivate(): Person {
    if (!this.isActive) return this
    
    return new Person(
      this.id,
      this.tenantId,
      this.personTypeId,
      this.firstName,
      this.lastName,
      this.businessName,
      this.identificationType,
      this.identificationNumber,
      this.personCategory,
      false,
      this.createdAt,
      new Date()
    )
  }

  public updateNames(
    firstName: string | null,
    lastName: string | null,
    businessName: string | null
  ): Person {
    return new Person(
      this.id,
      this.tenantId,
      this.personTypeId,
      firstName,
      lastName,
      businessName,
      this.identificationType,
      this.identificationNumber,
      this.personCategory,
      this.isActive,
      this.createdAt,
      new Date()
    )
  }

  public updateIdentification(
    type: IdentificationType,
    number: string
  ): Person {
    return new Person(
      this.id,
      this.tenantId,
      this.personTypeId,
      this.firstName,
      this.lastName,
      this.businessName,
      type,
      number,
      this.personCategory,
      this.isActive,
      this.createdAt,
      new Date()
    )
  }

  public belongsToTenant(tenantId: TenantId): boolean {
    return this.tenantId.equals(tenantId)
  }

  public isPhysicalPerson(): boolean {
    return this.personCategory === 'PHYSICAL'
  }

  public isLegalPerson(): boolean {
    return this.personCategory === 'LEGAL'
  }

  // Serialización
  public toPlainObject(): any {
    return {
      id: this.id.getValue(),
      tenantId: this.tenantId.getValue(),
      personTypeId: this.personTypeId.getValue(),
      firstName: this.firstName,
      lastName: this.lastName,
      businessName: this.businessName,
      identificationType: this.identificationType,
      identificationNumber: this.identificationNumber,
      personCategory: this.personCategory,
      isActive: this.isActive,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    }
  }

  public static fromPlainObject(data: any): Person {
    return new Person(
      PersonId.fromString(data.id),
      TenantId.fromString(data.tenantId),
      ConfigurationId.fromString(data.personTypeId),
      data.firstName,
      data.lastName,
      data.businessName,
      data.identificationType,
      data.identificationNumber,
      data.personCategory,
      data.isActive,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    )
  }

  public static createPhysical(
    tenantId: TenantId,
    personTypeId: ConfigurationId,
    firstName: string,
    lastName: string,
    identificationType: IdentificationType,
    identificationNumber: string
  ): Person {
    const now = new Date()
    return new Person(
      PersonId.generate(),
      tenantId,
      personTypeId,
      firstName,
      lastName,
      null,
      identificationType,
      identificationNumber,
      'PHYSICAL',
      true,
      now,
      now
    )
  }

  public static createLegal(
    tenantId: TenantId,
    personTypeId: ConfigurationId,
    businessName: string,
    identificationType: IdentificationType,
    identificationNumber: string
  ): Person {
    const now = new Date()
    return new Person(
      PersonId.generate(),
      tenantId,
      personTypeId,
      null,
      null,
      businessName,
      identificationType,
      identificationNumber,
      'LEGAL',
      true,
      now,
      now
    )
  }
}
