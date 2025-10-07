# 🧪 Guía de Testing - Nueva Arquitectura

## 📋 **Resumen**

Esta guía explica cómo ejecutar y mantener los tests de la nueva arquitectura Clean Architecture implementada en el proyecto.

## 🏗️ **Estructura de Tests**

```
├── __tests__/                          # Tests de integración
│   └── integration/
│       └── api/
│           └── configurations-v2.test.ts
├── lib/
│   ├── domain/
│   │   ├── entities/__tests__/         # Tests de entidades
│   │   └── value-objects/__tests__/    # Tests de value objects
│   ├── application/
│   │   └── use-cases/__tests__/        # Tests de casos de uso
│   ├── infrastructure/
│   │   └── repositories/__tests__/     # Tests de repositorios
│   └── presentation/
│       └── controllers/__tests__/      # Tests de controladores
├── jest.config.js                      # Configuración de Jest
├── jest.setup.js                       # Setup de Jest
└── scripts/run-tests.js                # Script de ejecución
```

## 🚀 **Comandos de Testing**

### **Ejecutar Todos los Tests**
```bash
npm test
```

### **Ejecutar Tests con Cobertura**
```bash
npm run test:coverage
```

### **Ejecutar Tests en Modo Watch**
```bash
npm run test:watch
```

### **Ejecutar Tests para CI/CD**
```bash
npm run test:ci
```

### **Ejecutar Tests de Arquitectura**
```bash
npm run test:architecture
```

## 📊 **Tipos de Tests**

### **1. Tests de Value Objects**
- **Ubicación**: `lib/domain/value-objects/__tests__/`
- **Propósito**: Validar la lógica de negocio de los value objects
- **Ejemplos**: `UserId.test.ts`, `TenantId.test.ts`

```typescript
describe('UserId', () => {
  it('should create a valid UserId', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000'
    const userId = new UserId(validUuid)
    
    expect(userId.getValue()).toBe(validUuid)
  })
})
```

### **2. Tests de Entidades**
- **Ubicación**: `lib/domain/entities/__tests__/`
- **Propósito**: Validar la lógica de negocio de las entidades
- **Ejemplos**: `User.test.ts`, `ConfigurationType.test.ts`

```typescript
describe('User', () => {
  it('should activate an inactive user', () => {
    const user = new User(/* ... */)
    const activatedUser = user.activate()
    
    expect(activatedUser.isActive).toBe(true)
  })
})
```

### **3. Tests de Use Cases**
- **Ubicación**: `lib/application/use-cases/__tests__/`
- **Propósito**: Validar la lógica de aplicación
- **Ejemplos**: `GetConfigurationsUseCase.test.ts`

```typescript
describe('GetConfigurationsUseCase', () => {
  it('should return configurations successfully', async () => {
    // Arrange
    mockUserService.getUserById.mockResolvedValue(mockUser)
    
    // Act
    const result = await useCase.execute(request)
    
    // Assert
    expect(result.configurations).toHaveLength(2)
  })
})
```

### **4. Tests de Controladores**
- **Ubicación**: `lib/presentation/controllers/__tests__/`
- **Propósito**: Validar el manejo de HTTP requests
- **Ejemplos**: `ConfigurationController.test.ts`

```typescript
describe('ConfigurationController', () => {
  it('should return configurations successfully', async () => {
    const response = await controller.getConfigurations(mockRequest)
    
    expect(response.status).toBe(200)
    expect(responseData.success).toBe(true)
  })
})
```

### **5. Tests de Repositorios**
- **Ubicación**: `lib/infrastructure/repositories/__tests__/`
- **Propósito**: Validar el acceso a datos
- **Ejemplos**: `SupabaseConfigurationRepository.test.ts`

```typescript
describe('SupabaseConfigurationRepository', () => {
  it('should return configuration when found', async () => {
    const result = await repository.findById(mockConfigurationId, mockTenantId)
    
    expect(result).toBeDefined()
    expect(result?.name).toBe('Test Configuration')
  })
})
```

### **6. Tests de Integración**
- **Ubicación**: `__tests__/integration/`
- **Propósito**: Validar el flujo completo de endpoints
- **Ejemplos**: `api/configurations-v2.test.ts`

```typescript
describe('/api/configurations-v2', () => {
  it('should return 401 when authorization header is missing', async () => {
    const response = await GET(request)
    
    expect(response.status).toBe(401)
  })
})
```

## 🎯 **Cobertura de Tests**

### **Métricas Objetivo**
- **Cobertura Total**: > 80%
- **Cobertura de Líneas**: > 85%
- **Cobertura de Funciones**: > 90%
- **Cobertura de Ramas**: > 75%

### **Verificar Cobertura**
```bash
npm run test:coverage
```

El reporte se genera en:
- **HTML**: `./coverage/lcov-report/index.html`
- **LCOV**: `./coverage/lcov.info`

## 🔧 **Configuración**

### **Jest Configuration**
```javascript
// jest.config.js
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  }
}
```

### **Environment Variables**
```javascript
// jest.setup.js
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.JWT_SECRET = 'test-jwt-secret'
```

## 📝 **Mejores Prácticas**

### **1. Naming Conventions**
- **Archivos**: `*.test.ts` o `*.spec.ts`
- **Describe**: Nombre de la clase/función
- **It**: Comportamiento específico

### **2. Estructura AAA**
```typescript
it('should do something', () => {
  // Arrange - Preparar datos
  const mockData = { /* ... */ }
  
  // Act - Ejecutar acción
  const result = functionUnderTest(mockData)
  
  // Assert - Verificar resultado
  expect(result).toBe(expectedValue)
})
```

### **3. Mocking**
```typescript
// Mock dependencies
const mockService = {
  method: jest.fn()
} as jest.Mocked<Service>

// Reset mocks
beforeEach(() => {
  jest.clearAllMocks()
})
```

### **4. Async Testing**
```typescript
it('should handle async operations', async () => {
  // Arrange
  mockService.method.mockResolvedValue(expectedValue)
  
  // Act
  const result = await asyncFunction()
  
  // Assert
  expect(result).toBe(expectedValue)
  expect(mockService.method).toHaveBeenCalledWith(expectedParams)
})
```

## 🚨 **Troubleshooting**

### **Problemas Comunes**

1. **Tests fallan por módulos no encontrados**
   ```bash
   npm install --save-dev @types/jest jest
   ```

2. **Errores de configuración de TypeScript**
   ```bash
   npm install --save-dev @types/node
   ```

3. **Problemas con mocks de Supabase**
   ```typescript
   jest.mock('@supabase/supabase-js', () => ({
     createClient: jest.fn()
   }))
   ```

### **Debugging**
```bash
# Ejecutar tests con debug
npm test -- --verbose

# Ejecutar test específico
npm test -- User.test.ts

# Ejecutar tests con coverage y debug
npm run test:coverage -- --verbose
```

## 📈 **Métricas y Reportes**

### **Generar Reporte HTML**
```bash
npm run test:coverage
open ./coverage/lcov-report/index.html
```

### **Integración con CI/CD**
```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: npm run test:ci
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## 🎉 **Conclusión**

Los tests de la nueva arquitectura proporcionan:

- ✅ **Cobertura completa** de todas las capas
- ✅ **Validación de lógica de negocio** en entidades
- ✅ **Verificación de casos de uso** con mocks
- ✅ **Tests de integración** para endpoints
- ✅ **Reportes de cobertura** detallados

**¡La nueva arquitectura está completamente testeada y lista para producción!**
