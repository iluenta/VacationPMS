import { Person } from '../Person'
import { TenantId } from '../../value-objects/TenantId'
import { PersonId } from '../../value-objects/PersonId'
import { ConfigurationId } from '../../value-objects/ConfigurationId'

describe('Person', () => {
  let mockTenantId: TenantId
  let mockPersonTypeId: ConfigurationId

  beforeEach(() => {
    mockTenantId = TenantId.fromString('00000001-0000-4000-8000-000000000000')
    mockPersonTypeId = ConfigurationId.fromString('223e4567-e89b-12d3-a456-426614174000')
  })

  describe('createPhysical', () => {
    it('should create a valid physical person', () => {
      // Act
      const person = Person.createPhysical(
        mockTenantId,
        mockPersonTypeId,
        'John',
        'Doe',
        'DNI',
        '12345678A'
      )

      // Assert
      expect(person).toBeDefined()
      expect(person.getFirstName()).toBe('John')
      expect(person.getLastName()).toBe('Doe')
      expect(person.getBusinessName()).toBeNull()
      expect(person.getIdentificationType()).toBe('DNI')
      expect(person.getIdentificationNumber()).toBe('12345678A')
      expect(person.getPersonCategory()).toBe('PHYSICAL')
      expect(person.getIsActive()).toBe(true)
    })

    it('should accept names with whitespace (not trimmed by entity)', () => {
      // Act
      const person = Person.createPhysical(
        mockTenantId,
        mockPersonTypeId,
        '  John  ',
        '  Doe  ',
        'DNI',
        '12345678A'
      )

      // Assert
      expect(person.getFirstName()).toBe('  John  ')
      expect(person.getLastName()).toBe('  Doe  ')
    })

    it('should throw error for empty first name', () => {
      // Act & Assert
      expect(() => Person.createPhysical(
        mockTenantId,
        mockPersonTypeId,
        '',
        'Doe',
        'DNI',
        '12345678A'
      )).toThrow('Physical person must have first name and last name')
    })

    it('should throw error for empty last name', () => {
      // Act & Assert
      expect(() => Person.createPhysical(
        mockTenantId,
        mockPersonTypeId,
        'John',
        '',
        'DNI',
        '12345678A'
      )).toThrow('Physical person must have first name and last name')
    })

    it('should throw error for empty identification number', () => {
      // Act & Assert
      expect(() => Person.createPhysical(
        mockTenantId,
        mockPersonTypeId,
        'John',
        'Doe',
        'DNI',
        ''
      )).toThrow('Identification number is required')
    })
  })

  describe('createLegal', () => {
    it('should create a valid legal person', () => {
      // Act
      const person = Person.createLegal(
        mockTenantId,
        mockPersonTypeId,
        'Acme Corp',
        'CIF',
        'B12345678'
      )

      // Assert
      expect(person).toBeDefined()
      expect(person.getBusinessName()).toBe('Acme Corp')
      expect(person.getFirstName()).toBeNull()
      expect(person.getLastName()).toBeNull()
      expect(person.getIdentificationType()).toBe('CIF')
      expect(person.getIdentificationNumber()).toBe('B12345678')
      expect(person.getPersonCategory()).toBe('LEGAL')
      expect(person.getIsActive()).toBe(true)
    })

    it('should accept business name with whitespace (not trimmed by entity)', () => {
      // Act
      const person = Person.createLegal(
        mockTenantId,
        mockPersonTypeId,
        '  Acme Corp  ',
        'CIF',
        'B12345678'
      )

      // Assert
      expect(person.getBusinessName()).toBe('  Acme Corp  ')
    })

    it('should throw error for empty business name', () => {
      // Act & Assert
      expect(() => Person.createLegal(
        mockTenantId,
        mockPersonTypeId,
        '',
        'CIF',
        'B12345678'
      )).toThrow('Person must have at least a name or business name')
    })
  })

  describe('activate', () => {
    it('should activate an inactive person', () => {
      // Arrange
      const person = Person.createPhysical(
        mockTenantId,
        mockPersonTypeId,
        'John',
        'Doe',
        'DNI',
        '12345678A'
      ).deactivate()

      // Act
      const activatedPerson = person.activate()

      // Assert
      expect(activatedPerson.getIsActive()).toBe(true)
    })

    it('should return same person if already active', () => {
      // Arrange
      const person = Person.createPhysical(
        mockTenantId,
        mockPersonTypeId,
        'John',
        'Doe',
        'DNI',
        '12345678A'
      )

      // Act
      const activatedPerson = person.activate()

      // Assert
      expect(activatedPerson).toBe(person)
    })
  })

  describe('deactivate', () => {
    it('should deactivate an active person', () => {
      // Arrange
      const person = Person.createPhysical(
        mockTenantId,
        mockPersonTypeId,
        'John',
        'Doe',
        'DNI',
        '12345678A'
      )

      // Act
      const deactivatedPerson = person.deactivate()

      // Assert
      expect(deactivatedPerson.getIsActive()).toBe(false)
    })

    it('should return same person if already inactive', () => {
      // Arrange
      const person = Person.createPhysical(
        mockTenantId,
        mockPersonTypeId,
        'John',
        'Doe',
        'DNI',
        '12345678A'
      ).deactivate()

      // Act
      const deactivatedPerson = person.deactivate()

      // Assert
      expect(deactivatedPerson).toBe(person)
    })
  })

  describe('getFullName', () => {
    it('should return full name for physical person', () => {
      // Arrange
      const person = Person.createPhysical(
        mockTenantId,
        mockPersonTypeId,
        'John',
        'Doe',
        'DNI',
        '12345678A'
      )

      // Act
      const fullName = person.getFullName()

      // Assert
      expect(fullName).toBe('John Doe')
    })

    it('should return business name for legal person', () => {
      // Arrange
      const person = Person.createLegal(
        mockTenantId,
        mockPersonTypeId,
        'Acme Corp',
        'CIF',
        'B12345678'
      )

      // Act
      const fullName = person.getFullName()

      // Assert
      expect(fullName).toBe('Acme Corp')
    })
  })

  describe('getDisplayName', () => {
    it('should return display name for physical person', () => {
      // Arrange
      const person = Person.createPhysical(
        mockTenantId,
        mockPersonTypeId,
        'John',
        'Doe',
        'DNI',
        '12345678A'
      )

      // Act
      const displayName = person.getDisplayName()

      // Assert
      expect(displayName).toBe('John Doe')
    })

    it('should return business name for legal person', () => {
      // Arrange
      const person = Person.createLegal(
        mockTenantId,
        mockPersonTypeId,
        'Acme Corp',
        'CIF',
        'B12345678'
      )

      // Act
      const displayName = person.getDisplayName()

      // Assert
      expect(displayName).toBe('Acme Corp')
    })
  })

  describe('getIdentificationDisplay', () => {
    it('should return identification display for DNI', () => {
      // Arrange
      const person = Person.createPhysical(
        mockTenantId,
        mockPersonTypeId,
        'John',
        'Doe',
        'DNI',
        '12345678A'
      )

      // Act
      const display = person.getIdentificationDisplay()

      // Assert
      expect(display).toBe('DNI: 12345678A')
    })

    it('should return identification display for CIF', () => {
      // Arrange
      const person = Person.createLegal(
        mockTenantId,
        mockPersonTypeId,
        'Acme Corp',
        'CIF',
        'B12345678'
      )

      // Act
      const display = person.getIdentificationDisplay()

      // Assert
      expect(display).toBe('CIF: B12345678')
    })
  })

  describe('belongsToTenant', () => {
    it('should return true for same tenant', () => {
      // Arrange
      const person = Person.createPhysical(
        mockTenantId,
        mockPersonTypeId,
        'John',
        'Doe',
        'DNI',
        '12345678A'
      )

      // Act
      const belongs = person.belongsToTenant(mockTenantId)

      // Assert
      expect(belongs).toBe(true)
    })

    it('should return false for different tenant', () => {
      // Arrange
      const person = Person.createPhysical(
        mockTenantId,
        mockPersonTypeId,
        'John',
        'Doe',
        'DNI',
        '12345678A'
      )

      const differentTenantId = TenantId.fromString('00000002-0000-4000-8000-000000000000')

      // Act
      const belongs = person.belongsToTenant(differentTenantId)

      // Assert
      expect(belongs).toBe(false)
    })
  })
})
