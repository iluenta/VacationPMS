# Verificación de Configuración de Autenticación en Supabase

## 🔧 **Configuración Requerida en Supabase Dashboard**

### 1. **URLs de Redirección**
Ve a **Authentication > URL Configuration** en tu dashboard de Supabase:

**Site URL:**
```
http://localhost:3000
```

**Redirect URLs (añadir todas estas):**
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?type=signup
http://localhost:3000/auth/callback?type=recovery
http://localhost:3000/auth/callback?type=email_change
```

### 2. **Configuración de Email**
Ve a **Authentication > Email Templates**:

- ✅ **Confirm signup** - Habilitado
- ✅ **Reset password** - Habilitado  
- ✅ **Email change** - Habilitado

### 3. **Configuración de Usuarios**
Ve a **Authentication > Settings**:

- ✅ **Enable email confirmations** - Habilitado
- ✅ **Enable email change confirmations** - Habilitado
- ✅ **Enable phone confirmations** - Deshabilitado (si no lo necesitas)

### 4. **Configuración de PKCE**
Ve a **Authentication > Settings**:

- ✅ **Enable PKCE** - Habilitado (recomendado)
- ✅ **Enable PKCE for email** - Habilitado

## 🚨 **Problema Actual**

El error `invalid request: both auth code and code verifier should be non-empty` indica que:

1. **PKCE está habilitado** pero no se está manejando correctamente
2. **Las URLs de redirección** no incluyen el parámetro `type`
3. **El callback** no está detectando el tipo de autenticación

## 🔧 **Solución Implementada**

Hemos actualizado el callback para:

1. ✅ **Intentar múltiples métodos** de autenticación
2. ✅ **Detectar el tipo** de callback automáticamente
3. ✅ **Manejar PKCE y OTP** de forma robusta
4. ✅ **Proporcionar mejor debugging** con logs detallados

## 📋 **Pasos para Resolver**

1. **Configura las URLs** en Supabase Dashboard (ver arriba)
2. **Reinicia el servidor** de desarrollo
3. **Prueba el registro** de un nuevo usuario
4. **Verifica el email** de confirmación
5. **Haz clic en el enlace** del email

## 🔍 **Debugging**

El callback ahora mostrará logs detallados:

```
[v0] Auth callback - code: true type: signup tenant_id: null
[v0] Full URL: http://localhost:3000/auth/callback?code=abc123&type=signup
[v0] Attempting OTP verification for type: signup
[v0] Authentication successful for user: user@example.com
```

## 📝 **URLs de Ejemplo Correctas**

El enlace en el email debería verse así:
```
http://localhost:3000/auth/callback?code=abc123&type=signup
```

No así:
```
http://localhost:3000/auth/callback?code=abc123
```

## ⚠️ **Importante**

Si el problema persiste después de configurar las URLs:

1. **Verifica que las URLs** estén exactamente como se muestran arriba
2. **Reinicia el servidor** de desarrollo
3. **Limpia la caché** del navegador
4. **Prueba con un usuario nuevo**
