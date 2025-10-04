# 🔧 Guía de Solución de Problemas - Error 406 y Validación de Email

## 🚨 **Problemas Identificados**

### **1. Error 406 - "Cannot coerce the result to a single JSON object"**
- **Causa**: El usuario existe en `auth.users` pero no en `public.users`
- **Síntoma**: Error `PGRST116` al intentar obtener el perfil
- **Impacto**: El usuario no puede acceder al dashboard

### **2. Validación de Email Confirmado Perdida**
- **Causa**: El middleware puede no estar funcionando correctamente
- **Síntoma**: Usuarios no confirmados pueden acceder al dashboard
- **Impacto**: Problemas de seguridad

## 🛠️ **Soluciones Implementadas**

### **Scripts de Diagnóstico y Reparación:**

1. **`scripts/033_check_user_trigger.sql`** - Verificar estado del trigger
2. **`scripts/034_recreate_user_trigger.sql`** - Recrear trigger si es necesario
3. **`scripts/035_check_rls_policies.sql`** - Verificar políticas RLS
4. **`scripts/036_complete_diagnosis.sql`** - Diagnóstico completo
5. **`scripts/037_auto_fix.sql`** - Reparación automática

## 📋 **Pasos para Solucionar**

### **Paso 1: Ejecutar Diagnóstico**
```sql
-- En Supabase SQL Editor:
-- scripts/036_complete_diagnosis.sql
```

**Resultado esperado:**
- Verificar que el trigger existe
- Verificar que la función `handle_new_user` existe
- Verificar que RLS está habilitado
- Verificar que las políticas RLS existen
- Identificar usuarios faltantes

### **Paso 2: Ejecutar Reparación Automática**
```sql
-- En Supabase SQL Editor:
-- scripts/037_auto_fix.sql
```

**Lo que hace este script:**
- ✅ Recrea el trigger `on_auth_user_created`
- ✅ Recrea la función `handle_new_user`
- ✅ Recrea la función `is_admin`
- ✅ Recrea todas las políticas RLS
- ✅ Sincroniza usuarios de `auth.users` a `public.users`
- ✅ Verifica que todo funciona correctamente

### **Paso 3: Verificar en el Navegador**

1. **Limpiar caché del navegador**
2. **Cerrar sesión y volver a iniciar sesión**
3. **Verificar que no hay errores en la consola**
4. **Verificar que el dashboard carga correctamente**

## 🔍 **Verificaciones Post-Reparación**

### **En Supabase SQL Editor:**
```sql
-- Verificar que el usuario específico existe
SELECT 
    id,
    email,
    full_name,
    tenant_id,
    is_admin
FROM public.users
WHERE id = '07d0cadf-c0de-403c-af74-492214376512';

-- Verificar que el trigger funciona
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Verificar políticas RLS
SELECT 
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';
```

### **En el Navegador:**
- ✅ No hay errores 406 en la consola
- ✅ El perfil del usuario se carga correctamente
- ✅ El dashboard muestra la información del usuario
- ✅ La validación de email confirmado funciona

## 🚨 **Problemas Comunes y Soluciones**

### **Error: "Function does not exist"**
**Solución:** Ejecutar `scripts/037_auto_fix.sql`

### **Error: "Permission denied"**
**Solución:** Verificar que las políticas RLS están correctas

### **Error: "Trigger not firing"**
**Solución:** Recrear el trigger con `scripts/034_recreate_user_trigger.sql`

### **Usuario sigue sin aparecer en public.users**
**Solución:** Crear manualmente el usuario con el script de reparación

## 📊 **Logs Esperados Después de la Reparación**

### **En la Consola del Navegador:**
```javascript
[AuthContext] Initializing auth context
[AuthContext] Initial session: {user: {...}}
[AuthContext] Fetching profile for user: 07d0cadf-c0de-403c-af74-492214376512
[AuthContext] Profile data: {id: "...", email: "...", tenant_id: "...", ...}
[AuthContext] Tenant data: {id: "...", name: "...", slug: "..."}
```

### **En el Servidor:**
```
GET /dashboard 200 in 150ms
```

## 🎯 **Criterios de Éxito**

- ✅ **No hay errores 406** en la consola del navegador
- ✅ **El perfil del usuario se carga** correctamente
- ✅ **El dashboard funciona** sin errores
- ✅ **La validación de email** funciona correctamente
- ✅ **Los nuevos usuarios** se crean automáticamente en `public.users`

## 🔄 **Prevención Futura**

1. **Monitorear logs** para detectar usuarios faltantes
2. **Verificar regularmente** que el trigger funciona
3. **Probar el flujo de registro** periódicamente
4. **Mantener scripts de diagnóstico** actualizados

## 📞 **Si los Problemas Persisten**

1. **Ejecutar diagnóstico completo** (`scripts/036_complete_diagnosis.sql`)
2. **Verificar logs detallados** en la consola del navegador
3. **Revisar políticas RLS** en Supabase
4. **Contactar soporte** con los logs específicos

**¡La reparación automática debería solucionar todos los problemas identificados!** 🚀
