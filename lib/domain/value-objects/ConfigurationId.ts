/**
 * Value Object: ConfigurationId
 * 
 * Representa el identificador único de una configuración en el sistema.
 * Encapsula la lógica de validación y comparación.
 */

export class ConfigurationId {
  private readonly value: string

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('ConfigurationId cannot be empty')
    }
    
    // Validar formato UUID si es necesario
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(value)) {
      throw new Error('ConfigurationId must be a valid UUID')
    }
    
    this.value = value.trim()
  }

  /**
   * Obtiene el valor del ConfigurationId
   */
  public getValue(): string {
    return this.value
  }

  /**
   * Compara si dos ConfigurationIds son iguales
   */
  public equals(other: ConfigurationId): boolean {
    return this.value === other.value
  }

  /**
   * Convierte a string
   */
  public toString(): string {
    return this.value
  }

  /**
   * Crea un ConfigurationId desde un string (factory method)
   */
  public static fromString(value: string): ConfigurationId {
    return new ConfigurationId(value)
  }

  /**
   * Valida si un string es un ConfigurationId válido
   */
  public static isValid(value: string): boolean {
    try {
      new ConfigurationId(value)
      return true
    } catch {
      return false
    }
  }
}
