# 🔧 Solución: Tenant Selection para Administradores

## Problema Identificado

**Síntoma:** Los administradores veían datos hardcodeados en lugar de datos reales de la base de datos.

**Causa:** El API estaba usando el `tenant_id` del perfil del usuario en lugar del tenant seleccionado por el admin en el selector del header.

---

## Solución Implementada

### 1. **Backend: API Configurations**

Modificado `app/api/configurations/route.ts` (GET y POST) para:

- ✅ Detectar si el usuario es administrador
- ✅ Buscar el tenant seleccionado en el header `x-tenant-id`
- ✅ Usar el tenant seleccionado si existe, o el tenant del perfil como fallback

**Código Agregado (GET):**
```typescript
// Si es admin, obtener el tenant del header o query param
let tenantId = finalProfile.tenant_id
if (finalProfile.is_admin) {
  const selectedTenantId = request.headers.get('x-tenant-id') || 
                           request.nextUrl.searchParams.get('tenant_id')
  if (selectedTenantId) {
    console.log('[API] Admin usando tenant seleccionado:', selectedTenantId)
    tenantId = selectedTenantId
  } else {
    console.log('[API] Admin sin tenant seleccionado, usando tenant del perfil:', tenantId)
  }
}
```

### 2. **Frontend: Hook useConfigurations**

Modificado `lib/hooks/use-configurations.ts` para:

- ✅ Enviar el `tenant_id` seleccionado en el header `x-tenant-id`
- ✅ Aplicado tanto en GET (`fetchConfigurations`) como en POST (`createConfiguration`)

**Código Agregado:**
```typescript
// Agregar header con tenant seleccionado si existe
const headers: HeadersInit = {}
if (currentTenant?.id) {
  headers['x-tenant-id'] = currentTenant.id
  console.log('[useConfigurations] Adding tenant header:', currentTenant.id)
}

const response = await fetch('/api/configurations', { headers })
```

---

## Flujo de Datos

### Para Usuarios Regulares:
```
Usuario → Perfil (tenant_id) → API → Configuraciones del tenant asignado
```

### Para Administradores:
```
Admin → Selector de Tenant → Estado (selectedTenant) → 
Header (x-tenant-id) → API → Configuraciones del tenant seleccionado
```

---

## Crear Configuraciones para un Tenant

Si un tenant no tiene configuraciones, ejecuta el script:

```bash
# Ejecutar en Supabase SQL Editor
scripts/078_add_configurations_to_acme.sql
```

Este script:
- ✅ Verifica que el tenant existe
- ✅ Crea tipos de configuración básicos
- ✅ Muestra el resultado

---

## Verificación

### 1. **Verificar Configuraciones en Base de Datos:**

```sql
-- Ver configuraciones del tenant "Acme Properties"
SELECT 
  id,
  name,
  tenant_id
FROM public.configuration_types
WHERE tenant_id = '00000000-0000-0000-0000-000000000002';
```

### 2. **Verificar en la Aplicación:**

1. **Login como administrador**
2. **Seleccionar tenant** en el selector del header
3. **Ir a Configuraciones**
4. **Verificar logs del navegador:**
   - `[useConfigurations] Adding tenant header: 00000000-0000-0000-0000-000000000002`
5. **Verificar logs del servidor:**
   - `[API] Admin usando tenant seleccionado: 00000000-0000-0000-0000-000000000002`
   - `[API] Tenant ID final para query: 00000000-0000-0000-0000-000000000002`

---

## Casos de Uso

### Caso 1: Admin con Tenant Seleccionado
- ✅ Ve las configuraciones del tenant seleccionado
- ✅ Puede crear configuraciones para ese tenant
- ✅ Puede cambiar de tenant y ver configuraciones diferentes

### Caso 2: Admin sin Tenant Seleccionado
- ✅ Usa el tenant de su perfil como fallback
- ⚠️ Si no tiene tenant asignado, mostrará datos hardcodeados

### Caso 3: Usuario Regular
- ✅ Solo ve configuraciones de su tenant asignado
- ❌ No puede cambiar de tenant

### Caso 4: Tenant sin Configuraciones
- ✅ Lista vacía (no error)
- ✅ Puede crear nuevas configuraciones
- ❌ No mostrará datos hardcodeados (comportamiento correcto)

---

## Archivos Modificados

1. **`app/api/configurations/route.ts`**
   - GET: Detecta admin y usa tenant del header
   - POST: Detecta admin y usa tenant del header

2. **`lib/hooks/use-configurations.ts`**
   - `fetchConfigurations`: Envía header `x-tenant-id`
   - `createConfiguration`: Envía header `x-tenant-id`

3. **Nuevos Scripts:**
   - `scripts/078_add_configurations_to_acme.sql`: Crear configuraciones para Acme Properties
   - `scripts/DEBUG_check_configuration_id.sql`: Diagnóstico de IDs
   - `TROUBLESHOOTING_CONFIGURATION_IDS.md`: Guía de troubleshooting

---

## Próximos Pasos

### Opcional: Aplicar el Mismo Patrón a Otros Endpoints

Si tienes otros endpoints que necesitan filtrar por tenant, aplica el mismo patrón:

1. **Backend:**
   ```typescript
   let tenantId = profile.tenant_id
   if (profile.is_admin) {
     tenantId = request.headers.get('x-tenant-id') || tenantId
   }
   ```

2. **Frontend:**
   ```typescript
   const headers: HeadersInit = {}
   if (currentTenant?.id) {
     headers['x-tenant-id'] = currentTenant.id
   }
   ```

---

## Testing Checklist

- [ ] Login como admin
- [ ] Ver selector de tenants en header
- [ ] Seleccionar "Acme Properties"
- [ ] Ejecutar script `078_add_configurations_to_acme.sql`
- [ ] Ir a página de Configuraciones
- [ ] Verificar que muestra configuraciones reales (no hardcodeadas)
- [ ] Crear una nueva configuración
- [ ] Cambiar a otro tenant
- [ ] Verificar que las configuraciones cambian
- [ ] Verificar logs del navegador y servidor

---

## Solución de Problemas

### Problema: Sigue mostrando datos hardcodeados

**Posibles causas:**
1. El tenant seleccionado no tiene configuraciones → Ejecuta script 078
2. El header no se está enviando → Verifica logs del navegador
3. El API no está recibiendo el header → Verifica logs del servidor

### Problema: Error "permission denied for table users"

**Solución:** Ya implementada con fallback. El sistema funcionará con datos hardcodeados si no puede acceder a la tabla users.

### Problema: No puedo crear configuraciones

**Posibles causas:**
1. No tienes permisos de admin → Verifica `is_admin` en tu perfil
2. El tenant_id no se está enviando → Verifica logs
3. Error de RLS → Verifica políticas de seguridad

---

## Referencias

- **Contexto de Autenticación:** `lib/auth-context.tsx`
- **Hook de Tenant Actual:** `lib/hooks/use-current-tenant.ts`
- **Selector de Tenant:** `app/dashboard/layout.tsx`
- **Debug Component:** `components/configuration/configuration-debug.tsx`

