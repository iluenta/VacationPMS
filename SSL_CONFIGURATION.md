# Configuración SSL para Desarrollo

## ⚠️ Advertencia de Seguridad

El warning que ves sobre `NODE_TLS_REJECT_UNAUTHORIZED=0` es una medida de seguridad de Node.js. Esta configuración deshabilita la verificación de certificados SSL, lo que hace las conexiones inseguras.

## ¿Por qué necesitamos esto?

En entornos corporativos o de desarrollo, es común tener:
- Certificados SSL autofirmados
- Proxies corporativos con certificados problemáticos
- Entornos de desarrollo con certificados no válidos

## Configuración Actual

El proyecto usa `scripts/dev.js` que:
1. ✅ Solo aplica la configuración SSL en desarrollo
2. ✅ Muestra advertencias claras sobre la inseguridad
3. ✅ Permite deshabilitar la configuración si no es necesaria

## Alternativas Más Seguras

### Opción 1: Configurar certificados correctos
```bash
# Instalar certificados corporativos en tu sistema
# Esto elimina la necesidad de deshabilitar SSL
```

### Opción 2: Usar variables de entorno
```bash
# En tu .env.local (crear si no existe)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Opción 3: Configurar solo para Supabase
```javascript
// En lib/supabase/client.ts
const supabase = createClient(url, key, {
  auth: {
    // Configuraciones específicas de auth
  },
  global: {
    fetch: (url, options) => {
      // Configuración SSL específica para Supabase
      return fetch(url, {
        ...options,
        // Configuraciones SSL específicas
      })
    }
  }
})
```

## Recomendación

Para desarrollo local, la configuración actual es aceptable ya que:
- ✅ Solo se aplica en desarrollo
- ✅ Está claramente documentada
- ✅ Se puede deshabilitar fácilmente

Para producción, **NUNCA** uses `NODE_TLS_REJECT_UNAUTHORIZED=0`.

## Cómo Deshabilitar el Warning

Si quieres eliminar el warning, puedes:

1. **Configurar certificados correctos** en tu sistema
2. **Usar un proxy local** con certificados válidos
3. **Configurar Supabase** con certificados específicos

El warning es una característica de seguridad de Node.js y es normal verlo en desarrollo cuando se deshabilitan las verificaciones SSL.
