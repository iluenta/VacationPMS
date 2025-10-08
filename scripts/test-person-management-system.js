#!/usr/bin/env node

/**
 * Script de prueba completa del sistema de Person Management
 * Verifica que todos los endpoints y funcionalidades estén funcionando correctamente
 */

const https = require('https')
const http = require('http')

// Configuración
const BASE_URL = 'http://localhost:3000'
const TEST_USER_ID = '453129fb-950e-4934-a1ff-2cb83ca697cd' // pramsuarez@gmail.com (admin)
const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000001' // Demo Tenant

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

// Función para hacer requests HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
        ...options.headers
      }
    }

    const req = http.request(requestOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          })
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (options.body) {
      req.write(JSON.stringify(options.body))
    }

    req.end()
  })
}

// Función para imprimir resultados
function printResult(testName, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL'
  const color = success ? colors.green : colors.red
  
  console.log(`${color}${status}${colors.reset} ${testName}`)
  if (details) {
    console.log(`   ${details}`)
  }
}

// Función para imprimir sección
function printSection(title) {
  console.log(`\n${colors.bold}${colors.blue}=== ${title} ===${colors.reset}`)
}

// Tests
async function runTests() {
  console.log(`${colors.bold}${colors.blue}🧪 INICIANDO PRUEBAS DEL SISTEMA DE PERSON MANAGEMENT${colors.reset}\n`)

  let totalTests = 0
  let passedTests = 0

  // =====================================================
  // 1. PRUEBAS DE CONECTIVIDAD
  // =====================================================
  printSection('1. PRUEBAS DE CONECTIVIDAD')

  try {
    const response = await makeRequest(`${BASE_URL}/api/persons-v2/test`)
    totalTests++
    if (response.status === 200 && response.data.success) {
      printResult('Endpoint de prueba básica', true, 'Arquitectura funcionando')
      passedTests++
    } else {
      printResult('Endpoint de prueba básica', false, `Status: ${response.status}`)
    }
  } catch (error) {
    totalTests++
    printResult('Endpoint de prueba básica', false, `Error: ${error.message}`)
  }

  // =====================================================
  // 2. PRUEBAS DE ENDPOINTS PRINCIPALES
  // =====================================================
  printSection('2. PRUEBAS DE ENDPOINTS PRINCIPALES')

  // GET /api/persons-v2
  try {
    const response = await makeRequest(`${BASE_URL}/api/persons-v2?tenant_id=${TEST_TENANT_ID}`)
    totalTests++
    if (response.status === 200 && response.data.success) {
      printResult('GET /api/persons-v2', true, `Encontradas ${response.data.data.persons.length} personas`)
      passedTests++
    } else {
      printResult('GET /api/persons-v2', false, `Status: ${response.status}`)
    }
  } catch (error) {
    totalTests++
    printResult('GET /api/persons-v2', false, `Error: ${error.message}`)
  }

  // POST /api/persons-v2 (crear persona)
  try {
    const testPerson = {
      firstName: 'Test',
      lastName: 'Person',
      identificationType: 'DNI',
      identificationNumber: `TEST-${Date.now()}`,
      personCategory: 'PHYSICAL',
      personTypeId: '7e2227de-c10b-4d74-9b3b-06b2c95be833' // Tipo de persona existente
    }

    const response = await makeRequest(`${BASE_URL}/api/persons-v2`, {
      method: 'POST',
      body: testPerson
    })
    totalTests++
    if (response.status === 201 && response.data.success) {
      printResult('POST /api/persons-v2', true, `Persona creada: ${response.data.data.firstName} ${response.data.data.lastName}`)
      passedTests++
    } else {
      printResult('POST /api/persons-v2', false, `Status: ${response.status}, Error: ${response.data.error || 'Unknown'}`)
    }
  } catch (error) {
    totalTests++
    printResult('POST /api/persons-v2', false, `Error: ${error.message}`)
  }

  // =====================================================
  // 3. PRUEBAS DE ENDPOINTS ESPECÍFICOS
  // =====================================================
  printSection('3. PRUEBAS DE ENDPOINTS ESPECÍFICOS')

  // GET /api/persons-v2/[id]
  try {
    const personId = 'f5fb3a6b-b6ef-473d-8bc8-104673d21b3e' // Persona existente
    const response = await makeRequest(`${BASE_URL}/api/persons-v2/${personId}?tenant_id=${TEST_TENANT_ID}`)
    totalTests++
    if (response.status === 200 && response.data.success) {
      printResult('GET /api/persons-v2/[id]', true, `Persona encontrada: ${response.data.data.displayName}`)
      passedTests++
    } else {
      printResult('GET /api/persons-v2/[id]', false, `Status: ${response.status}`)
    }
  } catch (error) {
    totalTests++
    printResult('GET /api/persons-v2/[id]', false, `Error: ${error.message}`)
  }

  // GET /api/persons-v2/[id]/contacts
  try {
    const personId = 'f5fb3a6b-b6ef-473d-8bc8-104673d21b3e' // Persona existente
    const response = await makeRequest(`${BASE_URL}/api/persons-v2/${personId}/contacts?tenant_id=${TEST_TENANT_ID}`)
    totalTests++
    if (response.status === 200 && response.data.success) {
      printResult('GET /api/persons-v2/[id]/contacts', true, `Contactos encontrados: ${response.data.data.contactInfos.length}`)
      passedTests++
    } else {
      printResult('GET /api/persons-v2/[id]/contacts', false, `Status: ${response.status}`)
    }
  } catch (error) {
    totalTests++
    printResult('GET /api/persons-v2/[id]/contacts', false, `Error: ${error.message}`)
  }

  // GET /api/persons-v2/[id]/fiscal-address
  try {
    const personId = 'f5fb3a6b-b6ef-473d-8bc8-104673d21b3e' // Persona existente
    const response = await makeRequest(`${BASE_URL}/api/persons-v2/${personId}/fiscal-address?tenant_id=${TEST_TENANT_ID}`)
    totalTests++
    if (response.status === 200 && response.data.success) {
      const hasAddress = response.data.data !== null
      printResult('GET /api/persons-v2/[id]/fiscal-address', true, `Dirección fiscal: ${hasAddress ? 'Encontrada' : 'No encontrada'}`)
      passedTests++
    } else {
      printResult('GET /api/persons-v2/[id]/fiscal-address', false, `Status: ${response.status}`)
    }
  } catch (error) {
    totalTests++
    printResult('GET /api/persons-v2/[id]/fiscal-address', false, `Error: ${error.message}`)
  }

  // =====================================================
  // 4. PRUEBAS DE VALIDACIÓN
  // =====================================================
  printSection('4. PRUEBAS DE VALIDACIÓN')

  // POST con datos inválidos
  try {
    const invalidPerson = {
      firstName: '', // Nombre vacío
      lastName: 'Test',
      identificationType: 'INVALID', // Tipo inválido
      identificationNumber: '',
      personCategory: 'PHYSICAL'
    }

    const response = await makeRequest(`${BASE_URL}/api/persons-v2`, {
      method: 'POST',
      body: invalidPerson
    })
    totalTests++
    if (response.status === 400) {
      printResult('Validación de datos inválidos', true, 'Correctamente rechazado')
      passedTests++
    } else {
      printResult('Validación de datos inválidos', false, `Status: ${response.status}, debería ser 400`)
    }
  } catch (error) {
    totalTests++
    printResult('Validación de datos inválidos', false, `Error: ${error.message}`)
  }

  // =====================================================
  // 5. PRUEBAS DE SEGURIDAD
  // =====================================================
  printSection('5. PRUEBAS DE SEGURIDAD')

  // Request sin autorización
  try {
    const response = await makeRequest(`${BASE_URL}/api/persons-v2`, {
      headers: {
        'Authorization': '' // Sin autorización
      }
    })
    totalTests++
    if (response.status === 401) {
      printResult('Autorización requerida', true, 'Correctamente rechazado sin token')
      passedTests++
    } else {
      printResult('Autorización requerida', false, `Status: ${response.status}, debería ser 401`)
    }
  } catch (error) {
    totalTests++
    printResult('Autorización requerida', false, `Error: ${error.message}`)
  }

  // =====================================================
  // 6. PRUEBAS DE ENDPOINTS DE DEBUG
  // =====================================================
  printSection('6. PRUEBAS DE ENDPOINTS DE DEBUG')

  // GET /api/persons-v2/debug
  try {
    const response = await makeRequest(`${BASE_URL}/api/persons-v2/debug`)
    totalTests++
    if (response.status === 200 && response.data.success) {
      const results = response.data.results
      const passedSteps = Object.values(results).filter(v => v === true).length
      printResult('Debug completo', true, `${passedSteps}/4 pasos exitosos`)
      passedTests++
    } else {
      printResult('Debug completo', false, `Status: ${response.status}`)
    }
  } catch (error) {
    totalTests++
    printResult('Debug completo', false, `Error: ${error.message}`)
  }

  // =====================================================
  // RESUMEN FINAL
  // =====================================================
  printSection('RESUMEN FINAL')

  const successRate = ((passedTests / totalTests) * 100).toFixed(1)
  const color = successRate >= 80 ? colors.green : successRate >= 60 ? colors.yellow : colors.red

  console.log(`${colors.bold}Total de pruebas: ${totalTests}`)
  console.log(`${color}Pruebas exitosas: ${passedTests}${colors.reset}`)
  console.log(`${color}Pruebas fallidas: ${totalTests - passedTests}${colors.reset}`)
  console.log(`${color}Tasa de éxito: ${successRate}%${colors.reset}`)

  if (successRate >= 80) {
    console.log(`\n${colors.green}${colors.bold}🎉 SISTEMA FUNCIONANDO CORRECTAMENTE${colors.reset}`)
  } else if (successRate >= 60) {
    console.log(`\n${colors.yellow}${colors.bold}⚠️ SISTEMA CON PROBLEMAS MENORES${colors.reset}`)
  } else {
    console.log(`\n${colors.red}${colors.bold}❌ SISTEMA CON PROBLEMAS GRAVES${colors.reset}`)
  }

  console.log(`\n${colors.blue}Para más detalles, revisa los logs del servidor.${colors.reset}`)
}

// Ejecutar pruebas
runTests().catch(error => {
  console.error(`${colors.red}Error ejecutando pruebas: ${error.message}${colors.reset}`)
  process.exit(1)
})
