#!/usr/bin/env node

/**
 * Script de testing para Fase 1: Validaciones Zod + Rate Limiting
 * 
 * Este script prueba:
 * 1. Validaciones de entrada con Zod
 * 2. Rate limiting con Upstash
 * 3. Respuestas de error apropiadas
 */

const BASE_URL = 'http://localhost:3000'

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logTest(testName) {
  log(`\n🧪 ${testName}`, 'blue')
  log('─'.repeat(50), 'blue')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

// Función para hacer requests HTTP
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    
    const data = await response.json()
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data
    }
  } catch (error) {
    return {
      status: 0,
      error: error.message
    }
  }
}

// Test 1: Validación de datos inválidos
async function testInvalidData() {
  logTest('Test 1: Validación de datos inválidos')
  
  const invalidData = {
    name: '', // Nombre vacío
    description: 'A'.repeat(600), // Descripción muy larga
    icon: 'invalid@icon!', // Icono con caracteres inválidos
    color: 'not-a-color', // Color inválido
    sort_order: -1 // Orden negativo
  }
  
  const result = await makeRequest(`${BASE_URL}/api/configurations`, {
    method: 'POST',
    body: JSON.stringify(invalidData)
  })
  
  if (result.status === 400) {
    logSuccess('Validación de datos inválidos funciona correctamente')
    log(`   Status: ${result.status}`)
    log(`   Errores encontrados: ${result.data.details?.length || 0}`)
    
    if (result.data.details) {
      result.data.details.forEach(detail => {
        log(`   - ${detail.field}: ${detail.message}`)
      })
    }
  } else {
    logError(`Validación falló. Esperado: 400, Obtenido: ${result.status}`)
    console.log('Response:', result.data)
  }
}

// Test 2: Validación de datos válidos
async function testValidData() {
  logTest('Test 2: Validación de datos válidos')
  
  const validData = {
    name: 'Test Configuration',
    description: 'Esta es una configuración de prueba',
    icon: 'test-icon',
    color: '#3B82F6',
    sort_order: 1
  }
  
  const result = await makeRequest(`${BASE_URL}/api/configurations`, {
    method: 'POST',
    body: JSON.stringify(validData)
  })
  
  if (result.status === 201) {
    logSuccess('Validación de datos válidos funciona correctamente')
    log(`   Status: ${result.status}`)
    log(`   Configuración creada: ${result.data.data?.name}`)
  } else if (result.status === 401) {
    logWarning('No autenticado - esto es esperado sin login')
  } else {
    logError(`Validación falló. Esperado: 201, Obtenido: ${result.status}`)
    console.log('Response:', result.data)
  }
}

// Test 3: Rate Limiting
async function testRateLimiting() {
  logTest('Test 3: Rate Limiting')
  
  log('Haciendo múltiples requests rápidas para probar rate limiting...')
  
  const requests = []
  for (let i = 0; i < 25; i++) {
    requests.push(
      makeRequest(`${BASE_URL}/api/configurations`, {
        method: 'GET'
      })
    )
  }
  
  const results = await Promise.all(requests)
  
  const rateLimited = results.filter(r => r.status === 429)
  const successful = results.filter(r => r.status === 200 || r.status === 401)
  
  log(`   Total requests: ${results.length}`)
  log(`   Exitosos: ${successful.length}`)
  log(`   Rate limited: ${rateLimited.length}`)
  
  if (rateLimited.length > 0) {
    logSuccess('Rate limiting funciona correctamente')
    log(`   Headers del primer rate limit:`, 'yellow')
    const firstRateLimit = rateLimited[0]
    if (firstRateLimit.headers) {
      log(`   - X-RateLimit-Remaining: ${firstRateLimit.headers['x-ratelimit-remaining']}`)
      log(`   - Retry-After: ${firstRateLimit.headers['retry-after']}`)
    }
  } else {
    logWarning('Rate limiting no se activó - puede ser que los límites sean muy altos')
  }
}

// Test 4: Validación de query parameters
async function testQueryParameters() {
  logTest('Test 4: Validación de query parameters')
  
  // Test con parámetros válidos
  const validParams = new URLSearchParams({
    limit: '10',
    offset: '0',
    is_active: 'true'
  })
  
  const result1 = await makeRequest(`${BASE_URL}/api/configurations?${validParams}`)
  
  if (result1.status === 200 || result1.status === 401) {
    logSuccess('Query parameters válidos funcionan')
  } else {
    logError(`Query parameters válidos fallaron: ${result1.status}`)
  }
  
  // Test con parámetros inválidos
  const invalidParams = new URLSearchParams({
    limit: '1000', // Muy alto
    offset: '-1', // Negativo
    is_active: 'maybe' // Valor inválido
  })
  
  const result2 = await makeRequest(`${BASE_URL}/api/configurations?${invalidParams}`)
  
  if (result2.status === 400) {
    logSuccess('Query parameters inválidos son rechazados correctamente')
  } else {
    logError(`Query parameters inválidos no fueron rechazados: ${result2.status}`)
  }
}

// Test 5: Headers de rate limiting
async function testRateLimitHeaders() {
  logTest('Test 5: Headers de rate limiting')
  
  const result = await makeRequest(`${BASE_URL}/api/configurations`)
  
  if (result.headers) {
    const hasRateLimitHeaders = result.headers['x-ratelimit-remaining'] !== undefined
    
    if (hasRateLimitHeaders) {
      logSuccess('Headers de rate limiting están presentes')
      log(`   X-RateLimit-Remaining: ${result.headers['x-ratelimit-remaining']}`)
      log(`   X-RateLimit-Reset: ${result.headers['x-ratelimit-reset']}`)
    } else {
      logWarning('Headers de rate limiting no están presentes')
    }
  }
}

// Función principal
async function runTests() {
  log('🚀 Iniciando tests de Fase 1: Validaciones Zod + Rate Limiting', 'bold')
  log('='.repeat(60), 'bold')
  
  try {
    await testInvalidData()
    await testValidData()
    await testRateLimiting()
    await testQueryParameters()
    await testRateLimitHeaders()
    
    log('\n🎉 Tests completados!', 'green')
    log('='.repeat(60), 'green')
    
  } catch (error) {
    logError(`Error durante los tests: ${error.message}`)
    process.exit(1)
  }
}

// Ejecutar tests
if (require.main === module) {
  runTests()
}

module.exports = { runTests }
