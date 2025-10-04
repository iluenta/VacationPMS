# Configuración de Plantillas de Email en Supabase

## 🚨 **Problema Identificado**

El enlace del email de confirmación no incluye el parámetro `type=signup`, por eso el callback no puede detectar que es una verificación por email.

**URL actual del email:**
```
http://localhost:3000/auth/callback?code=fbb0272f-46d4-4cbe-b78e-3576538ec17a
```

**URL esperada:**
```
http://localhost:3000/auth/callback?code=fbb0272f-46d4-4cbe-b78e-3576538ec17a&type=signup
```

## 🔧 **Solución Implementada**

Hemos actualizado el callback para:

1. ✅ **Detectar automáticamente** el tipo de OTP cuando no se especifica
2. ✅ **Probar múltiples tipos** de OTP (signup, recovery, email_change)
3. ✅ **Usar el primer tipo** que funcione correctamente
4. ✅ **Fallback a PKCE** si todos los tipos de OTP fallan

## 📋 **Configuración de Plantillas de Email**

### 1. **Ve a Supabase Dashboard**
- **Authentication > Email Templates**
- **Selecciona "Confirm signup"**

### 2. **Configura la Plantilla**
En el campo **Redirect URL**, asegúrate de que sea:
```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup
```

### 3. **Opcional: Configurar Otras Plantillas**
- **Reset password**: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery`
- **Email change**: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email_change`

## 🧪 **Prueba la Solución**

1. **Reinicia el servidor** de desarrollo
2. **Registra un nuevo usuario**
3. **Verifica el email** de confirmación
4. **Haz clic en el enlace** del email

El callback ahora debería:
- Detectar automáticamente que es un OTP de signup
- Verificar el código correctamente
- Redirigir al dashboard

## 🔍 **Logs Esperados**

```
[v0] Auth callback - code: true type: null tenant_id: null
[v0] No type specified, trying to detect from code format
[v0] Trying OTP verification for type: signup
[v0] Success with OTP type: signup
[v0] Authentication successful for user: user@example.com
```

## ⚠️ **Nota Importante**

Si configuras las plantillas de email correctamente, el parámetro `type` se incluirá automáticamente en los enlaces. Pero la solución actual funciona incluso sin este parámetro.

## 🎯 **Resultado Esperado**

Después de implementar esta solución:
- ✅ **El registro por email** funcionará correctamente
- ✅ **La verificación** se completará automáticamente
- ✅ **El usuario** será redirigido al dashboard
- ✅ **No más errores** de "code verifier should be non-empty"
