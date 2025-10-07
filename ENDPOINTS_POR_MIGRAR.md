# 📋 Endpoints por Migrar a la Nueva Arquitectura

## ✅ **Endpoints Ya Migrados:**
- ✅ `/api/configurations-v2` - **MIGRADO** (nueva arquitectura)

---

## 🚧 **Endpoints Pendientes de Migración:**

### **🔐 Autenticación (16 endpoints)**
```
❌ /api/auth/login                    - Login con 2FA
❌ /api/auth/refresh                  - Renovar tokens
❌ /api/auth/logout                   - Cerrar sesión
❌ /api/auth/2fa/setup               - Configurar 2FA
❌ /api/auth/2fa/verify              - Verificar código 2FA
❌ /api/auth/2fa/disable             - Desactivar 2FA
❌ /api/auth/sessions                - Listar sesiones
❌ /api/auth/sessions/revoke-all     - Revocar todas las sesiones
❌ /api/auth/oauth/[provider]        - Iniciar OAuth
❌ /api/auth/oauth/callback/[provider] - Callback OAuth
❌ /api/auth/password/change         - Cambiar contraseña
❌ /api/auth/password/validate       - Validar contraseña
```

### **⚙️ Configuraciones (5 endpoints)**
```
❌ /api/configurations               - CRUD de tipos de configuración
❌ /api/configurations/[id]          - Operaciones por ID
❌ /api/configurations/[id]/values   - CRUD de valores
❌ /api/configurations/[id]/values/[valueId] - Operaciones de valores
❌ /api/configurations/resolve-id/[id] - Resolver ID de configuración
```

### **👨‍💼 Administración (2 endpoints)**
```
❌ /api/admin/security-alerts        - Alertas de seguridad
❌ /api/admin/security-metrics       - Métricas de seguridad
```

### **📊 Auditoría (1 endpoint)**
```
❌ /api/audit/user-action            - Acciones de usuario
```

---

## 📊 **Resumen de Migración:**

### **Total de Endpoints:**
- **✅ Migrados**: 1 endpoint (6%)
- **❌ Pendientes**: 24 endpoints (94%)

### **Por Categoría:**
- **🔐 Autenticación**: 12 endpoints pendientes
- **⚙️ Configuraciones**: 5 endpoints pendientes  
- **👨‍💼 Administración**: 2 endpoints pendientes
- **📊 Auditoría**: 1 endpoint pendiente

---

## 🎯 **Plan de Migración Recomendado:**

### **FASE 1: Configuraciones (Prioridad Alta)**
```
1. /api/configurations               - Endpoint principal
2. /api/configurations/[id]          - Operaciones por ID
3. /api/configurations/[id]/values   - CRUD de valores
4. /api/configurations/[id]/values/[valueId] - Operaciones de valores
5. /api/configurations/resolve-id/[id] - Resolver ID
```

### **FASE 2: Autenticación (Prioridad Media)**
```
1. /api/auth/login                   - Login con 2FA
2. /api/auth/refresh                 - Renovar tokens
3. /api/auth/logout                  - Cerrar sesión
4. /api/auth/sessions                - Gestión de sesiones
5. /api/auth/2fa/*                   - Autenticación de dos factores
6. /api/auth/password/*              - Políticas de contraseñas
7. /api/auth/oauth/*                 - Integración OAuth
```

### **FASE 3: Administración y Auditoría (Prioridad Baja)**
```
1. /api/admin/security-alerts        - Alertas de seguridad
2. /api/admin/security-metrics       - Métricas de seguridad
3. /api/audit/user-action            - Acciones de usuario
```

---

## 🔧 **Estructura de Migración:**

### **Para cada endpoint, necesitamos:**

#### **1. Domain Layer:**
- ✅ **Entidades**: Ya creadas (User, ConfigurationType)
- ✅ **Value Objects**: Ya creados (UserId, TenantId, ConfigurationId)
- ✅ **Interfaces**: Ya creadas (UserRepository, ConfigurationRepository)

#### **2. Application Layer:**
- ⏳ **Use Cases**: Crear casos de uso específicos
- ⏳ **Services**: Extender servicios existentes
- ⏳ **DTOs**: Crear DTOs específicos

#### **3. Infrastructure Layer:**
- ✅ **Repositorios**: Ya creados (SupabaseUserRepository, SupabaseConfigurationRepository)
- ✅ **Container DI**: Ya configurado

#### **4. Presentation Layer:**
- ⏳ **Controllers**: Crear controladores específicos
- ⏳ **Middleware**: Usar AuthMiddleware existente
- ⏳ **Validators**: Crear validadores de entrada

---

## 🚀 **Próximos Pasos:**

### **Inmediato:**
1. **Migrar `/api/configurations`** - Endpoint principal de configuraciones
2. **Crear use cases faltantes** - GetConfigurationById, UpdateConfiguration, DeleteConfiguration
3. **Extender ConfigurationController** - Agregar métodos faltantes
4. **Crear DTOs específicos** - Para operaciones CRUD

### **Siguiente:**
1. **Migrar endpoints de autenticación** - Usar nueva arquitectura
2. **Crear controladores de auth** - AuthController, SessionController
3. **Migrar endpoints de admin** - AdminController
4. **Crear tests** - Para todos los endpoints migrados

---

## 📋 **Checklist de Migración:**

### **Para cada endpoint:**
- [ ] **Crear Use Case** específico
- [ ] **Extender Service** si es necesario
- [ ] **Crear DTOs** específicos
- [ ] **Crear Controller** o extender existente
- [ ] **Refactorizar endpoint** para usar nueva arquitectura
- [ ] **Crear tests** unitarios
- [ ] **Verificar funcionalidad** end-to-end
- [ ] **Documentar cambios**

---

## 🎯 **Estimación de Esfuerzo:**

### **Tiempo por Endpoint:**
- **Configuraciones**: 2-3 horas por endpoint (5 endpoints = 10-15 horas)
- **Autenticación**: 1-2 horas por endpoint (12 endpoints = 12-24 horas)
- **Admin/Audit**: 1 hora por endpoint (3 endpoints = 3 horas)

### **Total Estimado:**
- **Tiempo total**: 25-42 horas
- **Endpoints por día**: 3-4 endpoints
- **Duración estimada**: 6-10 días de trabajo

---

## 🚀 **Recomendación:**

**¿Quieres que empecemos con la migración de los endpoints de configuraciones?** Son los más críticos y ya tenemos la base de la nueva arquitectura implementada.

**¿O prefieres continuar con otra fase del refactoring?**
