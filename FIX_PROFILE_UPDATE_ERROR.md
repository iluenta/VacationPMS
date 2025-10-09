# 🔧 Fix Profile Update Error - Password Hash Trigger

## 🐛 Problema

Al intentar actualizar el perfil de usuario, se obtiene el error:
```
record "old" has no field "password_hash"
```

## 🔍 Causa

El trigger `update_password_changed_at_trigger` en la tabla `users` intenta acceder a un campo `password_hash` que no existe en la tabla `public.users`. Este campo solo existe en `auth.users`.

## ✅ Solución

### Opción 1: Ejecutar Script SQL en Supabase (RECOMENDADO)

1. **Ir a Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Selecciona tu proyecto: `pxuzmsugwfbppmedkkxp`

2. **Abrir SQL Editor**
   - En el menú lateral, haz clic en "SQL Editor"
   - Crea una nueva query

3. **Ejecutar Script**
   - Copia el contenido del archivo `scripts/099_remove_password_trigger.sql`
   - Pégalo en el editor
   - Haz clic en "Run"

4. **Verificar**
   - El resultado debe mostrar `remaining_triggers: 0`
   - Esto confirma que el trigger fue eliminado

### Opción 2: Ejecutar desde psql (Alternativa)

Si tienes acceso directo a PostgreSQL:

```sql
DROP TRIGGER IF EXISTS update_password_changed_at_trigger ON public.users;
DROP FUNCTION IF EXISTS public.update_password_changed_at();
```

## 📋 Verificación

Después de ejecutar el script, verifica que funcione:

1. **Reinicia el servidor de desarrollo**
   ```bash
   # Detener el servidor (Ctrl+C)
   npm run dev
   ```

2. **Prueba actualizar el perfil**
   - Ve a http://localhost:3000/dashboard/profile
   - Cambia tu nombre completo o color de tema
   - Haz clic en "Guardar cambios"
   - Debería funcionar sin errores

## 🔬 Detalles Técnicos

### ¿Por qué ocurre este error?

El script `scripts/090_create_password_history_table.sql` creó un trigger que intenta actualizar `password_changed_at` cuando se modifica `password_hash`:

```sql
CREATE OR REPLACE FUNCTION public.update_password_changed_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Si se actualiza el hash de contraseña, actualizar la fecha
    IF OLD.password_hash IS DISTINCT FROM NEW.password_hash THEN
        NEW.password_changed_at = now();
        NEW.password_change_required = false;
        NEW.password_change_required_at = NULL;
    END IF;
    RETURN NEW;
END;
$$;
```

El problema es que:
- `password_hash` solo existe en `auth.users` (tabla de Supabase Auth)
- El trigger está en `public.users` (nuestra tabla)
- `public.users` NO tiene el campo `password_hash`

### ¿Por qué el cliente admin no funciona?

Aunque el endpoint `/api/profile` usa el cliente admin con service role:

```typescript
const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

Los triggers se ejecutan **antes** de que RLS o permisos se apliquen. El trigger se ejecuta a nivel de PostgreSQL, no de Supabase.

## 🎯 Impacto

Después de eliminar el trigger:

### ✅ Funcionará:
- Actualización de perfil (nombre, color de tema)
- Actualización de configuraciones de usuario
- Cambio de contraseña (usa Supabase Auth directamente)

### ❌ No afecta:
- Seguridad de contraseñas (se mantiene en Supabase Auth)
- Historial de contraseñas (usa otra función)
- Políticas de contraseñas (definidas en código)

### ⚠️ Se pierde:
- Auto-actualización de `password_changed_at` al cambiar contraseña
  - **Solución**: Actualizar manualmente en `ChangePasswordUseCase`

## 🔄 Mejora Futura (Opcional)

Si necesitas rastrear cambios de contraseña, actualiza el Use Case:

```typescript
// lib/application/use-cases/ChangePasswordUseCase.ts
export class ChangePasswordUseCase {
  async execute(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    // ... código existente ...
    
    // Después de cambiar la contraseña exitosamente
    if (result.success) {
      // Actualizar password_changed_at manualmente
      await this.userRepository.updatePasswordTimestamp(userId)
    }
    
    return true
  }
}
```

## 📚 Referencias

- Script original: `scripts/090_create_password_history_table.sql`
- Script de fix: `scripts/099_remove_password_trigger.sql`
- Endpoint afectado: `app/api/profile/route.ts`
- Documentación de triggers: https://www.postgresql.org/docs/current/sql-createtrigger.html

