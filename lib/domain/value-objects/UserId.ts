/**
 * Value Object: UserId
 * 
 * Representa el identificador único de un usuario en el sistema.
 * Encapsula la lógica de validación y comparación.
 */

export class UserId {
  private readonly value: string

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('UserId cannot be empty')
    }
    
    // Validar formato UUID si es necesario
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(value)) {
      throw new Error('UserId must be a valid UUID')
    }
    
    this.value = value.trim()
  }

  /**
   * Obtiene el valor del UserId
   */
  public getValue(): string {
    return this.value
  }

  /**
   * Compara si dos UserIds son iguales
   */
  public equals(other: UserId): boolean {
    return this.value === other.value
  }

  /**
   * Convierte a string
   */
  public toString(): string {
    return this.value
  }

  /**
   * Crea un UserId desde un string (factory method)
   */
  public static fromString(value: string): UserId {
    return new UserId(value)
  }

  /**
   * Valida si un string es un UserId válido
   */
  public static isValid(value: string): boolean {
    try {
      new UserId(value)
      return true
    } catch {
      return false
    }
  }
}
