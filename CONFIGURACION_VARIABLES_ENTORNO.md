# 🔧 Configuración de Variables de Entorno

## 📋 **Variables Requeridas (Mínimo para funcionar)**

### **1. Supabase Configuration**

#### **NEXT_PUBLIC_SUPABASE_URL**
- Ve a: https://supabase.com/dashboard
- Selecciona tu proyecto
- Ve a **Settings > API**
- Copia el **"Project URL"**
- Ejemplo: `https://abcdefghijklmnop.supabase.co`

#### **SUPABASE_SERVICE_ROLE_KEY**
- En la misma página de **Settings > API**
- Copia la clave **"service_role"** (NO la anon key)
- Ejemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **2. JWT Secret**

#### **JWT_SECRET**
- Genera una clave secreta de al menos 32 caracteres
- **Opción 1 - Terminal:**
  ```bash
  openssl rand -base64 32
  ```
- **Opción 2 - Online:** https://generate-secret.vercel.app/32
- **Opción 3 - Manual:** Cualquier string de 32+ caracteres aleatorios
- Ejemplo: `my-super-secret-jwt-key-2024-very-long-and-secure`

---

## 🌐 **Variables Opcionales (OAuth)**

### **Google OAuth**
1. Ve a: https://console.cloud.google.com/apis/credentials
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google+ API**
4. Crea **"OAuth 2.0 Client IDs"**
5. Configura:
   - **Application type:** Web application
   - **Authorized redirect URIs:** `http://localhost:3000/api/auth/oauth/callback/google`

### **GitHub OAuth**
1. Ve a: https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Configura:
   - **Application name:** Tu aplicación
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/oauth/callback/github`

### **Microsoft OAuth**
1. Ve a: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
2. Click **"New registration"**
3. Configura:
   - **Name:** Tu aplicación
   - **Redirect URI:** `http://localhost:3000/api/auth/oauth/callback/microsoft`

---

## ⚡ **Variables Opcionales (Rate Limiting)**

### **Upstash Redis (Para Rate Limiting)**
1. Ve a: https://upstash.com/
2. Crea una cuenta gratuita
3. Crea una nueva base de datos Redis
4. Copia la **REST URL** y **REST Token**

---

## 🚀 **Pasos de Configuración**

### **PASO 1: Crear archivo .env.local**
```bash
# En la raíz del proyecto (C:\Proyectos\PMS)
touch .env.local
```

### **PASO 2: Agregar variables mínimas**
```bash
# Mínimo para que funcione
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
JWT_SECRET=tu-jwt-secret-de-32-caracteres-minimo
```

### **PASO 3: Reiniciar servidor**
```bash
# Detener servidor (Ctrl+C)
# Luego reiniciar
npm run dev
```

### **PASO 4: Verificar configuración**
```bash
# Probar endpoint
curl http://localhost:3000/api/auth/2fa/setup
# Debería devolver 401 (no autorizado) en lugar de 500 (error)
```

---

## 🔍 **Verificación de Configuración**

### **Test Rápido:**
```bash
# 1. Verificar que el servidor inicia sin errores
npm run dev

# 2. Probar endpoint de autenticación
curl -X GET http://localhost:3000/api/auth/2fa/setup
# Respuesta esperada: 401 (no autorizado) - significa que está funcionando

# 3. Verificar variables en consola
node -e "console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Configurado' : 'Faltante')"
```

### **Errores Comunes:**
- **500 Error:** Variables de entorno no configuradas
- **401 Error:** ✅ Correcto (endpoint funcionando, solo necesita autenticación)
- **429 Error:** ✅ Correcto (rate limiting funcionando)

---

## 📝 **Ejemplo de .env.local Completo**

```bash
# ============================================================================
# CONFIGURACIÓN MÍNIMA (REQUERIDA)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM5NTY3ODkwLCJleHAiOjE5NTUxNDM4OTB9.abcdefghijklmnopqrstuvwxyz123456789
JWT_SECRET=my-super-secret-jwt-key-2024-very-long-and-secure-minimum-32-chars

# ============================================================================
# CONFIGURACIÓN OPCIONAL (OAUTH)
# ============================================================================
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz123456
GITHUB_CLIENT_ID=Ov23liabcdefghijklmnop
GITHUB_CLIENT_SECRET=abcdefghijklmnopqrstuvwxyz1234567890abcdef
MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789012
MICROSOFT_CLIENT_SECRET=abcdefghijklmnopqrstuvwxyz1234567890

# ============================================================================
# CONFIGURACIÓN OPCIONAL (RATE LIMITING)
# ============================================================================
UPSTASH_REDIS_REST_URL=https://us1-redis-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AabcAAIjc2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MTIzNDU2Nzg5MGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MTIzNDU2Nzg5MA

# ============================================================================
# CONFIGURACIÓN OPCIONAL (SITE)
# ============================================================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## ✅ **Checklist de Configuración**

- [ ] **NEXT_PUBLIC_SUPABASE_URL** configurado
- [ ] **SUPABASE_SERVICE_ROLE_KEY** configurado  
- [ ] **JWT_SECRET** configurado (32+ caracteres)
- [ ] Servidor reiniciado (`npm run dev`)
- [ ] Endpoint responde con 401 (no 500)
- [ ] Rate limiting funcionando (429 en requests excesivas)

**¡Una vez configurado, tu autenticación mejorada estará completamente funcional!**
