/**
 * Value Object: TenantId
 * 
 * Representa el identificador único de un tenant en el sistema.
 * Encapsula la lógica de validación y comparación.
 */

export class TenantId {
  private readonly value: string

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('TenantId cannot be empty')
    }
    
    // Validar formato UUID (versión más flexible)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(value)) {
      throw new Error('TenantId must be a valid UUID')
    }
    
    this.value = value.trim()
  }

  /**
   * Obtiene el valor del TenantId
   */
  public getValue(): string {
    return this.value
  }

  /**
   * Compara si dos TenantIds son iguales
   */
  public equals(other: TenantId): boolean {
    return this.value === other.value
  }

  /**
   * Convierte a string
   */
  public toString(): string {
    return this.value
  }

  /**
   * Crea un TenantId desde un string (factory method)
   */
  public static fromString(value: string): TenantId {
    return new TenantId(value)
  }

  /**
   * Valida si un string es un TenantId válido
   */
  public static isValid(value: string): boolean {
    try {
      new TenantId(value)
      return true
    } catch {
      return false
    }
  }
}
