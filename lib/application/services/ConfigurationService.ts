import { ConfigurationRepository } from '../../domain/interfaces/ConfigurationRepository'
import { ConfigurationType } from '../../domain/entities/ConfigurationType'
import { ConfigurationId } from '../../domain/value-objects/ConfigurationId'
import { TenantId } from '../../domain/value-objects/TenantId'
import { ConfigurationFilters } from '../../domain/interfaces/ConfigurationRepository'

/**
 * Service: ConfigurationService
 * 
 * Servicio de aplicación para manejar la lógica de negocio de configuraciones.
 * Orquesta las operaciones entre repositorios y entidades.
 */

export class ConfigurationService {
  constructor(private readonly configurationRepository: ConfigurationRepository) {}

  /**
   * Obtiene una configuración por su ID
   */
  async getConfigurationById(id: ConfigurationId, tenantId: TenantId): Promise<ConfigurationType | null> {
    return await this.configurationRepository.findById(id, tenantId)
  }

  /**
   * Obtiene configuraciones por tenant con filtros
   */
  async getConfigurationsByTenant(tenantId: TenantId, filters?: ConfigurationFilters): Promise<ConfigurationType[]> {
    return await this.configurationRepository.findByTenant(tenantId, filters)
  }

  /**
   * Obtiene configuraciones activas por tenant
   */
  async getActiveConfigurationsByTenant(tenantId: TenantId): Promise<ConfigurationType[]> {
    return await this.configurationRepository.findActiveByTenant(tenantId)
  }

  /**
   * Crea una nueva configuración
   */
  async createConfiguration(
    name: string,
    description: string,
    icon: string,
    color: string,
    tenantId: TenantId,
    sortOrder?: number
  ): Promise<ConfigurationType> {
    // Verificar si ya existe una configuración con el mismo nombre
    const existingConfig = await this.configurationRepository.findByName(name, tenantId)
    if (existingConfig) {
      throw new Error('Configuration with this name already exists in this tenant')
    }

    // Obtener el siguiente orden de clasificación si no se especifica
    const finalSortOrder = sortOrder ?? await this.configurationRepository.getNextSortOrder(tenantId)

    // Crear nueva entidad ConfigurationType
    const configuration = new ConfigurationType(
      ConfigurationId.fromString(crypto.randomUUID()),
      name,
      description,
      icon,
      color,
      true, // isActive
      finalSortOrder,
      tenantId,
      new Date(),
      new Date()
    )

    // Guardar en repositorio
    return await this.configurationRepository.save(configuration)
  }

  /**
   * Actualiza una configuración
   */
  async updateConfiguration(
    id: ConfigurationId,
    tenantId: TenantId,
    updates: Partial<{
      name: string
      description: string
      icon: string
      color: string
      isActive: boolean
      sortOrder: number
    }>
  ): Promise<ConfigurationType> {
    const configuration = await this.getConfigurationById(id, tenantId)
    if (!configuration) {
      throw new Error('Configuration not found')
    }

    let updatedConfiguration = configuration

    // Aplicar actualizaciones
    if (updates.name !== undefined) {
      // Verificar si el nuevo nombre ya existe
      if (updates.name !== configuration.name) {
        const existingConfig = await this.configurationRepository.findByName(updates.name, tenantId)
        if (existingConfig) {
          throw new Error('Configuration with this name already exists in this tenant')
        }
      }
      updatedConfiguration = updatedConfiguration.updateName(updates.name)
    }

    if (updates.description !== undefined) {
      updatedConfiguration = updatedConfiguration.updateDescription(updates.description)
    }

    if (updates.icon !== undefined) {
      updatedConfiguration = updatedConfiguration.updateIcon(updates.icon)
    }

    if (updates.color !== undefined) {
      updatedConfiguration = updatedConfiguration.updateColor(updates.color)
    }

    if (updates.isActive !== undefined) {
      updatedConfiguration = updates.isActive 
        ? updatedConfiguration.activate() 
        : updatedConfiguration.deactivate()
    }

    if (updates.sortOrder !== undefined) {
      updatedConfiguration = updatedConfiguration.updateSortOrder(updates.sortOrder)
    }

    // Guardar cambios
    return await this.configurationRepository.save(updatedConfiguration)
  }

  /**
   * Elimina una configuración
   */
  async deleteConfiguration(id: ConfigurationId, tenantId: TenantId): Promise<void> {
    const configuration = await this.getConfigurationById(id, tenantId)
    if (!configuration) {
      throw new Error('Configuration not found')
    }

    await this.configurationRepository.delete(id, tenantId)
  }

  /**
   * Activa una configuración
   */
  async activateConfiguration(id: ConfigurationId, tenantId: TenantId): Promise<ConfigurationType> {
    const configuration = await this.getConfigurationById(id, tenantId)
    if (!configuration) {
      throw new Error('Configuration not found')
    }

    const activatedConfiguration = configuration.activate()
    return await this.configurationRepository.save(activatedConfiguration)
  }

  /**
   * Desactiva una configuración
   */
  async deactivateConfiguration(id: ConfigurationId, tenantId: TenantId): Promise<ConfigurationType> {
    const configuration = await this.getConfigurationById(id, tenantId)
    if (!configuration) {
      throw new Error('Configuration not found')
    }

    const deactivatedConfiguration = configuration.deactivate()
    return await this.configurationRepository.save(deactivatedConfiguration)
  }

  /**
   * Reordena las configuraciones de un tenant
   */
  async reorderConfigurations(tenantId: TenantId, configurationIds: string[]): Promise<void> {
    const configurationIdObjects = configurationIds.map(id => ConfigurationId.fromString(id))
    await this.configurationRepository.reorderConfigurations(tenantId, configurationIdObjects)
  }

  /**
   * Cuenta configuraciones por tenant
   */
  async countConfigurationsByTenant(tenantId: TenantId, filters?: ConfigurationFilters): Promise<number> {
    return await this.configurationRepository.countByTenant(tenantId, filters)
  }

  /**
   * Cuenta configuraciones activas por tenant
   */
  async countActiveConfigurationsByTenant(tenantId: TenantId): Promise<number> {
    return await this.configurationRepository.countActiveByTenant(tenantId)
  }

  /**
   * Verifica si una configuración existe
   */
  async configurationExists(id: ConfigurationId, tenantId: TenantId): Promise<boolean> {
    return await this.configurationRepository.exists(id, tenantId)
  }

  /**
   * Verifica si existe una configuración con el mismo nombre
   */
  async configurationExistsByName(name: string, tenantId: TenantId, excludeId?: ConfigurationId): Promise<boolean> {
    return await this.configurationRepository.existsByName(name, tenantId, excludeId)
  }
}
