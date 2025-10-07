# 🏗️ Guía de Desarrollo - Clean Architecture

## 📖 **ÍNDICE**

1. [Arquitectura General](#arquitectura-general)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Patrones de Implementación](#patrones-de-implementación)
4. [Estándares de Código](#estándares-de-código)
5. [Flujo de Desarrollo](#flujo-de-desarrollo)
6. [Testing](#testing)
7. [Seguridad](#seguridad)
8. [Logging y Monitoreo](#logging-y-monitoreo)
9. [Checklist de Implementación](#checklist-de-implementación)

---

## 🏛️ **ARQUITECTURA GENERAL**

### **Principios Fundamentales**
- **Clean Architecture**: Separación clara de responsabilidades
- **Dependency Inversion**: Las capas superiores no dependen de las inferiores
- **Single Responsibility**: Cada clase tiene una sola razón para cambiar
- **Open/Closed**: Abierto para extensión, cerrado para modificación

### **Capas de la Arquitectura**

```
┌─────────────────────────────────────┐
│           PRESENTATION              │ ← Controllers, Middleware
├─────────────────────────────────────┤
│           APPLICATION               │ ← Use Cases, Services, DTOs
├─────────────────────────────────────┤
│             DOMAIN                  │ ← Entities, Value Objects, Interfaces
├─────────────────────────────────────┤
│          INFRASTRUCTURE             │ ← Repositories, External Services
└─────────────────────────────────────┘
```

---

## 📁 **ESTRUCTURA DE CARPETAS**

```
lib/
├── domain/                          # Capa de Dominio
│   ├── entities/                    # Entidades de negocio
│   ├── value-objects/               # Objetos de valor
│   └── interfaces/                  # Contratos/Interfaces
├── application/                     # Capa de Aplicación
│   ├── use-cases/                   # Casos de uso
│   ├── services/                    # Servicios de aplicación
│   └── dto/                         # Data Transfer Objects
├── infrastructure/                  # Capa de Infraestructura
│   ├── repositories/                # Implementaciones de repositorios
│   └── container.ts                 # Inyección de dependencias
├── presentation/                    # Capa de Presentación
│   ├── controllers/                 # Controladores HTTP
│   └── middleware/                  # Middleware personalizado
├── security/                        # Seguridad
│   ├── sanitization.ts              # Sanitización de datos
│   ├── csp.ts                       # Content Security Policy
│   ├── file-validation.ts           # Validación de archivos
│   └── react-escape.tsx             # Escape para React
├── validations/                     # Validaciones
│   └── [module].ts                  # Esquemas Zod por módulo
├── logging/                         # Logging y Monitoreo
│   ├── logger.ts                    # Logger principal
│   ├── edge-logger.ts               # Logger para Edge Runtime
│   └── alerts.ts                    # Sistema de alertas
├── auth/                            # Autenticación
│   ├── jwt-manager.ts               # Gestión de JWT
│   ├── 2fa-manager.ts               # Autenticación de dos factores
│   ├── session-manager.ts           # Gestión de sesiones
│   ├── oauth-manager.ts             # OAuth providers
│   └── password-policies.ts         # Políticas de contraseñas
├── rate-limit.ts                    # Rate limiting
└── hooks/                           # React Hooks
    ├── use-[module].ts              # Hooks por módulo
    └── use-current-tenant.ts        # Hook de tenant actual

app/
├── api/                             # API Routes
│   ├── [module]/                    # Endpoints por módulo
│   │   ├── route.ts                 # GET, POST principales
│   │   └── [id]/                    # Endpoints por ID
│   │       ├── route.ts             # GET, PUT, DELETE
│   │       └── [submodule]/         # Sub-recursos
│   └── [module]-v2/                 # Endpoints con nueva arquitectura
├── dashboard/                       # Páginas del dashboard
│   ├── [module]/                    # Páginas por módulo
│   │   └── page.tsx                 # Página principal
│   └── layout.tsx                   # Layout del dashboard
└── [auth-pages]/                    # Páginas de autenticación

components/
├── ui/                              # Componentes base (shadcn/ui)
├── [module]/                        # Componentes por módulo
│   ├── [module]-list.tsx            # Lista de elementos
│   ├── [module]-form.tsx            # Formulario
│   └── [module]-[action].tsx        # Acciones específicas
└── layout/                          # Componentes de layout

scripts/                             # Scripts de base de datos
├── [NNN]_[description].sql          # Scripts SQL numerados
└── [description].js                 # Scripts de validación/testing

__tests__/                           # Tests
├── integration/                     # Tests de integración
│   └── api/                         # Tests de API
└── [module]/                        # Tests por módulo
```

---

## 🔧 **PATRONES DE IMPLEMENTACIÓN**

### **1. Value Objects**

```typescript
// lib/domain/value-objects/[Entity]Id.ts
export class EntityId {
  private readonly value: string

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('EntityId cannot be empty')
    }
    
    // Validación específica (UUID, etc.)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(value)) {
      throw new Error('EntityId must be a valid UUID')
    }
    
    this.value = value.trim()
  }

  getValue(): string {
    return this.value
  }

  equals(other: EntityId): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }

  static fromString(value: string): EntityId {
    return new EntityId(value)
  }

  static isValid(value: string): boolean {
    try {
      new EntityId(value)
      return true
    } catch {
      return false
    }
  }
}
```

### **2. Entities**

```typescript
// lib/domain/entities/[Entity].ts
import { EntityId } from '../value-objects/EntityId'

export class Entity {
  constructor(
    private readonly id: EntityId,
    private readonly name: string,
    private readonly tenantId: EntityId,
    private readonly isActive: boolean,
    private readonly createdAt: Date,
    private readonly updatedAt: Date
  ) {
    this.validate()
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Name cannot be empty')
    }
    
    if (this.name.length > 100) {
      throw new Error('Name cannot exceed 100 characters')
    }
  }

  // Getters
  getId(): EntityId { return this.id }
  getName(): string { return this.name }
  getTenantId(): EntityId { return this.tenantId }
  getIsActive(): boolean { return this.isActive }
  getCreatedAt(): Date { return this.createdAt }
  getUpdatedAt(): Date { return this.updatedAt }

  // Métodos de negocio
  public activate(): Entity {
    if (this.isActive) return this
    
    return new Entity(
      this.id,
      this.name,
      this.tenantId,
      true,
      this.createdAt,
      new Date()
    )
  }

  public deactivate(): Entity {
    if (!this.isActive) return this
    
    return new Entity(
      this.id,
      this.name,
      this.tenantId,
      false,
      this.createdAt,
      new Date()
    )
  }

  // Serialización
  public toPlainObject(): any {
    return {
      id: this.id.getValue(),
      name: this.name,
      tenantId: this.tenantId.getValue(),
      isActive: this.isActive,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    }
  }

  public static fromPlainObject(data: any): Entity {
    return new Entity(
      EntityId.fromString(data.id),
      data.name,
      EntityId.fromString(data.tenantId),
      data.isActive,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    )
  }
}
```

### **3. Repository Interfaces**

```typescript
// lib/domain/interfaces/[Entity]Repository.ts
import { Entity } from '../entities/Entity'
import { EntityId } from '../value-objects/EntityId'
import { TenantId } from '../value-objects/TenantId'

export interface EntityFilters {
  name?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

export interface IEntityRepository {
  findById(id: EntityId, tenantId: TenantId): Promise<Entity | null>
  findByTenant(tenantId: TenantId, filters?: EntityFilters): Promise<Entity[]>
  findActiveByTenant(tenantId: TenantId): Promise<Entity[]>
  save(entity: Entity): Promise<Entity>
  delete(id: EntityId, tenantId: TenantId): Promise<void>
  exists(id: EntityId, tenantId: TenantId): Promise<boolean>
  countByTenant(tenantId: TenantId, filters?: EntityFilters): Promise<number>
  countActiveByTenant(tenantId: TenantId): Promise<number>
}
```

### **4. Repository Implementations**

```typescript
// lib/infrastructure/repositories/Supabase[Entity]Repository.ts
import { IEntityRepository, EntityFilters } from '../../domain/interfaces/EntityRepository'
import { Entity } from '../../domain/entities/Entity'
import { EntityId } from '../../domain/value-objects/EntityId'
import { TenantId } from '../../domain/value-objects/TenantId'
import { SupabaseClient } from '@supabase/supabase-js'

export class SupabaseEntityRepository implements IEntityRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: EntityId, tenantId: TenantId): Promise<Entity | null> {
    const { data, error } = await this.supabase
      .from('entities')
      .select('*')
      .eq('id', id.getValue())
      .eq('tenant_id', tenantId.getValue())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows returned
      }
      throw new Error(`Database error: ${error.message}`)
    }

    if (!data) {
      return null
    }

    return this.mapToEntity(data)
  }

  async findByTenant(tenantId: TenantId, filters?: EntityFilters): Promise<Entity[]> {
    let query = this.supabase
      .from('entities')
      .select('*')
      .eq('tenant_id', tenantId.getValue())

    // Aplicar filtros
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    if (filters?.name) {
      query = query.ilike('name', `%${filters.name}%`)
    }

    // Aplicar paginación
    if (filters?.limit && filters?.offset !== undefined) {
      query = query.range(filters.offset, filters.offset + filters.limit - 1)
    }

    const { data, error } = await query
      .order('sort_order')
      .order('name')

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    if (!data) {
      return []
    }

    return data.map(this.mapToEntity)
  }

  async save(entity: Entity): Promise<Entity> {
    const entityData = this.mapToDatabase(entity)
    
    const { data, error } = await this.supabase
      .from('entities')
      .upsert(entityData)
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  async delete(id: EntityId, tenantId: TenantId): Promise<void> {
    const { error } = await this.supabase
      .from('entities')
      .delete()
      .eq('id', id.getValue())
      .eq('tenant_id', tenantId.getValue())

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
  }

  async exists(id: EntityId, tenantId: TenantId): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('entities')
      .select('id')
      .eq('id', id.getValue())
      .eq('tenant_id', tenantId.getValue())
      .single()

    return !error && !!data
  }

  async countByTenant(tenantId: TenantId, filters?: EntityFilters): Promise<number> {
    let query = this.supabase
      .from('entities')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId.getValue())

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    if (filters?.name) {
      query = query.ilike('name', `%${filters.name}%`)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return count || 0
  }

  async countActiveByTenant(tenantId: TenantId): Promise<number> {
    return this.countByTenant(tenantId, { isActive: true })
  }

  // Métodos privados de mapeo
  private mapToEntity(data: any): Entity {
    return Entity.fromPlainObject({
      id: data.id,
      name: data.name,
      tenantId: data.tenant_id,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    })
  }

  private mapToDatabase(entity: Entity): any {
    return {
      id: entity.getId().getValue(),
      name: entity.getName(),
      tenant_id: entity.getTenantId().getValue(),
      is_active: entity.getIsActive(),
      created_at: entity.getCreatedAt().toISOString(),
      updated_at: entity.getUpdatedAt().toISOString()
    }
  }
}
```

### **5. DTOs**

```typescript
// lib/application/dto/[Entity]Dto.ts
export interface EntityDto {
  id: string
  name: string
  tenantId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateEntityDto {
  name: string
  description?: string
  isActive?: boolean
  sortOrder?: number
}

export interface UpdateEntityDto {
  name?: string
  description?: string
  isActive?: boolean
  sortOrder?: number
}

export interface EntityListDto {
  entities: EntityDto[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
```

### **6. Use Cases**

```typescript
// lib/application/use-cases/Get[Entities]UseCase.ts
import { IEntityRepository } from '../../domain/interfaces/EntityRepository'
import { IUserRepository } from '../../domain/interfaces/UserRepository'
import { EntityDto, EntityListDto } from '../dto/EntityDto'
import { EntityId } from '../../domain/value-objects/EntityId'
import { TenantId } from '../../domain/value-objects/TenantId'
import { UserId } from '../../domain/value-objects/UserId'

export interface GetEntitiesRequest {
  userId: string
  tenantId?: string
  filters?: {
    name?: string
    isActive?: boolean
    page?: number
    limit?: number
  }
}

export class GetEntitiesUseCase {
  constructor(
    private readonly entityRepository: IEntityRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: GetEntitiesRequest): Promise<EntityListDto> {
    // 1. Validar y convertir IDs
    const userId = UserId.fromString(request.userId)
    const tenantId = request.tenantId ? TenantId.fromString(request.tenantId) : null

    // 2. Obtener usuario
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // 3. Determinar tenant
    const finalTenantId = tenantId || user.getTenantId()
    if (!finalTenantId) {
      throw new Error('User does not have access to any tenant')
    }

    // 4. Validar acceso del usuario al tenant
    if (!user.getIsAdmin() && !user.belongsToTenant(finalTenantId)) {
      throw new Error('User does not have access to this tenant')
    }

    // 5. Preparar filtros
    const filters = {
      name: request.filters?.name,
      isActive: request.filters?.isActive,
      limit: request.filters?.limit || 50,
      offset: request.filters?.offset || 0
    }

    // 6. Obtener entidades
    const entities = await this.entityRepository.findByTenant(finalTenantId, filters)

    // 7. Obtener total para paginación
    const total = await this.entityRepository.countByTenant(finalTenantId, filters)

    // 8. Retornar respuesta
    const page = Math.floor(filters.offset! / filters.limit!) + 1
    const hasMore = (filters.offset! + filters.limit!) < total
    
    return {
      entities: entities.map(this.mapToDto),
      total,
      page,
      limit: filters.limit!,
      hasMore
    }
  }

  private mapToDto(entity: Entity): EntityDto {
    return {
      id: entity.getId().getValue(),
      name: entity.getName(),
      tenantId: entity.getTenantId().getValue(),
      isActive: entity.getIsActive(),
      createdAt: entity.getCreatedAt().toISOString(),
      updatedAt: entity.getUpdatedAt().toISOString()
    }
  }
}
```

### **7. Controllers**

```typescript
// lib/presentation/controllers/[Entity]Controller.ts
import { NextRequest, NextResponse } from 'next/server'
import { GetEntitiesUseCase } from '../../application/use-cases/GetEntitiesUseCase'
import { CreateEntityUseCase } from '../../application/use-cases/CreateEntityUseCase'
import { EntityDto, CreateEntityDto } from '../../application/dto/EntityDto'

export class EntityController {
  constructor(
    private readonly getEntitiesUseCase: GetEntitiesUseCase,
    private readonly createEntityUseCase: CreateEntityUseCase
  ) {}

  async getEntities(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const queryParams = this.extractQueryParams(request)

      const result = await this.getEntitiesUseCase.execute({
        userId,
        tenantId,
        filters: queryParams
      })

      return NextResponse.json({
        success: true,
        data: result
      })

    } catch (error) {
      return this.handleError(error)
    }
  }

  async createEntity(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = this.extractUserId(request)
      const tenantId = this.extractTenantId(request)
      const body = this.extractBody(request)

      const result = await this.createEntityUseCase.execute({
        userId,
        tenantId,
        ...body
      })

      return NextResponse.json({
        success: true,
        data: this.mapToDto(result),
        message: 'Entity created successfully'
      }, { status: 201 })

    } catch (error) {
      return this.handleError(error)
    }
  }

  // Métodos privados de extracción
  private extractUserId(request: NextRequest): string {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }
    // TODO: Implementar extracción real del JWT
    return 'user-id-placeholder'
  }

  private extractTenantId(request: NextRequest): string | undefined {
    return request.headers.get('x-tenant-id') || undefined
  }

  private extractQueryParams(request: NextRequest): any {
    const url = new URL(request.url)
    return {
      name: url.searchParams.get('name') || undefined,
      isActive: url.searchParams.get('is_active') === 'true' ? true : 
                url.searchParams.get('is_active') === 'false' ? false : undefined,
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '50')
    }
  }

  private extractBody(request: NextRequest): CreateEntityDto {
    // TODO: Implementar validación con Zod
    return {} as CreateEntityDto
  }

  private mapToDto(entity: Entity): EntityDto {
    return {
      id: entity.getId().getValue(),
      name: entity.getName(),
      tenantId: entity.getTenantId().getValue(),
      isActive: entity.getIsActive(),
      createdAt: entity.getCreatedAt().toISOString(),
      updatedAt: entity.getUpdatedAt().toISOString()
    }
  }

  private handleError(error: any): NextResponse {
    console.error('[EntityController] Error:', error)

    // Mapear errores específicos a códigos HTTP
    if (error.message === 'Authorization header required') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    if (error.message === 'User not found') {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    if (error.message === 'User does not have access to this tenant') {
      return NextResponse.json({
        success: false,
        error: 'Access denied'
      }, { status: 403 })
    }

    // Error genérico
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
```

### **8. API Routes**

```typescript
// app/api/[module]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { EntityController } from '@/lib/presentation/controllers/EntityController'
import { GetEntitiesUseCase } from '@/lib/application/use-cases/GetEntitiesUseCase'
import { CreateEntityUseCase } from '@/lib/application/use-cases/CreateEntityUseCase'
import { getEntityRepository, getUserRepository } from '@/lib/infrastructure/container'

// Inyección de dependencias
const entityRepository = getEntityRepository()
const userRepository = getUserRepository()

const getEntitiesUseCase = new GetEntitiesUseCase(entityRepository, userRepository)
const createEntityUseCase = new CreateEntityUseCase(entityRepository, userRepository)

const controller = new EntityController(getEntitiesUseCase, createEntityUseCase)

export async function GET(request: NextRequest) {
  return controller.getEntities(request)
}

export async function POST(request: NextRequest) {
  return controller.createEntity(request)
}
```

---

## 📝 **ESTÁNDARES DE CÓDIGO**

### **1. Naming Conventions**
- **Clases**: PascalCase (`EntityController`, `GetEntitiesUseCase`)
- **Interfaces**: I + PascalCase (`IEntityRepository`)
- **Métodos**: camelCase (`getEntities`, `createEntity`)
- **Variables**: camelCase (`entityId`, `tenantId`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_NAME_LENGTH`)
- **Archivos**: kebab-case (`entity-controller.ts`)

### **2. Límites de Tamaño**
- **Métodos/Funciones**: Máximo 50 líneas
- **Hooks personalizados**: Máximo 80 líneas
- **Componentes React**: Máximo 150 líneas
- **Archivos de utilidades**: Máximo 300 líneas
- **Archivos de página/layout**: Máximo 400 líneas

### **3. Imports**
```typescript
// 1. Librerías externas
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 2. Imports internos (ordenados alfabéticamente)
import { Entity } from '@/lib/domain/entities/Entity'
import { EntityId } from '@/lib/domain/value-objects/EntityId'
import { IEntityRepository } from '@/lib/domain/interfaces/EntityRepository'
```

### **4. Validaciones con Zod**
```typescript
// lib/validations/[module].ts
import { z } from "zod"
import { sanitizeText, isSafeString } from "@/lib/security/sanitization"

export const CreateEntitySchema = z.object({
  name: z.string()
    .min(1, "Nombre es requerido")
    .max(100, "Nombre no puede exceder 100 caracteres")
    .transform(sanitizeText)
    .refine(name => name.length > 0, "Nombre no puede estar vacío después de sanitización")
    .refine(name => isSafeString(name), "Nombre contiene caracteres peligrosos"),
  
  description: z.string()
    .max(500, "Descripción no puede exceder 500 caracteres")
    .transform(sanitizeText)
    .refine(desc => !desc || isSafeString(desc), "Descripción contiene caracteres peligrosos")
    .optional(),
  
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0)
})
```

---

## 🔄 **FLUJO DE DESARROLLO**

### **Paso 1: Análisis de Requerimientos**
1. Identificar entidades de dominio
2. Definir casos de uso
3. Mapear relaciones entre entidades
4. Identificar validaciones necesarias

### **Paso 2: Implementación de Dominio**
1. Crear Value Objects
2. Crear Entities
3. Definir Repository Interfaces
4. Implementar lógica de negocio

### **Paso 3: Implementación de Aplicación**
1. Crear DTOs
2. Implementar Use Cases
3. Crear Services (si es necesario)

### **Paso 4: Implementación de Infraestructura**
1. Implementar Repositories
2. Configurar Dependency Injection
3. Crear scripts de base de datos

### **Paso 5: Implementación de Presentación**
1. Crear Controllers
2. Implementar API Routes
3. Crear componentes React
4. Implementar hooks

### **Paso 6: Testing**
1. Tests de Value Objects
2. Tests de Entities
3. Tests de Use Cases
4. Tests de Controllers
5. Tests de integración

### **Paso 7: Seguridad**
1. Validaciones con Zod
2. Sanitización de datos
3. Rate limiting
4. Logging de seguridad

---

## 🧪 **TESTING**

### **Estructura de Tests**
```
__tests__/
├── integration/
│   └── api/
│       └── [module].test.ts
├── lib/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── [Entity].test.ts
│   │   └── value-objects/
│   │       └── [Entity]Id.test.ts
│   ├── application/
│   │   └── use-cases/
│   │       └── [UseCase].test.ts
│   └── presentation/
│       └── controllers/
│           └── [Controller].test.ts
```

### **Patrón de Test**
```typescript
// __tests__/lib/domain/entities/Entity.test.ts
import { Entity } from '@/lib/domain/entities/Entity'
import { EntityId } from '@/lib/domain/value-objects/EntityId'
import { TenantId } from '@/lib/domain/value-objects/TenantId'

describe('Entity', () => {
  let validEntityId: EntityId
  let validTenantId: TenantId
  let now: Date

  beforeEach(() => {
    validEntityId = EntityId.fromString('123e4567-e89b-12d3-a456-426614174000')
    validTenantId = TenantId.fromString('123e4567-e89b-12d3-a456-426614174001')
    now = new Date()
  })

  describe('constructor', () => {
    it('should create a valid Entity', () => {
      const entity = new Entity(
        validEntityId,
        'Test Entity',
        validTenantId,
        true,
        now,
        now
      )

      expect(entity.getId()).toBe(validEntityId)
      expect(entity.getName()).toBe('Test Entity')
      expect(entity.getIsActive()).toBe(true)
    })

    it('should throw error for empty name', () => {
      expect(() => new Entity(
        validEntityId,
        '',
        validTenantId,
        true,
        now,
        now
      )).toThrow('Name cannot be empty')
    })
  })

  describe('activate', () => {
    it('should activate an inactive entity', () => {
      const entity = new Entity(
        validEntityId,
        'Test Entity',
        validTenantId,
        false,
        now,
        now
      )

      const activatedEntity = entity.activate()

      expect(activatedEntity.getIsActive()).toBe(true)
      expect(activatedEntity.getId()).toBe(validEntityId)
    })
  })
})
```

---

## 🔒 **SEGURIDAD**

### **1. Validaciones Obligatorias**
- **Zod schemas** para todos los inputs
- **Sanitización** de todos los strings
- **Validación de tipos** estricta
- **Rate limiting** en todos los endpoints

### **2. Headers de Seguridad**
```typescript
// Aplicados automáticamente por middleware
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
```

### **3. Logging de Seguridad**
```typescript
// Eventos que se deben loguear
- rateLimitExceeded
- xssAttempt
- sqlInjectionAttempt
- failedLogin
- successfulLogin
- unauthorizedAccess
- resourceCreated
- resourceUpdated
- resourceDeleted
```

---

## 📊 **LOGGING Y MONITOREO**

### **1. Tipos de Logs**
- **General**: Operaciones normales
- **Security**: Eventos de seguridad
- **Error**: Errores y excepciones
- **Audit**: Cambios importantes

### **2. Estructura de Logs**
```typescript
{
  timestamp: '2025-01-07T10:30:00.000Z',
  level: 'info',
  event: 'resourceCreated',
  userId: 'user-123',
  resourceType: 'configuration',
  resourceId: 'config-456',
  details: {
    name: 'Test Configuration',
    tenantId: 'tenant-789'
  },
  metadata: {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    endpoint: '/api/configurations'
  }
}
```

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

### **Para Nueva Funcionalidad:**

#### **📋 Fase 1: Análisis**
- [ ] Definir entidades de dominio
- [ ] Identificar casos de uso
- [ ] Mapear relaciones
- [ ] Definir validaciones

#### **📋 Fase 2: Dominio**
- [ ] Crear Value Objects
- [ ] Crear Entities
- [ ] Definir Repository Interfaces
- [ ] Implementar lógica de negocio

#### **📋 Fase 3: Aplicación**
- [ ] Crear DTOs
- [ ] Implementar Use Cases
- [ ] Crear Services (si necesario)

#### **📋 Fase 4: Infraestructura**
- [ ] Implementar Repositories
- [ ] Configurar Dependency Injection
- [ ] Crear scripts SQL

#### **📋 Fase 5: Presentación**
- [ ] Crear Controllers
- [ ] Implementar API Routes
- [ ] Crear componentes React
- [ ] Implementar hooks

#### **📋 Fase 6: Testing**
- [ ] Tests de Value Objects
- [ ] Tests de Entities
- [ ] Tests de Use Cases
- [ ] Tests de Controllers
- [ ] Tests de integración

#### **📋 Fase 7: Seguridad**
- [ ] Validaciones Zod
- [ ] Sanitización
- [ ] Rate limiting
- [ ] Logging de seguridad

#### **📋 Fase 8: Validación**
- [ ] Build exitoso
- [ ] Tests pasando
- [ ] Funcionalidad probada
- [ ] Documentación actualizada

---

## 🚀 **COMANDOS ÚTILES**

### **Desarrollo**
```bash
# Iniciar servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

### **Base de Datos**
```bash
# Ejecutar script de validación
node scripts/validate_[module].js

# Ejecutar script SQL
psql -h [HOST] -U [USER] -d [DATABASE] -f scripts/[NNN]_[description].sql
```

---

## 📚 **REFERENCIAS**

### **Archivos de Referencia**
- `REFACTORING_ANALYSIS.md` - Análisis completo de la arquitectura
- `TESTING_GUIDE.md` - Guía detallada de testing
- `FASE5_ARQUITECTURA_PLAN.md` - Plan de implementación de Clean Architecture

### **Patrones Implementados**
- **Clean Architecture** - Separación de capas
- **Repository Pattern** - Abstracción de datos
- **Use Case Pattern** - Lógica de aplicación
- **DTO Pattern** - Transferencia de datos
- **Dependency Injection** - Gestión de dependencias

---

## 🎯 **PRÓXIMOS PASOS**

Cuando solicites una nueva funcionalidad, seguiré este flujo:

1. **Análisis** - Identificar entidades y casos de uso
2. **Implementación** - Seguir el patrón establecido
3. **Testing** - Crear tests completos
4. **Validación** - Verificar que todo funciona
5. **Documentación** - Actualizar esta guía si es necesario

**¡Esta guía asegura consistencia y calidad en todas las futuras implementaciones!** 🎉
