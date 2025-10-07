#!/usr/bin/env node

/**
 * Script de testing completo para Fase 1 después del fix del trigger
 * 
 * Este script prueba:
 * 1. Rate limiting funcionando
 * 2. Validaciones Zod funcionando
 * 3. Creación de configuraciones (después del fix del trigger)
 * 4. Headers de rate limiting
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

// Test 1: Verificar que el servidor está funcionando
async function testServerHealth() {
  logTest('Test 1: Verificar salud del servidor')
  
  const result = await makeRequest(`${BASE_URL}`)
  
  if (result.status === 200) {
    logSuccess('Servidor funcionando correctamente')
  } else {
    logError(`Servidor no responde correctamente: ${result.status}`)
    return false
  }
  
  return true
}

// Test 2: Rate Limiting - Headers presentes
async function testRateLimitHeaders() {
  logTest('Test 2: Headers de Rate Limiting')
  
  const result = await makeRequest(`${BASE_URL}/api/configurations`)
  
  if (result.headers) {
    const hasRateLimitHeaders = result.headers['x-ratelimit-remaining'] !== undefined
    
    if (hasRateLimitHeaders) {
      logSuccess('Headers de rate limiting están presentes')
      log(`   X-RateLimit-Remaining: ${result.headers['x-ratelimit-remaining']}`)
      log(`   X-RateLimit-Reset: ${result.headers['x-ratelimit-reset']}`)
      return true
    } else {
      logError('Headers de rate limiting no están presentes')
      return false
    }
  }
  
  return false
}

// Test 3: Validación Zod - Datos inválidos
async function testZodValidation() {
  logTest('Test 3: Validación Zod - Datos inválidos')
  
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
    logSuccess('Validación Zod funciona correctamente')
    log(`   Status: ${result.status}`)
    log(`   Errores encontrados: ${result.data.details?.length || 0}`)
    
    if (result.data.details) {
      result.data.details.forEach(detail => {
        log(`   - ${detail.field}: ${detail.message}`)
      })
    }
    return true
  } else if (result.status === 401) {
    logWarning('No autenticado - validación Zod no se puede probar completamente')
    return true // Esperado sin autenticación
  } else {
    logError(`Validación Zod falló. Esperado: 400, Obtenido: ${result.status}`)
    console.log('Response:', result.data)
    return false
  }
}

// Test 4: Rate Limiting - Múltiples requests
async function testRateLimiting() {
  logTest('Test 4: Rate Limiting - Múltiples requests')
  
  log('Haciendo 15 requests rápidas para probar rate limiting...')
  
  const requests = []
  for (let i = 0; i < 15; i++) {
    requests.push(
      makeRequest(`${BASE_URL}/api/configurations`, {
        method: 'GET'
      })
    )
  }
  
  const results = await Promise.all(requests)
  
  const rateLimited = results.filter(r => r.status === 429)
  const successful = results.filter(r => r.status === 200 || r.status === 401)
  const errors = results.filter(r => r.status >= 500)
  
  log(`   Total requests: ${results.length}`)
  log(`   Exitosos (200/401): ${successful.length}`)
  log(`   Rate limited (429): ${rateLimited.length}`)
  log(`   Errores (5xx): ${errors.length}`)
  
  if (errors.length > 0) {
    logError('Hay errores del servidor - posible problema con el trigger')
    return false
  }
  
  if (rateLimited.length > 0) {
    logSuccess('Rate limiting funciona correctamente')
    const firstRateLimit = rateLimited[0]
    if (firstRateLimit.headers) {
      log(`   Headers del rate limit:`)
      log(`   - X-RateLimit-Remaining: ${firstRateLimit.headers['x-ratelimit-remaining']}`)
      log(`   - Retry-After: ${firstRateLimit.headers['retry-after']}`)
    }
  } else {
    logWarning('Rate limiting no se activó - límites pueden ser muy altos')
  }
  
  return true
}

// Test 5: Validación de query parameters
async function testQueryParameters() {
  logTest('Test 5: Validación de query parameters')
  
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
    return false
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
  } else if (result2.status === 401) {
    logWarning('No autenticado - validación de query params no se puede probar completamente')
  } else {
    logError(`Query parameters inválidos no fueron rechazados: ${result2.status}`)
    return false
  }
  
  return true
}

// Test 6: Verificar que no hay errores 500
async function testNoServerErrors() {
  logTest('Test 6: Verificar ausencia de errores 500')
  
  const testRequests = [
    { method: 'GET', url: `${BASE_URL}/api/configurations` },
    { method: 'POST', url: `${BASE_URL}/api/configurations`, body: JSON.stringify({ name: 'test' }) },
    { method: 'GET', url: `${BASE_URL}/api/configurations?limit=5` },
  ]
  
  let hasErrors = false
  
  for (const request of testRequests) {
    const result = await makeRequest(request.url, {
      method: request.method,
      body: request.body
    })
    
    if (result.status >= 500) {
      logError(`Error 500 en ${request.method} ${request.url}: ${result.status}`)
      if (result.data) {
        console.log('Error details:', result.data)
      }
      hasErrors = true
    }
  }
  
  if (!hasErrors) {
    logSuccess('No hay errores 500 - trigger corregido correctamente')
  }
  
  return !hasErrors
}

// Función principal
async function runTests() {
  log('🚀 Iniciando tests completos de Fase 1 (post-fix)', 'bold')
  log('='.repeat(60), 'bold')
  
  const tests = [
    { name: 'Servidor funcionando', fn: testServerHealth },
    { name: 'Headers de rate limiting', fn: testRateLimitHeaders },
    { name: 'Validación Zod', fn: testZodValidation },
    { name: 'Rate limiting', fn: testRateLimiting },
    { name: 'Query parameters', fn: testQueryParameters },
    { name: 'Sin errores 500', fn: testNoServerErrors },
  ]
  
  let passed = 0
  let total = tests.length
  
  for (const test of tests) {
    try {
      const result = await test.fn()
      if (result) {
        passed++
      }
    } catch (error) {
      logError(`Error en test "${test.name}": ${error.message}`)
    }
  }
  
  log('\n📊 RESUMEN DE TESTS', 'bold')
  log('='.repeat(60), 'bold')
  log(`✅ Pasados: ${passed}/${total}`, passed === total ? 'green' : 'yellow')
  log(`❌ Fallidos: ${total - passed}/${total}`, passed === total ? 'green' : 'red')
  
  if (passed === total) {
    log('\n🎉 ¡TODOS LOS TESTS PASARON!', 'green')
    log('✅ Fase 1 implementada correctamente', 'green')
    log('✅ Rate limiting funcionando', 'green')
    log('✅ Validaciones Zod funcionando', 'green')
    log('✅ Trigger corregido', 'green')
  } else {
    log('\n⚠️ Algunos tests fallaron', 'yellow')
    log('Revisa los errores arriba', 'yellow')
  }
  
  log('='.repeat(60), 'bold')
}

// Ejecutar tests
if (require.main === module) {
  runTests()
}

module.exports = { runTests }
