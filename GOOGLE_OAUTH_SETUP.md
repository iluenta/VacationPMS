# Configuración de Google OAuth en Supabase

Para habilitar el inicio de sesión con Google, sigue estos pasos:

## 1. Configurar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services** > **Credentials**
4. Haz clic en **Create Credentials** > **OAuth 2.0 Client ID**
5. Selecciona **Web application**
6. Agrega las siguientes URLs autorizadas:

   **Authorized JavaScript origins:**
   \`\`\`
   http://localhost:3000
   https://tu-proyecto.vercel.app
   \`\`\`

   **Authorized redirect URIs:**
   \`\`\`
   https://[TU-PROYECTO-SUPABASE].supabase.co/auth/v1/callback
   \`\`\`

7. Copia el **Client ID** y **Client Secret**

## 2. Configurar Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Authentication** > **Providers**
3. Busca **Google** y habilítalo
4. Pega el **Client ID** y **Client Secret** de Google
5. Guarda los cambios

## 3. Configurar URLs de Redirección

En **Authentication** > **URL Configuration**, asegúrate de tener:

**Site URL:**
\`\`\`
http://localhost:3000
\`\`\`

**Redirect URLs:**
\`\`\`
http://localhost:3000/auth/callback
https://tu-proyecto.vercel.app/auth/callback
\`\`\`

## 4. Probar la Integración

1. Ve a `/signup` o `/login`
2. Haz clic en "Continuar con Google"
3. Autoriza la aplicación
4. Deberías ser redirigido al dashboard

## Notas Importantes

- Para signup con Google, el usuario DEBE seleccionar una organización primero
- El tenant_id se pasa como query parameter durante el flujo OAuth
- Los usuarios que se registran con Google tendrán `is_admin: false` por defecto
