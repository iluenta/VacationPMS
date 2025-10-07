/**
 * Value Object: SessionId
 * 
 * Representa el identificador único de una sesión en el sistema.
 * Encapsula la lógica de validación y comparación.
 */

export class SessionId {
  private readonly value: string

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('SessionId cannot be empty')
    }
    
    // Validar formato UUID si es necesario
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(value)) {
      throw new Error('SessionId must be a valid UUID')
    }
    
    this.value = value.trim()
  }

  /**
   * Obtiene el valor del SessionId
   */
  public getValue(): string {
    return this.value
  }

  /**
   * Compara si dos SessionIds son iguales
   */
  public equals(other: SessionId): boolean {
    return this.value === other.value
  }

  /**
   * Convierte a string
   */
  public toString(): string {
    return this.value
  }

  /**
   * Crea un SessionId desde un string (factory method)
   */
  public static fromString(value: string): SessionId {
    return new SessionId(value)
  }

  /**
   * Valida si un string es un SessionId válido
   */
  public static isValid(value: string): boolean {
    try {
      new SessionId(value)
      return true
    } catch {
      return false
    }
  }
}
