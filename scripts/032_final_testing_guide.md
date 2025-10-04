# 🧪 Guía de Pruebas Finales - Nuevo Flujo de Registro

## ✅ **Estado Actual del Sistema**

### **Scripts Ejecutados Exitosamente:**
- ✅ **Script 028**: Funciones de ID correlativo creadas
- ✅ **Script 029**: RLS habilitado en tabla `tenants`

### **Funciones Disponibles:**
- ✅ `get_next_tenant_id()` → Genera siguiente ID correlativo
- ✅ `create_tenant_with_correlative_id(name, slug)` → Crea tenant con ID correlativo

## 🎯 **Pasos para Probar el Nuevo Flujo**

### **Paso 1: Probar las Funciones de Base de Datos**
```sql
-- Ejecutar en Supabase SQL Editor:
-- scripts/031_test_tenant_creation.sql
```

**Resultado esperado:**
- ✅ Se crean tenants con IDs correlativos
- ✅ Los slugs se generan correctamente
- ✅ Los nombres se almacenan correctamente

### **Paso 2: Probar el Formulario de Registro**

1. **Ir a** `http://localhost:3000/signup`
2. **Verificar** que aparece un campo de texto "Organización" (no combo)
3. **Verificar** que hay un límite de 15 caracteres
4. **Verificar** que aparece el mensaje informativo

### **Paso 3: Probar Registro Exitoso**

**Datos de prueba:**
```
Nombre completo: Juan Pérez
Email: juan.test@ejemplo.com
Organización: Mi Empresa
Contraseña: password123
Confirmar contraseña: password123
```

**Resultado esperado:**
- ✅ Se crea el tenant automáticamente
- ✅ Se envía email de verificación
- ✅ Se redirige a `/signup-success`

### **Paso 4: Verificar en Base de Datos**

```sql
-- Verificar que se creó el tenant
SELECT 
    id,
    name,
    slug,
    created_at
FROM public.tenants
WHERE name = 'Mi Empresa';

-- Verificar que se creó el usuario (después de verificar email)
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.tenant_id,
    t.name as tenant_name
FROM public.users u
JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email = 'juan.test@ejemplo.com';
```

### **Paso 5: Probar Validaciones**

#### **Caso 1: Nombre muy largo**
```
Organización: "Esta es una organización con nombre muy largo que excede 15 caracteres"
```
**Resultado esperado:** ❌ Error "El nombre de la organización no puede tener más de 15 caracteres"

#### **Caso 2: Nombre vacío**
```
Organización: ""
```
**Resultado esperado:** ❌ Error "Por favor, ingresa el nombre de tu organización"

#### **Caso 3: Contraseñas no coinciden**
```
Contraseña: "password123"
Confirmar contraseña: "password456"
```
**Resultado esperado:** ❌ Error "Las contraseñas no coinciden"

### **Paso 6: Probar Registro con Google**

1. **Completar** solo nombre y organización
2. **Hacer clic** en "Continuar con Google"
3. **Verificar** que se crea el tenant antes del OAuth
4. **Completar** OAuth con Google
5. **Verificar** que el usuario se asocia al tenant creado

## 🔍 **Verificaciones en Consola del Navegador**

### **Logs Esperados:**
```javascript
// Durante el registro:
[Signup] Tenant created: {id: "00000001-0000-4000-8000-000000000000", name: "Mi Empresa", slug: "mi-empresa"}

// Durante el login:
[AuthContext] Fetching profile for user: [user-id]
[AuthContext] Profile data: {id: "...", tenant_id: "00000001-0000-4000-8000-000000000000", ...}
[AuthContext] Tenant data: {id: "00000001-0000-4000-8000-000000000000", name: "Mi Empresa", slug: "mi-empresa"}
```

## 📊 **Estructura de Datos Esperada**

### **Tabla `tenants`:**
```sql
| id                                    | name      | slug      | created_at |
| ------------------------------------- | --------- | --------- | ---------- |
| 00000001-0000-4000-8000-000000000000 | Mi Empresa| mi-empresa| 2025-01-...|
```

### **Tabla `users`:**
```sql
| id                                    | email              | tenant_id                            | full_name |
| ------------------------------------- | ------------------ | ------------------------------------ | --------- |
| [user-uuid]                          | juan.test@ejemplo.com | 00000001-0000-4000-8000-000000000000 | Juan Pérez|
```

## 🚨 **Problemas Comunes y Soluciones**

### **Error: "Function create_tenant_with_correlative_id does not exist"**
**Solución:** Ejecutar `scripts/028_create_tenant_with_correlative_id.sql`

### **Error: "Permission denied for table tenants"**
**Solución:** Ejecutar `scripts/029_update_tenant_policies_for_signup.sql`

### **Error: "Organization name too long"**
**Solución:** Verificar que el límite de 15 caracteres está funcionando

### **Error: "Email already exists"**
**Solución:** Usar un email diferente para la prueba

## 🎉 **Criterios de Éxito**

- ✅ **Formulario** muestra campo de texto (no combo)
- ✅ **Validación** de 15 caracteres funciona
- ✅ **Tenant se crea** automáticamente durante registro
- ✅ **ID correlativo** se genera correctamente
- ✅ **Slug se genera** automáticamente
- ✅ **Usuario se asocia** al tenant creado
- ✅ **Email de verificación** se envía
- ✅ **Dashboard funciona** después de verificar email

## 🚀 **Próximos Pasos**

1. **Ejecutar** `scripts/031_test_tenant_creation.sql` para probar funciones
2. **Probar** el formulario de registro en el navegador
3. **Verificar** que todo funciona correctamente
4. **Documentar** cualquier problema encontrado

**¡El nuevo flujo de registro está listo para probar!** 🎯
