# Configuración de Autenticación por Email en Supabase

## 🔧 **Configuración Requerida en Supabase Dashboard**

### 1. **URLs de Redirección**
Ve a **Authentication > URL Configuration** en tu dashboard de Supabase y asegúrate de que estas URLs estén configuradas:

**Site URL:**
```
http://localhost:3000
```

**Redirect URLs:**
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?type=signup
http://localhost:3000/auth/callback?type=recovery
```

### 2. **Configuración de Email**
Ve a **Authentication > Email Templates** y verifica que:

- ✅ **Confirm signup** está habilitado
- ✅ **Reset password** está habilitado
- ✅ Las plantillas de email están configuradas

### 3. **Configuración de Usuarios**
Ve a **Authentication > Settings** y verifica que:

- ✅ **Enable email confirmations** está habilitado
- ✅ **Enable email change confirmations** está habilitado
- ✅ **Enable phone confirmations** está deshabilitado (si no lo necesitas)

## 🚨 **Problema Actual**

El error `invalid request: both auth code and code verifier should be non-empty` indica que:

1. **PKCE está habilitado** pero no se está manejando correctamente
2. **Las URLs de redirección** no están configuradas correctamente
3. **El tipo de callback** no se está detectando correctamente

## 🔧 **Solución Implementada**

Hemos actualizado el archivo `app/auth/callback/route.ts` para:

1. ✅ **Detectar el tipo de callback** (`signup`, `recovery`, etc.)
2. ✅ **Usar `verifyOtp`** para verificación por email
3. ✅ **Usar `exchangeCodeForSession`** solo para OAuth
4. ✅ **Manejar errores** de forma más específica

## 📋 **Pasos para Resolver**

1. **Configura las URLs** en Supabase Dashboard (ver arriba)
2. **Reinicia el servidor** de desarrollo
3. **Prueba el registro** de un nuevo usuario
4. **Verifica el email** de confirmación
5. **Haz clic en el enlace** del email

## 🔍 **Debugging**

Si el problema persiste:

1. **Revisa la consola** del navegador para errores
2. **Revisa los logs** del servidor de desarrollo
3. **Verifica las URLs** en el email de confirmación
4. **Comprueba la configuración** de Supabase

## 📝 **URLs de Ejemplo**

El enlace en el email debería verse así:
```
http://localhost:3000/auth/callback?code=abc123&type=signup
```

No así:
```
http://localhost:3000/auth/callback?code=abc123
```
