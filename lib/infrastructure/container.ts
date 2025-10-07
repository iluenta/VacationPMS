import { createClient } from '@/lib/supabase/server'
import { UserRepository } from '../domain/interfaces/UserRepository'
import { ConfigurationRepository } from '../domain/interfaces/ConfigurationRepository'
import { ConfigurationValueRepository } from '../domain/interfaces/ConfigurationValueRepository'
import { TenantRepository } from '../domain/interfaces/TenantRepository'
import { SupabaseUserRepository } from './repositories/SupabaseUserRepository'
import { SupabaseConfigurationRepository } from './repositories/SupabaseConfigurationRepository'
import { SupabaseConfigurationValueRepository } from './repositories/SupabaseConfigurationValueRepository'
import { SupabaseTenantRepository } from './repositories/SupabaseTenantRepository'

/**
 * Dependency Injection Container
 * 
 * Maneja la inyección de dependencias de la aplicación.
 * Implementa el patrón Service Locator para resolver dependencias.
 */

export interface Container {
  get<T>(key: string): T
  register<T>(key: string, factory: () => T): void
  registerSingleton<T>(key: string, factory: () => T): void
}

class DIContainer implements Container {
  private services = new Map<string, () => any>()
  private singletons = new Map<string, any>()

  get<T>(key: string): T {
    // Verificar si es un singleton
    if (this.singletons.has(key)) {
      return this.singletons.get(key)
    }

    // Verificar si existe el servicio
    if (!this.services.has(key)) {
      throw new Error(`Service '${key}' not found in container`)
    }

    const factory = this.services.get(key)!
    const instance = factory()

    return instance
  }

  register<T>(key: string, factory: () => T): void {
    this.services.set(key, factory)
  }

  registerSingleton<T>(key: string, factory: () => T): void {
    this.services.set(key, () => {
      if (!this.singletons.has(key)) {
        this.singletons.set(key, factory())
      }
      return this.singletons.get(key)
    })
  }
}

// Instancia global del container
const container = new DIContainer()

/**
 * Configura las dependencias de la aplicación
 */
export function configureContainer(): Container {
  // Registrar Supabase client como singleton
  container.registerSingleton('SupabaseClient', async () => {
    return await createClient()
  })

  // Registrar repositorios como singletons
  container.registerSingleton('UserRepository', async () => {
    const supabase = await container.get<Promise<any>>('SupabaseClient')
    return new SupabaseUserRepository(supabase)
  })

  container.registerSingleton('ConfigurationRepository', async () => {
    const supabase = await container.get<Promise<any>>('SupabaseClient')
    return new SupabaseConfigurationRepository(supabase)
  })

  container.registerSingleton('TenantRepository', async () => {
    const supabase = await container.get<Promise<any>>('SupabaseClient')
    return new SupabaseTenantRepository(supabase)
  })

  container.registerSingleton('ConfigurationValueRepository', async () => {
    const supabase = await container.get<Promise<any>>('SupabaseClient')
    return new SupabaseConfigurationValueRepository(supabase)
  })

  return container
}

/**
 * Obtiene la instancia del container configurado
 */
export function getContainer(): Container {
  return container
}

/**
 * Helper para obtener servicios del container
 */
export async function getService<T>(key: string): Promise<T> {
  const service = container.get<T>(key)
  return service
}

/**
 * Helper para obtener repositorios
 */
export async function getUserRepository(): Promise<UserRepository> {
  return await getService<UserRepository>('UserRepository')
}

export async function getConfigurationRepository(): Promise<ConfigurationRepository> {
  return await getService<ConfigurationRepository>('ConfigurationRepository')
}

export async function getTenantRepository(): Promise<TenantRepository> {
  return await getService<TenantRepository>('TenantRepository')
}

export async function getConfigurationValueRepository(): Promise<ConfigurationValueRepository> {
  return await getService<ConfigurationValueRepository>('ConfigurationValueRepository')
}

// Configurar el container al importar el módulo
configureContainer()
