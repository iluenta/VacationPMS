# 🔒 Guía de Seguridad RLS (Row Level Security)

## Problema Identificado

Las siguientes tablas tenían RLS **deshabilitado**, lo que representa un **riesgo de seguridad**:

- ❌ `tenants` - Unrestricted
- ❌ `users` - Unrestricted  
- ❌ `configuration_audit_log` - Unrestricted

Esto permitía acceso directo desde la API externa sin restricciones.

---

## Solución Implementada

### ✅ **Script Principal: `080_enable_rls_all_tables.sql`**

Este script:
1. ✅ Habilita RLS en todas las tablas
2. ✅ Crea funciones helper seguras
3. ✅ Configura políticas correctas para cada tabla
4. ✅ Mantiene la funcionalidad del backend intacta

---

## Arquitectura de Seguridad

### 🔑 **Dos Tipos de Acceso**

#### 1. **Cliente (Browser) - Anon Key**
- ✅ **Respeta RLS** automáticamente
- ✅ Solo puede acceder a datos permitidos por las políticas
- ✅ Usa `auth.uid()` para identificar al usuario
- ❌ **NO puede bypasear RLS**

```typescript
// Cliente - En el navegador
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // ← Anon Key
)

// Este query respeta RLS
const { data } = await supabase
  .from('configuration_types')
  .select('*')
// Solo devuelve datos del tenant del usuario
```

#### 2. **Servidor (API Routes) - Service Role Key**
- ✅ **Puede bypasear RLS** si es necesario
- ✅ Acceso completo a todas las tablas
- ✅ Operaciones administrativas
- ⚠️ **NUNCA exponer el service role key al cliente**

```typescript
// Servidor - En API routes
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient() // ← Usa Service Role Key

// Este query puede bypasear RLS
const { data } = await supabase
  .from('configuration_types')
  .select('*')
// Devuelve todos los datos
```

---

## Políticas RLS Configuradas

### 📋 **1. Tabla: `tenants`**

**SELECT:**
- ✅ Usuarios: Solo pueden ver su propio tenant
- ✅ Admins: Pueden ver todos los tenants

**INSERT/UPDATE/DELETE:**
- ✅ Solo administradores

```sql
-- Función helper
CREATE FUNCTION get_current_tenant_id() RETURNS uuid
-- Devuelve el tenant_id del usuario autenticado

-- Política
CREATE POLICY "Users can view their own tenant"
ON tenants FOR SELECT
USING (id = get_current_tenant_id() OR is_user_admin() = true);
```

---

### 👤 **2. Tabla: `users`**

**SELECT:**
- ✅ Usuarios: Solo su propio perfil
- ✅ Admins: Todos los usuarios

**UPDATE:**
- ✅ Usuarios: Solo su propio perfil
- ✅ Admins: Todos los usuarios

```sql
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (is_user_admin() = true);
```

---

### ⚙️ **3. Tabla: `configuration_types`**

**ALL (SELECT, INSERT, UPDATE, DELETE):**
- ✅ Usuarios: Solo configuraciones de su tenant
- ✅ Admins: Todas las configuraciones de cualquier tenant

```sql
CREATE POLICY "Users can view configuration types of their tenant"
ON configuration_types FOR SELECT
USING (
  tenant_id = get_current_tenant_id()
  OR is_user_admin() = true
);
```

---

### 📝 **4. Tabla: `configuration_values`**

**ALL (SELECT, INSERT, UPDATE, DELETE):**
- ✅ Usuarios: Solo valores de configuraciones de su tenant
- ✅ Admins: Todos los valores

**Nota:** Las políticas verifican el `tenant_id` del `configuration_type` padre.

```sql
CREATE POLICY "Users can view configuration values of their tenant"
ON configuration_values FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM configuration_types ct
    WHERE ct.id = configuration_values.configuration_type_id
    AND (ct.tenant_id = get_current_tenant_id() OR is_user_admin() = true)
  )
);
```

---

### 📊 **5. Tabla: `configuration_audit_log`**

**SELECT:**
- ✅ Usuarios: Solo logs de su tenant
- ✅ Admins: Todos los logs

**INSERT/UPDATE/DELETE:**
- ❌ Solo mediante triggers (no acceso directo)

```sql
CREATE POLICY "Users can view audit log of their tenant"
ON configuration_audit_log FOR SELECT
USING (
  tenant_id = get_current_tenant_id()
  OR is_user_admin() = true
);
```

---

## Funciones Helper

### `get_current_tenant_id()`
- Devuelve el `tenant_id` del usuario autenticado
- Usa `auth.uid()` para obtener el ID del usuario
- `SECURITY DEFINER` permite ejecutar con permisos elevados

### `is_user_admin()`
- Verifica si el usuario autenticado es administrador
- Devuelve `boolean`
- Usa `auth.uid()` para verificar

---

## Flujo de Seguridad

### 🔄 **Flujo Completo**

```
1. Usuario hace login
   ↓
2. Supabase Auth genera JWT con uid
   ↓
3. Cliente hace query con anon key
   ↓
4. RLS verifica políticas usando auth.uid()
   ↓
5. Solo devuelve datos permitidos
```

### 🔄 **Flujo del Backend (API Routes)**

```
1. Cliente hace request a /api/configurations
   ↓
2. API Route usa createClient() (service role)
   ↓
3. API obtiene usuario con supabase.auth.getUser()
   ↓
4. API hace query con tenant_id específico
   ↓
5. Backend puede filtrar por tenant manualmente
   ↓
6. Devuelve datos al cliente
```

---

## Verificación de Seguridad

### ✅ **Comprobar que RLS está habilitado:**

```sql
-- Ejecutar: scripts/079_check_rls_status.sql

SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public';
```

**Resultado esperado:**
```
| tablename                | rls_enabled |
|-------------------------|-------------|
| tenants                 | true        |
| users                   | true        |
| configuration_types     | true        |
| configuration_values    | true        |
| configuration_audit_log | true        |
```

### ✅ **Comprobar políticas:**

```sql
SELECT 
  tablename,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;
```

**Resultado esperado:**
```
| tablename                | total_policies |
|-------------------------|----------------|
| tenants                 | 2              |
| users                   | 4              |
| configuration_types     | 4              |
| configuration_values    | 4              |
| configuration_audit_log | 2              |
```

---

## Testing de Seguridad

### 🧪 **Test 1: Usuario Regular**

```typescript
// Login como usuario regular
const { data, error } = await supabase
  .from('configuration_types')
  .select('*')

// ✅ Solo devuelve configuraciones de su tenant
// ❌ NO devuelve configuraciones de otros tenants
```

### 🧪 **Test 2: Administrador**

```typescript
// Login como admin
const { data, error } = await supabase
  .from('configuration_types')
  .select('*')

// ✅ Devuelve configuraciones de TODOS los tenants
```

### 🧪 **Test 3: Sin Autenticación**

```typescript
// Sin login
const { data, error } = await supabase
  .from('configuration_types')
  .select('*')

// ❌ Error: No autorizado
// 🔒 RLS bloquea el acceso
```

---

## Impacto en la Aplicación

### ✅ **Lo que SIGUE funcionando:**

- ✅ API Routes del backend (usan service role)
- ✅ Queries desde componentes del servidor
- ✅ Operaciones administrativas
- ✅ Acceso de usuarios a sus propios datos
- ✅ Filtrado automático por tenant

### ⚠️ **Lo que CAMBIA:**

- ⚠️ Queries directos desde el cliente ahora respetan RLS
- ⚠️ Usuarios solo ven datos de su tenant
- ⚠️ Admins ven todos los datos

### ❌ **Lo que YA NO FUNCIONA (por seguridad):**

- ❌ Acceso directo sin autenticación
- ❌ Usuarios viendo datos de otros tenants
- ❌ Modificación de datos sin permisos

---

## Variables de Entorno Requeridas

```env
# .env.local

# Clave pública (OK exponer en cliente)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Clave privada (NUNCA exponer al cliente)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ← Solo en servidor
```

⚠️ **CRÍTICO:** 
- `ANON_KEY` → OK para cliente
- `SERVICE_ROLE_KEY` → **SOLO para servidor**

---

## Pasos de Implementación

### 1️⃣ **Ejecutar Scripts**

```bash
# 1. Verificar estado actual
Ejecutar: scripts/079_check_rls_status.sql

# 2. Habilitar RLS y crear políticas
Ejecutar: scripts/080_enable_rls_all_tables.sql

# 3. Verificar que se aplicó correctamente
Ejecutar: scripts/079_check_rls_status.sql nuevamente
```

### 2️⃣ **Verificar Variables de Entorno**

```bash
# Verificar que existen
cat .env.local | grep SUPABASE
```

### 3️⃣ **Reiniciar Servidor**

```bash
# Reiniciar el servidor de desarrollo
npm run dev
```

### 4️⃣ **Testing**

- [ ] Login como usuario regular
- [ ] Verificar que solo ve datos de su tenant
- [ ] Login como admin
- [ ] Verificar que ve datos de todos los tenants
- [ ] Crear nueva configuración
- [ ] Verificar que se guarda correctamente

---

## Troubleshooting

### ❌ **Error: "permission denied for table X"**

**Causa:** RLS está bloqueando el acceso

**Solución:**
1. Verificar que el usuario está autenticado: `supabase.auth.getUser()`
2. Verificar que las políticas existen: `SELECT * FROM pg_policies WHERE tablename = 'X'`
3. Verificar que el backend usa service role key

### ❌ **Error: "relation does not exist"**

**Causa:** Tabla no existe o no tienes permisos

**Solución:**
1. Verificar que la tabla existe en Supabase
2. Verificar que RLS está habilitado
3. Ejecutar script 080

### ❌ **No se muestran datos en el frontend**

**Causa:** RLS está filtrando los datos

**Solución:**
1. Verificar que el usuario tiene `tenant_id` asignado
2. Verificar que existen datos para ese tenant
3. Revisar logs del navegador y servidor

---

## Archivos Relacionados

- `scripts/079_check_rls_status.sql` - Verificación de RLS
- `scripts/080_enable_rls_all_tables.sql` - Habilitar RLS
- `lib/supabase/server.ts` - Cliente del servidor (service role)
- `lib/supabase/client.ts` - Cliente del navegador (anon key)

---

## Referencias

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

## ✅ Checklist de Seguridad

- [ ] RLS habilitado en todas las tablas
- [ ] Políticas creadas para cada tabla
- [ ] Funciones helper configuradas
- [ ] Service role key solo en servidor
- [ ] Anon key en cliente
- [ ] Testing completado
- [ ] Variables de entorno verificadas
- [ ] Documentación actualizada

---

**🔒 Con estas medidas, tu aplicación está protegida contra acceso no autorizado a través de la API externa.**

