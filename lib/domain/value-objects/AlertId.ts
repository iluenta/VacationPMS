/**
 * Value Object: AlertId
 * 
 * Representa el identificador único de una alerta de seguridad en el sistema.
 * Encapsula la lógica de validación y comparación.
 */

export class AlertId {
  private readonly value: string

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('AlertId cannot be empty')
    }
    
    // Validar formato UUID si es necesario
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(value)) {
      throw new Error('AlertId must be a valid UUID')
    }
    
    this.value = value.trim()
  }

  /**
   * Obtiene el valor del AlertId
   */
  public getValue(): string {
    return this.value
  }

  /**
   * Compara si dos AlertIds son iguales
   */
  public equals(other: AlertId): boolean {
    return this.value === other.value
  }

  /**
   * Convierte a string
   */
  public toString(): string {
    return this.value
  }

  /**
   * Crea un AlertId desde un string (factory method)
   */
  public static fromString(value: string): AlertId {
    return new AlertId(value)
  }

  /**
   * Valida si un string es un AlertId válido
   */
  public static isValid(value: string): boolean {
    try {
      new AlertId(value)
      return true
    } catch {
      return false
    }
  }
}
