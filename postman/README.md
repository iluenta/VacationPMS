# Colección Postman - PMS Persons API

Esta colección contiene todos los endpoints necesarios para probar la funcionalidad de gestión de personas en el sistema PMS.

## Archivos incluidos

- `PMS_Persons_API.postman_collection.json` - Colección principal con todos los endpoints
- `PMS_Environment.postman_environment.json` - Variables de entorno para Postman
- `README.md` - Este archivo con instrucciones

## Configuración inicial

### 1. Importar en Postman

1. Abre Postman
2. Haz clic en "Import" en la esquina superior izquierda
3. Selecciona los archivos:
   - `PMS_Persons_API.postman_collection.json`
   - `PMS_Environment.postman_environment.json`

### 2. Configurar el entorno

1. Selecciona el entorno "PMS Environment" en el dropdown superior derecho
2. Verifica que las variables estén configuradas correctamente:
   - `base_url`: `http://localhost:3001`
   - `tenant_id`: `00000001-0000-4000-8000-000000000000`
   - `admin_email`: `veratespera@gmail.com`
   - `admin_password`: `password123`

## Flujo de pruebas recomendado

### 1. Autenticación
```
Authentication → Login
```
- Ejecuta el endpoint de login para obtener el token de autenticación
- El token se guardará automáticamente en la variable `auth_token`

### 2. Obtener tipos de persona
```
Configuration Types → Get Configuration Types
```
- Obtiene todos los tipos de configuración disponibles
- Busca los tipos de persona y copia un `person_type_id` válido

### 3. Gestión de personas

#### Crear persona física
```
Persons → Create Person
```
- Modifica el `person_type_id` en el body con un ID válido
- Ejecuta la petición
- Copia el `id` de la respuesta para usar en otras peticiones

#### Crear persona jurídica
```
Persons → Create Legal Person
```
- Similar al anterior pero para empresas

#### Listar personas
```
Persons → Get All Persons
Persons → Get Persons with Filters
```

#### Obtener persona específica
```
Persons → Get Person by ID
```
- Actualiza la variable `person_id` con un ID válido

#### Actualizar persona
```
Persons → Update Person
```

#### Eliminar persona
```
Persons → Delete Person
```

### 4. Gestión de contactos

#### Crear contacto
```
Person Contacts → Create Person Contact
```
- Actualiza `person_id` con un ID válido
- Ejecuta la petición
- Copia el `id` del contacto para otras operaciones

#### Listar contactos
```
Person Contacts → Get Person Contacts
```

#### Actualizar contacto
```
Person Contacts → Update Person Contact
```
- Actualiza `contact_id` con un ID válido

#### Eliminar contacto
```
Person Contacts → Delete Person Contact
```

### 5. Gestión de direcciones

#### Crear dirección fiscal
```
Person Addresses → Create Person Address
```
- Actualiza `person_id` con un ID válido
- Ejecuta la petición
- Copia el `id` de la dirección para otras operaciones

#### Obtener dirección
```
Person Addresses → Get Person Address
```

#### Actualizar dirección
```
Person Addresses → Update Person Address
```
- Actualiza `address_id` con un ID válido

#### Eliminar dirección
```
Person Addresses → Delete Person Address
```

## Variables disponibles

### Variables de entorno
- `base_url`: URL base de la API
- `auth_token`: Token de autenticación (se llena automáticamente)
- `tenant_id`: ID del tenant por defecto
- `person_id`: ID de persona para operaciones específicas
- `contact_id`: ID de contacto para operaciones específicas
- `address_id`: ID de dirección para operaciones específicas
- `person_type_id`: ID del tipo de persona
- `search_name`: Término de búsqueda para filtros
- `admin_email`: Email del administrador
- `admin_password`: Contraseña del administrador

## Ejemplos de uso

### Crear una persona física completa

1. **Login** → Obtener token
2. **Get Configuration Types** → Obtener tipos de persona
3. **Create Person** → Crear persona física
4. **Create Person Contact** → Agregar contacto principal
5. **Create Person Address** → Agregar dirección fiscal

### Buscar personas

1. **Get Persons with Filters** → Usar `search_name` para buscar por nombre
2. Modificar `person_type_id` para filtrar por tipo
3. Cambiar `isActive` para filtrar por estado

### Casos de prueba

#### Validaciones de persona física
- `firstName` y `lastName` obligatorios
- `businessName` debe ser null
- `personCategory` debe ser "PHYSICAL"

#### Validaciones de persona jurídica
- `businessName` obligatorio
- `firstName` y `lastName` deben ser null
- `personCategory` debe ser "LEGAL"

#### Validaciones de identificación
- `identificationType`: DNI, CIF, NIE, PASSPORT
- `identificationNumber` único por tenant
- Combinación única de `identificationType` + `identificationNumber`

## Troubleshooting

### Error 401 (Unauthorized)
- Verifica que el token de autenticación sea válido
- Ejecuta nuevamente el endpoint de Login

### Error 400 (Bad Request)
- Revisa que todos los campos obligatorios estén presentes
- Verifica que los tipos de datos sean correctos
- Asegúrate de que las validaciones de negocio se cumplan

### Error 404 (Not Found)
- Verifica que los IDs utilizados existan en la base de datos
- Confirma que el tenant_id sea correcto

### Error 500 (Internal Server Error)
- Revisa los logs del servidor
- Verifica que la base de datos esté funcionando correctamente

## Notas importantes

- Todos los endpoints requieren autenticación
- El header `x-tenant-id` es obligatorio para la mayoría de operaciones
- Los IDs de persona, contacto y dirección son UUIDs
- La búsqueda por nombre incluye también email y teléfono
- Solo se puede tener una dirección fiscal por persona
- Se pueden tener múltiples contactos por persona, pero solo uno principal

## Contacto

Para dudas o problemas con la API, contacta al equipo de desarrollo.
