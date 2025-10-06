# Pruebas de API Endpoints - Sistema de Configuraciones

## 🧪 **Guía de Testing Manual**

### **Prerequisitos:**
1. ✅ Servidor ejecutándose en `http://localhost:3000`
2. ✅ Usuario autenticado en el sistema
3. ✅ Base de datos con tablas de configuración creadas

---

## **📋 PASO 1: Verificar Acceso a Configuraciones**

### **1.1 Navegar a la Página de Configuraciones**
```
URL: http://localhost:3000/dashboard/configurations
```

**✅ Resultado Esperado:**
- Página carga sin errores
- Se muestra la lista de tipos de configuración existentes
- Botón "Nuevo Tipo" visible
- Datos de ejemplo cargados (Tipo de Usuario, Tipo de Reserva, Tipo de Pago)

---

## **📋 PASO 2: Probar CRUD de Tipos de Configuración**

### **2.1 Crear Nuevo Tipo de Configuración**
1. Hacer clic en "Nuevo Tipo"
2. Llenar formulario:
   - **Nombre:** "Tipo de Propiedad"
   - **Descripción:** "Define los tipos de propiedades disponibles"
   - **Icono:** Seleccionar "home"
   - **Color:** Seleccionar "#10B981" (verde)
   - **Orden:** 4
3. Hacer clic en "Crear"

**✅ Resultado Esperado:**
- Toast de éxito: "Tipo de configuración creado exitosamente"
- Nuevo tipo aparece en la lista
- Formulario se cierra

### **2.2 Ver Valores de un Tipo**
1. Hacer clic en "Tipo de Usuario" en la lista
2. Verificar que se navega a la vista de valores

**✅ Resultado Esperado:**
- Se muestra la página de valores
- Se ven los valores existentes: Admin, Usuario Regular, Invitado
- Botón "Nuevo Valor" visible
- Botón "←" para volver atrás

### **2.3 Crear Nuevo Valor**
1. Hacer clic en "Nuevo Valor"
2. Llenar formulario:
   - **Valor:** "super_admin"
   - **Etiqueta:** "Super Administrador"
   - **Descripción:** "Administrador con permisos completos"
   - **Icono:** Seleccionar "shield-check"
   - **Color:** Seleccionar "#EF4444" (rojo)
   - **Orden:** 0
3. Hacer clic en "Crear"

**✅ Resultado Esperado:**
- Toast de éxito: "Valor creado exitosamente"
- Nuevo valor aparece en la lista (primero por orden)
- Formulario se cierra

### **2.4 Editar Tipo de Configuración**
1. Volver a la lista de tipos (botón ←)
2. Hacer clic en "⋮" → "Editar" en "Tipo de Usuario"
3. Cambiar descripción a: "Define los diferentes tipos de usuarios en el sistema (actualizado)"
4. Hacer clic en "Actualizar"

**✅ Resultado Esperado:**
- Toast de éxito: "Tipo de configuración actualizado exitosamente"
- Cambios se reflejan en la lista

### **2.5 Editar Valor**
1. Hacer clic en "Tipo de Usuario" para ver valores
2. Hacer clic en "⋮" → "Editar" en "Super Administrador"
3. Cambiar etiqueta a: "Super Admin"
4. Hacer clic en "Actualizar"

**✅ Resultado Esperado:**
- Toast de éxito: "Valor actualizado exitosamente"
- Cambios se reflejan en la lista

### **2.6 Desactivar/Activar Elementos**
1. Hacer clic en "⋮" → "Desactivar" en un elemento
2. Verificar que aparece badge "Inactivo"
3. Hacer clic en "⋮" → "Activar" para reactivarlo

**✅ Resultado Esperado:**
- Toast de éxito al cambiar estado
- Badge se actualiza correctamente

### **2.7 Eliminar Valor**
1. Hacer clic en "⋮" → "Eliminar" en "Super Administrador"
2. Confirmar eliminación

**✅ Resultado Esperado:**
- Toast de éxito: "Valor eliminado exitosamente"
- Elemento desaparece de la lista

---

## **📋 PASO 3: Probar Validaciones**

### **3.1 Validación de Campos Requeridos**
1. Intentar crear tipo sin nombre
2. Intentar crear valor sin valor o etiqueta

**✅ Resultado Esperado:**
- Mensajes de error en formulario
- No se permite envío

### **3.2 Validación de Duplicados**
1. Intentar crear tipo con nombre existente
2. Intentar crear valor con valor existente en el mismo tipo

**✅ Resultado Esperado:**
- Toast de error: "Ya existe un tipo/valor con ese nombre"
- No se crea duplicado

### **3.3 Validación de Colores**
1. Intentar ingresar color inválido en campo personalizado

**✅ Resultado Esperado:**
- Mensaje de error: "El color debe ser un código hexadecimal válido"

---

## **📋 PASO 4: Probar Filtrado por Tenant**

### **4.1 Verificar Aislamiento de Datos**
1. Si eres admin, cambiar tenant en el selector del header
2. Verificar que las configuraciones cambian según el tenant seleccionado

**✅ Resultado Esperado:**
- Solo se muestran configuraciones del tenant seleccionado
- Datos se filtran correctamente

---

## **📋 PASO 5: Probar Responsive Design**

### **5.1 Probar en Diferentes Tamaños**
1. Redimensionar ventana del navegador
2. Verificar que los formularios y listas se adaptan

**✅ Resultado Esperado:**
- UI se adapta correctamente
- Formularios siguen siendo usables
- Listas se reorganizan apropiadamente

---

## **📋 PASO 6: Probar Navegación**

### **6.1 Navegación desde Dashboard**
1. Ir a `/dashboard`
2. Hacer clic en avatar → "Configuraciones"

**✅ Resultado Esperado:**
- Navegación funciona correctamente
- Se llega a la página de configuraciones

---

## **🔍 Verificaciones Adicionales**

### **Console del Navegador:**
- ✅ No hay errores JavaScript
- ✅ No hay errores de red (404, 500, etc.)
- ✅ Logs de API muestran respuestas exitosas

### **Network Tab:**
- ✅ Requests a `/api/configurations` devuelven 200
- ✅ Requests POST/PUT/DELETE funcionan correctamente
- ✅ No hay requests fallidos

### **Base de Datos:**
- ✅ Registros se crean en `configuration_types`
- ✅ Registros se crean en `configuration_values`
- ✅ Log de auditoría se actualiza en `configuration_audit_log`

---

## **🎯 Criterios de Éxito**

**✅ Funcionalidad Completa:**
- [ ] CRUD de tipos de configuración funciona
- [ ] CRUD de valores de configuración funciona
- [ ] Validaciones funcionan correctamente
- [ ] Filtrado por tenant funciona
- [ ] Navegación funciona
- [ ] UI es responsive
- [ ] No hay errores en consola
- [ ] APIs responden correctamente

**✅ Experiencia de Usuario:**
- [ ] Formularios son intuitivos
- [ ] Feedback visual es claro (toasts, loading states)
- [ ] Iconos y colores se muestran correctamente
- [ ] Navegación es fluida

---

## **🚨 Problemas Conocidos a Verificar**

1. **Iconos:** Verificar que los iconos de Lucide se cargan correctamente
2. **Colores:** Verificar que los colores se aplican en la UI
3. **Orden:** Verificar que el orden de elementos se respeta
4. **Estados:** Verificar que los estados activo/inactivo funcionan

---

## **📝 Notas de Testing**

- **Usuario de Prueba:** Usar cuenta existente con tenant asignado
- **Datos de Prueba:** Los datos de ejemplo deben estar disponibles
- **Cleanup:** Después de las pruebas, eliminar datos de prueba creados
- **Performance:** Verificar que las operaciones son rápidas (< 2 segundos)

---

**🎉 Si todas las pruebas pasan, el sistema de configuraciones está listo para producción!**
