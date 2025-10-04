# 🏖️ VacationPMS - Sistema de Gestión de Alquileres Vacacionales

Un sistema completo de gestión de propiedades para alquileres vacacionales, construido con Next.js 15, React 19, TypeScript, Tailwind CSS y Supabase.

## ✨ Características

- 🔐 **Autenticación completa** con Supabase Auth (Email + Google OAuth)
- ✅ **Verificación de email obligatoria** para mayor seguridad
- 🏢 **Arquitectura multi-tenant** con Row Level Security (RLS)
- 📱 **Dashboard moderno** con cabecera responsive
- 🎨 **UI moderna** con shadcn/ui y Tailwind CSS
- 🔒 **Seguridad robusta** con políticas RLS
- 📊 **Gestión de usuarios** y perfiles
- 🌐 **Landing page** profesional

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 15.2.4, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4.1.9, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Autenticación**: Supabase Auth con Email y Google OAuth
- **Base de datos**: PostgreSQL con Row Level Security

## 📋 Prerrequisitos

- Node.js 18+ 
- npm o pnpm
- Cuenta de Supabase
- Cuenta de Google (para OAuth)

## 🛠️ Instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/iluenta/VacationPMS.git
   cd VacationPMS
   ```

2. **Instala las dependencias**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configura las variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   
   Edita `.env.local` con tus credenciales de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

4. **Configura la base de datos**
   - Ejecuta los scripts SQL en orden en tu proyecto Supabase:
     - `scripts/001_create_tenants.sql`
     - `scripts/002_create_users.sql`
     - `scripts/003_create_user_trigger.sql`
     - `scripts/005_fix_rls_recursion.sql`
     - `scripts/006_fix_tenant_access.sql`
     - `scripts/014_implement_secure_rls.sql`

5. **Configura la autenticación**
   - Habilita Email Auth en Supabase
   - Configura Google OAuth (opcional)
   - Configura las URLs de redirección:
     ```
     http://localhost:3000/auth/callback
     http://localhost:3000/auth/callback?type=signup
     http://localhost:3000/auth/callback?type=recovery
     ```

6. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

- **`tenants`**: Organizaciones/empresas
- **`users`**: Usuarios del sistema
- **`auth.users`**: Usuarios de autenticación (Supabase)

### Políticas RLS

- Usuarios pueden ver/editar su propio perfil
- Admins pueden gestionar todos los usuarios
- Acceso público a tenants para registro
- Seguridad multi-tenant implementada

## 🎯 Funcionalidades Implementadas

### ✅ Autenticación
- [x] Registro por email con verificación obligatoria
- [x] Login con email/contraseña
- [x] Google OAuth (configurado)
- [x] Verificación de email obligatoria
- [x] Página de verificación con reenvío
- [x] Recuperación de contraseña
- [x] Cambio de contraseña
- [x] Logout seguro

### ✅ Dashboard
- [x] Cabecera moderna con información de usuario
- [x] Información de tenant/organización
- [x] Menú de usuario (perfil, configuración, logout)
- [x] Badge de administrador
- [x] Diseño responsive

### ✅ Gestión de Usuarios
- [x] Perfil de usuario editable
- [x] Cambio de nombre y tema
- [x] Asociación con tenant
- [x] Roles de administrador

### ✅ UI/UX
- [x] Landing page profesional
- [x] Diseño responsive
- [x] Tema claro/oscuro
- [x] Componentes shadcn/ui
- [x] Animaciones y transiciones

## 🔧 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter
```

## 📁 Estructura del Proyecto

```
VacationPMS/
├── app/                    # App Router de Next.js
│   ├── auth/              # Páginas de autenticación
│   ├── dashboard/         # Dashboard y páginas protegidas
│   ├── login/             # Página de login
│   ├── signup/            # Página de registro
│   └── page.tsx           # Landing page
├── components/            # Componentes React
│   └── ui/               # Componentes shadcn/ui
├── lib/                  # Utilidades y configuración
│   ├── supabase/         # Clientes de Supabase
│   └── auth-context.tsx  # Context de autenticación
├── scripts/              # Scripts SQL para la base de datos
└── public/               # Archivos estáticos
```

## 🚨 Solución de Problemas

### Error de certificados SSL
Si encuentras errores de certificados SSL en desarrollo:
```bash
npm run dev  # Usa el script que maneja NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Error de verificación de email
Asegúrate de que las URLs de redirección estén configuradas correctamente en Supabase.

### Error de RLS
Si hay problemas con Row Level Security, ejecuta los scripts de corrección en orden.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🎉 ¡Gracias!

¡Gracias por usar VacationPMS! Si tienes alguna pregunta o sugerencia, no dudes en abrir un issue.

---

**Desarrollado con ❤️ usando Next.js, React, TypeScript y Supabase**
