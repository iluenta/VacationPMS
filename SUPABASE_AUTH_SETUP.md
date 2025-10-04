# Configuración de Autenticación de Supabase

## Problema: "Setup Development Auth" no funciona

Este documento explica cómo configurar correctamente la autenticación de Supabase para desarrollo local y producción.

## Solución Rápida

La aplicación ya está configurada para usar la ruta `/auth/callback` como URL de redirección. Solo necesitas configurar esta URL en Supabase:

### Paso 1: Acceder a la Configuración de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Authentication** → **URL Configuration**

### Paso 2: Configurar Site URL

En el campo **Site URL**, ingresa:
\`\`\`
http://localhost:3000
\`\`\`

### Paso 3: Configurar Redirect URLs

En el campo **Redirect URLs**, agrega las siguientes URLs (una por línea):

\`\`\`
http://localhost:3000/auth/callback
https://tu-dominio-produccion.vercel.app/auth/callback
\`\`\`

**Importante:** Reemplaza `tu-dominio-produccion.vercel.app` con tu dominio real de producción cuando despliegues.

### Paso 4: Guardar Cambios

Haz clic en **Save** para guardar la configuración.

## Configuración de Google OAuth (Opcional)

Si quieres habilitar el inicio de sesión con Google:

### Paso 1: Crear Credenciales en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Navega a **APIs & Services** → **Credentials**
4. Haz clic en **Create Credentials** → **OAuth 2.0 Client ID**
5. Selecciona **Web application**
6. Agrega las siguientes **Authorized redirect URIs**:
   \`\`\`
   https://[TU-PROJECT-REF].supabase.co/auth/v1/callback
   \`\`\`
   (Encuentra tu Project Ref en Supabase Dashboard → Settings → General)

### Paso 2: Configurar en Supabase

1. En Supabase Dashboard, ve a **Authentication** → **Providers**
2. Habilita **Google**
3. Ingresa tu **Client ID** y **Client Secret** de Google
4. Haz clic en **Save**

## Verificar la Configuración

1. Inicia tu aplicación localmente: `npm run dev`
2. Ve a `http://localhost:3000/login`
3. Intenta iniciar sesión con email/password o Google
4. Deberías ser redirigido a `/dashboard` después de autenticarte

## Rutas de Autenticación

La aplicación usa las siguientes rutas:

- `/login` - Página de inicio de sesión
- `/signup` - Página de registro
- `/auth/callback` - Callback de OAuth (Google, etc.)
- `/auth/error` - Página de error de autenticación
- `/dashboard` - Área protegida (requiere autenticación)

## Solución de Problemas

### Error: "Invalid Redirect URL"

**Causa:** La URL de redirección no está configurada en Supabase.

**Solución:** Asegúrate de haber agregado `http://localhost:3000/auth/callback` en la configuración de Redirect URLs en Supabase.

### Error: "Email not confirmed"

**Causa:** Supabase requiere confirmación de email por defecto.

**Solución:** 
1. Ve a **Authentication** → **Email Templates** en Supabase
2. O desactiva la confirmación de email en **Authentication** → **Providers** → **Email** → Desactiva "Confirm email"

### Google OAuth no funciona

**Causa:** Credenciales de Google no configuradas o incorrectas.

**Solución:** Verifica que hayas configurado correctamente las credenciales de Google en Supabase y que las Authorized redirect URIs incluyan la URL de callback de Supabase.

## Variables de Entorno

Las siguientes variables ya están configuradas en tu proyecto v0:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
\`\`\`

Para desarrollo local, estas variables se obtienen automáticamente de la integración de Supabase en v0.

## Próximos Pasos

Una vez configurada la autenticación:

1. Ejecuta los scripts de base de datos en orden (001, 002, 003, 004)
2. Crea tu primer usuario desde `/signup`
3. Accede al dashboard en `/dashboard`

## Soporte

Si sigues teniendo problemas:
1. Verifica que todas las URLs de redirección estén correctamente configuradas
2. Revisa los logs de Supabase en el Dashboard
3. Asegúrate de que las variables de entorno estén correctamente configuradas
