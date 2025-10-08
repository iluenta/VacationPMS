import { createClient, createAdminClient } from '@/lib/supabase/server'
import { IUserRepository } from '../domain/interfaces/UserRepository'
import { IConfigurationRepository } from '../domain/interfaces/ConfigurationRepository'
import { IConfigurationValueRepository } from '../domain/interfaces/ConfigurationValueRepository'
import { ITenantRepository } from '../domain/interfaces/TenantRepository'
import { IPersonRepository } from '../domain/interfaces/PersonRepository'
import { IContactInfoRepository } from '../domain/interfaces/ContactInfoRepository'
import { IFiscalAddressRepository } from '../domain/interfaces/FiscalAddressRepository'
import { SupabaseUserRepository } from './repositories/SupabaseUserRepository'
import { SupabaseConfigurationRepository } from './repositories/SupabaseConfigurationRepository'
import { SupabaseConfigurationValueRepository } from './repositories/SupabaseConfigurationValueRepository'
import { SupabaseTenantRepository } from './repositories/SupabaseTenantRepository'
import { SupabasePersonRepository } from './repositories/SupabasePersonRepository'
import { SupabaseContactInfoRepository } from './repositories/SupabaseContactInfoRepository'
import { SupabaseFiscalAddressRepository } from './repositories/SupabaseFiscalAddressRepository'

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
  // Usar createAdminClient para bypasear RLS en repositorios
  container.registerSingleton('SupabaseClient', async () => {
    return await createAdminClient()
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

  container.registerSingleton('PersonRepository', async () => {
    const supabase = await container.get<Promise<any>>('SupabaseClient')
    return new SupabasePersonRepository(supabase)
  })

  container.registerSingleton('ContactInfoRepository', async () => {
    const supabase = await container.get<Promise<any>>('SupabaseClient')
    return new SupabaseContactInfoRepository(supabase)
  })

  container.registerSingleton('FiscalAddressRepository', async () => {
    const supabase = await container.get<Promise<any>>('SupabaseClient')
    return new SupabaseFiscalAddressRepository(supabase)
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
export async function getUserRepository(): Promise<IUserRepository> {
  return await getService<IUserRepository>('UserRepository')
}

export async function getConfigurationRepository(): Promise<IConfigurationRepository> {
  return await getService<IConfigurationRepository>('ConfigurationRepository')
}

export async function getTenantRepository(): Promise<ITenantRepository> {
  return await getService<ITenantRepository>('TenantRepository')
}

export async function getConfigurationValueRepository(): Promise<IConfigurationValueRepository> {
  return await getService<IConfigurationValueRepository>('ConfigurationValueRepository')
}

export async function getPersonRepository(): Promise<IPersonRepository> {
  return await getService<IPersonRepository>('PersonRepository')
}

export async function getContactInfoRepository(): Promise<IContactInfoRepository> {
  return await getService<IContactInfoRepository>('ContactInfoRepository')
}

export async function getFiscalAddressRepository(): Promise<IFiscalAddressRepository> {
  return await getService<IFiscalAddressRepository>('FiscalAddressRepository')
}

// Configurar el container al importar el módulo
configureContainer()
