import { FiscalAddressId } from '../value-objects/FiscalAddressId'
import { PersonId } from '../value-objects/PersonId'
import { TenantId } from '../value-objects/TenantId'

export class FiscalAddress {
  constructor(
    private readonly id: FiscalAddressId,
    private readonly personId: PersonId,
    private readonly tenantId: TenantId,
    private readonly street: string,
    private readonly number: string | null,
    private readonly floor: string | null,
    private readonly door: string | null,
    private readonly postalCode: string,
    private readonly city: string,
    private readonly province: string | null,
    private readonly country: string,
    private readonly isActive: boolean,
    private readonly createdAt: Date,
    private readonly updatedAt: Date
  ) {
    this.validate()
  }

  private validate(): void {
    // Validar calle
    if (!this.street || this.street.trim().length === 0) {
      throw new Error('Street is required')
    }

    if (this.street.length > 200) {
      throw new Error('Street cannot exceed 200 characters')
    }

    // Validar número
    if (this.number && this.number.length > 20) {
      throw new Error('Number cannot exceed 20 characters')
    }

    // Validar piso
    if (this.floor && this.floor.length > 20) {
      throw new Error('Floor cannot exceed 20 characters')
    }

    // Validar puerta
    if (this.door && this.door.length > 20) {
      throw new Error('Door cannot exceed 20 characters')
    }

    // Validar código postal
    if (!this.postalCode || this.postalCode.trim().length === 0) {
      throw new Error('Postal code is required')
    }

    if (this.postalCode.length > 10) {
      throw new Error('Postal code cannot exceed 10 characters')
    }

    // Validar ciudad
    if (!this.city || this.city.trim().length === 0) {
      throw new Error('City is required')
    }

    if (this.city.length > 100) {
      throw new Error('City cannot exceed 100 characters')
    }

    // Validar provincia
    if (this.province && this.province.length > 100) {
      throw new Error('Province cannot exceed 100 characters')
    }

    // Validar país
    if (!this.country || this.country.trim().length === 0) {
      throw new Error('Country is required')
    }

    if (this.country.length > 100) {
      throw new Error('Country cannot exceed 100 characters')
    }
  }

  // Getters
  getId(): FiscalAddressId { return this.id }
  getPersonId(): PersonId { return this.personId }
  getTenantId(): TenantId { return this.tenantId }
  getStreet(): string { return this.street }
  getNumber(): string | null { return this.number }
  getFloor(): string | null { return this.floor }
  getDoor(): string | null { return this.door }
  getPostalCode(): string { return this.postalCode }
  getCity(): string { return this.city }
  getProvince(): string | null { return this.province }
  getCountry(): string { return this.country }
  getIsActive(): boolean { return this.isActive }
  getCreatedAt(): Date { return this.createdAt }
  getUpdatedAt(): Date { return this.updatedAt }

  // Métodos de negocio
  public getFullAddress(): string {
    const parts: string[] = []
    
    // Calle y número
    if (this.number) {
      parts.push(`${this.street}, ${this.number}`)
    } else {
      parts.push(this.street)
    }
    
    // Piso y puerta
    if (this.floor || this.door) {
      const floorDoor = [this.floor, this.door].filter(Boolean).join(', ')
      if (floorDoor) {
        parts.push(floorDoor)
      }
    }
    
    // Código postal y ciudad
    parts.push(`${this.postalCode} ${this.city}`)
    
    // Provincia
    if (this.province) {
      parts.push(this.province)
    }
    
    // País
    parts.push(this.country)
    
    return parts.join(', ')
  }

  public getShortAddress(): string {
    return `${this.street}${this.number ? `, ${this.number}` : ''}, ${this.postalCode} ${this.city}`
  }

  public getLocation(): string {
    const parts: string[] = [this.city]
    
    if (this.province) {
      parts.push(this.province)
    }
    
    parts.push(this.country)
    
    return parts.join(', ')
  }

  public isInSpain(): boolean {
    return this.country.toLowerCase() === 'españa' || this.country.toLowerCase() === 'spain'
  }

  public activate(): FiscalAddress {
    if (this.isActive) return this
    
    return new FiscalAddress(
      this.id,
      this.personId,
      this.tenantId,
      this.street,
      this.number,
      this.floor,
      this.door,
      this.postalCode,
      this.city,
      this.province,
      this.country,
      true,
      this.createdAt,
      new Date()
    )
  }

  public deactivate(): FiscalAddress {
    if (!this.isActive) return this
    
    return new FiscalAddress(
      this.id,
      this.personId,
      this.tenantId,
      this.street,
      this.number,
      this.floor,
      this.door,
      this.postalCode,
      this.city,
      this.province,
      this.country,
      false,
      this.createdAt,
      new Date()
    )
  }

  public updateAddress(
    street: string,
    number: string | null,
    floor: string | null,
    door: string | null,
    postalCode: string,
    city: string,
    province: string | null,
    country: string
  ): FiscalAddress {
    return new FiscalAddress(
      this.id,
      this.personId,
      this.tenantId,
      street,
      number,
      floor,
      door,
      postalCode,
      city,
      province,
      country,
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
      street: this.street,
      number: this.number,
      floor: this.floor,
      door: this.door,
      postalCode: this.postalCode,
      city: this.city,
      province: this.province,
      country: this.country,
      isActive: this.isActive,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    }
  }

  public static fromPlainObject(data: any): FiscalAddress {
    return new FiscalAddress(
      FiscalAddressId.fromString(data.id),
      PersonId.fromString(data.personId),
      TenantId.fromString(data.tenantId),
      data.street,
      data.number,
      data.floor,
      data.door,
      data.postalCode,
      data.city,
      data.province,
      data.country,
      data.isActive,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    )
  }

  public static create(
    personId: PersonId,
    tenantId: TenantId,
    street: string,
    number: string | null,
    floor: string | null,
    door: string | null,
    postalCode: string,
    city: string,
    province: string | null,
    country: string = 'España'
  ): FiscalAddress {
    const now = new Date()
    return new FiscalAddress(
      FiscalAddressId.generate(),
      personId,
      tenantId,
      street,
      number,
      floor,
      door,
      postalCode,
      city,
      province,
      country,
      true,
      now,
      now
    )
  }
}
