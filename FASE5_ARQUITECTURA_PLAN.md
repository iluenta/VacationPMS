# 🏗️ FASE 5: Separación de Capas (Arquitectura)

## 📋 **Análisis de Arquitectura Actual**

### **🔍 Problemas Identificados:**

#### **1. API Routes con Lógica Mezclada**
```typescript
// ❌ PROBLEMA: Lógica de negocio mezclada en API routes
export async function GET(request: NextRequest) {
  // 1. Autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  // 2. Validación de perfil
  const { data: profile, error: profileError } = await supabase.from("users")...
  
  // 3. Lógica de negocio (tenant selection)
  let tenantId = profile.tenant_id
  if (profile.is_admin) {
    const selectedTenantId = tenantHeaders['x-tenant-id'] || queryParams.tenant_id
    if (selectedTenantId) {
      tenantId = selectedTenantId
    }
  }
  
  // 4. Construcción de query
  let query = supabase.from("configuration_types").select(...)
  
  // 5. Aplicación de filtros
  if (queryParams.is_active !== undefined) {
    query = query.eq("is_active", queryParams.is_active === "true")
  }
  
  // 6. Ejecución y respuesta
  const { data: configurations, error } = await query...
}
```

#### **2. Repetición de Código**
- ✅ Autenticación repetida en cada endpoint
- ✅ Validación de perfil repetida
- ✅ Lógica de tenant repetida
- ✅ Construcción de queries repetida

#### **3. Difícil Testing**
- ❌ Lógica de negocio acoplada a HTTP
- ❌ Difícil mockear dependencias
- ❌ Tests complejos y frágiles

#### **4. Violación de Principios SOLID**
- ❌ Single Responsibility: Endpoints hacen demasiadas cosas
- ❌ Open/Closed: Difícil extender funcionalidad
- ❌ Dependency Inversion: Dependencias hardcodeadas

---

## 🎯 **Arquitectura Objetivo: Clean Architecture**

### **📐 Capas Propuestas:**

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   API Routes    │  │   Components    │  │   Hooks     │ │
│  │   (HTTP)        │  │   (React)       │  │   (State)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Use Cases     │  │   Services      │  │   DTOs      │ │
│  │   (Orchestrator)│  │   (Business)    │  │   (Data)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Entities      │  │   Value Objects │  │   Interfaces│ │
│  │   (Core)        │  │   (Types)       │  │   (Contracts)│ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  Repositories   │  │   External APIs │  │   Database  │ │
│  │   (Data Access) │  │   (Supabase)    │  │   (PostgreSQL)│ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ **Implementación Propuesta**

### **1. DOMAIN LAYER (Core Business Logic)**

#### **Entities (Entidades de Negocio)**
```typescript
// lib/domain/entities/ConfigurationType.ts
export class ConfigurationType {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly icon: string,
    public readonly color: string,
    public readonly isActive: boolean,
    public readonly sortOrder: number,
    public readonly tenantId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
  
  // Business methods
  public activate(): ConfigurationType {
    return new ConfigurationType(
      this.id, this.name, this.description, this.icon, this.color,
      true, this.sortOrder, this.tenantId, this.createdAt, new Date()
    )
  }
  
  public updateSortOrder(newOrder: number): ConfigurationType {
    return new ConfigurationType(
      this.id, this.name, this.description, this.icon, this.color,
      this.isActive, newOrder, this.tenantId, this.createdAt, new Date()
    )
  }
}
```

#### **Value Objects (Objetos de Valor)**
```typescript
// lib/domain/value-objects/TenantId.ts
export class TenantId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('TenantId cannot be empty')
    }
  }
  
  public getValue(): string {
    return this.value
  }
  
  public equals(other: TenantId): boolean {
    return this.value === other.value
  }
}
```

#### **Interfaces (Contratos)**
```typescript
// lib/domain/interfaces/ConfigurationRepository.ts
export interface ConfigurationRepository {
  findById(id: string, tenantId: string): Promise<ConfigurationType | null>
  findByTenant(tenantId: string, filters?: ConfigurationFilters): Promise<ConfigurationType[]>
  save(configuration: ConfigurationType): Promise<ConfigurationType>
  delete(id: string, tenantId: string): Promise<void>
  exists(id: string, tenantId: string): Promise<boolean>
}
```

### **2. APPLICATION LAYER (Use Cases & Services)**

#### **Use Cases (Casos de Uso)**
```typescript
// lib/application/use-cases/GetConfigurationsUseCase.ts
export class GetConfigurationsUseCase {
  constructor(
    private readonly configurationRepository: ConfigurationRepository,
    private readonly userService: UserService,
    private readonly tenantService: TenantService
  ) {}
  
  async execute(
    userId: string,
    filters: GetConfigurationsFilters
  ): Promise<ConfigurationType[]> {
    // 1. Validar usuario
    const user = await this.userService.getUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }
    
    // 2. Determinar tenant
    const tenantId = await this.tenantService.determineTenantId(user, filters.tenantId)
    
    // 3. Obtener configuraciones
    return await this.configurationRepository.findByTenant(tenantId, filters)
  }
}
```

#### **Services (Servicios de Aplicación)**
```typescript
// lib/application/services/UserService.ts
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}
  
  async getUserById(id: string): Promise<User | null> {
    return await this.userRepository.findById(id)
  }
  
  async validateUserAccess(userId: string, tenantId: string): Promise<boolean> {
    const user = await this.getUserById(userId)
    if (!user) return false
    
    return user.isAdmin || user.tenantId.equals(new TenantId(tenantId))
  }
}
```

### **3. INFRASTRUCTURE LAYER (Data Access)**

#### **Repositories (Implementaciones)**
```typescript
// lib/infrastructure/repositories/SupabaseConfigurationRepository.ts
export class SupabaseConfigurationRepository implements ConfigurationRepository {
  constructor(private readonly supabase: SupabaseClient) {}
  
  async findById(id: string, tenantId: string): Promise<ConfigurationType | null> {
    const { data, error } = await this.supabase
      .from('configuration_types')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()
    
    if (error || !data) return null
    
    return this.mapToEntity(data)
  }
  
  async findByTenant(tenantId: string, filters?: ConfigurationFilters): Promise<ConfigurationType[]> {
    let query = this.supabase
      .from('configuration_types')
      .select('*')
      .eq('tenant_id', tenantId)
    
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }
    
    const { data, error } = await query.order('sort_order').order('name')
    
    if (error) throw new Error(`Database error: ${error.message}`)
    
    return data.map(this.mapToEntity)
  }
  
  private mapToEntity(data: any): ConfigurationType {
    return new ConfigurationType(
      data.id,
      data.name,
      data.description,
      data.icon,
      data.color,
      data.is_active,
      data.sort_order,
      data.tenant_id,
      new Date(data.created_at),
      new Date(data.updated_at)
    )
  }
}
```

### **4. PRESENTATION LAYER (API Routes)**

#### **Controllers (Controladores)**
```typescript
// lib/presentation/controllers/ConfigurationController.ts
export class ConfigurationController {
  constructor(
    private readonly getConfigurationsUseCase: GetConfigurationsUseCase,
    private readonly createConfigurationUseCase: CreateConfigurationUseCase
  ) {}
  
  async getConfigurations(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Extraer datos del request
      const userId = await this.extractUserId(request)
      const filters = this.extractFilters(request)
      
      // 2. Ejecutar caso de uso
      const configurations = await this.getConfigurationsUseCase.execute(userId, filters)
      
      // 3. Retornar respuesta
      return NextResponse.json({
        success: true,
        data: configurations.map(c => this.mapToDto(c))
      })
    } catch (error) {
      return this.handleError(error)
    }
  }
  
  private async extractUserId(request: NextRequest): Promise<string> {
    // Lógica de autenticación
  }
  
  private extractFilters(request: NextRequest): GetConfigurationsFilters {
    // Extraer filtros de query params
  }
  
  private mapToDto(configuration: ConfigurationType): ConfigurationDto {
    // Mapear entidad a DTO
  }
  
  private handleError(error: any): NextResponse {
    // Manejo de errores
  }
}
```

#### **API Routes (Simplificadas)**
```typescript
// app/api/configurations/route.ts
import { ConfigurationController } from '@/lib/presentation/controllers/ConfigurationController'
import { container } from '@/lib/infrastructure/container'

const controller = container.get<ConfigurationController>('ConfigurationController')

export async function GET(request: NextRequest) {
  return await controller.getConfigurations(request)
}

export async function POST(request: NextRequest) {
  return await controller.createConfiguration(request)
}
```

---

## 🎯 **Beneficios de la Nueva Arquitectura**

### **✅ Ventajas:**

1. **Separación de Responsabilidades**
   - Cada capa tiene una responsabilidad específica
   - Lógica de negocio independiente de HTTP
   - Fácil testing y mantenimiento

2. **Testabilidad**
   - Mockear dependencias es trivial
   - Tests unitarios aislados
   - Tests de integración claros

3. **Mantenibilidad**
   - Código más limpio y organizado
   - Fácil agregar nuevas funcionalidades
   - Cambios localizados por capa

4. **Escalabilidad**
   - Fácil cambiar implementaciones
   - Agregar nuevos repositorios
   - Extender casos de uso

5. **Reutilización**
   - Servicios reutilizables
   - Lógica de negocio compartida
   - DTOs consistentes

---

## 📋 **Plan de Implementación**

### **PASO 1: Crear Estructura de Carpetas**
```
lib/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   └── interfaces/
├── application/
│   ├── use-cases/
│   ├── services/
│   └── dto/
├── infrastructure/
│   ├── repositories/
│   ├── external/
│   └── container.ts
└── presentation/
    ├── controllers/
    ├── middleware/
    └── validators/
```

### **PASO 2: Implementar Domain Layer**
- ✅ Crear entidades de negocio
- ✅ Definir value objects
- ✅ Crear interfaces de repositorios

### **PASO 3: Implementar Infrastructure Layer**
- ✅ Crear repositorios concretos
- ✅ Configurar inyección de dependencias
- ✅ Implementar mappers

### **PASO 4: Implementar Application Layer**
- ✅ Crear casos de uso
- ✅ Implementar servicios
- ✅ Definir DTOs

### **PASO 5: Refactorizar Presentation Layer**
- ✅ Crear controladores
- ✅ Simplificar API routes
- ✅ Implementar middleware

### **PASO 6: Testing**
- ✅ Tests unitarios para cada capa
- ✅ Tests de integración
- ✅ Tests end-to-end

---

## 🚀 **Próximos Pasos**

1. **Crear estructura de carpetas**
2. **Implementar Domain Layer**
3. **Configurar Dependency Injection**
4. **Refactorizar primer endpoint**
5. **Crear tests**
6. **Migrar resto de endpoints**

**¿Empezamos con la implementación?**
