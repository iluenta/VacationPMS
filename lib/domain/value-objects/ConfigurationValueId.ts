/**
 * Value Object: ConfigurationValueId
 * 
 * Representa el identificador único de un valor de configuración en el sistema.
 * Encapsula la lógica de validación y comparación.
 */

export class ConfigurationValueId {
  private readonly value: string

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('ConfigurationValueId cannot be empty')
    }
    
    // Validar formato UUID si es necesario
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(value)) {
      throw new Error('ConfigurationValueId must be a valid UUID')
    }
    
    this.value = value.trim()
  }

  /**
   * Obtiene el valor del ConfigurationValueId
   */
  public getValue(): string {
    return this.value
  }

  /**
   * Compara si dos ConfigurationValueIds son iguales
   */
  public equals(other: ConfigurationValueId): boolean {
    return this.value === other.value
  }

  /**
   * Convierte a string
   */
  public toString(): string {
    return this.value
  }

  /**
   * Crea un ConfigurationValueId desde un string (factory method)
   */
  public static fromString(value: string): ConfigurationValueId {
    return new ConfigurationValueId(value)
  }

  /**
   * Valida si un string es un ConfigurationValueId válido
   */
  public static isValid(value: string): boolean {
    try {
      new ConfigurationValueId(value)
      return true
    } catch {
      return false
    }
  }
}
