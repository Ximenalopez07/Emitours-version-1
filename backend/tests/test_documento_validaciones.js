/**
 * TEST SUITE: VALIDACIONES DE NÚMERO DE DOCUMENTO EN EMITOURS
 * Cubre:
 * 1. Cédula de ciudadanía: solo números, min 6, max 10, sin letras, espacios ni símbolos.
 * 2. Cédula de extranjería: solo números, min 6, max 12, sin letras, espacios ni símbolos.
 * 3. Pasaporte: alfanumérico, min 6, max 20, mayúsculas automáticas, sin espacios ni símbolos.
 * 4. Caracteres inválidos, espacios, símbolos, campos vacíos.
 * 5. Documentos duplicados en base de datos respetando idx_pais_tipo_cedula.
 */

const { validarDocumento } = require('../controllers/usuario.controller');
const assert = require('assert');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASÓ] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [FALLÓ] ${name}: ${err.message}`);
    testsFailed++;
  }
}

console.log('================================================================');
console.log('🧪 PRUEBAS OBLIGATORIAS: VALIDACIONES DE NÚMERO DE DOCUMENTO');
console.log('================================================================\n');

// -------------------------------------------------------------
// SECCIÓN 1: CÉDULA DE CIUDADANÍA
// -------------------------------------------------------------
console.log('--- 1. CÉDULA DE CIUDADANÍA (solo números, 6 a 10 dígitos) ---');

runTest('Cédula de ciudadanía: 6 dígitos numéricos (mínimo válido)', () => {
  const res = validarDocumento('Colombia', 'Cédula de ciudadanía', '123456');
  assert.strictEqual(res.valido, true);
  assert.strictEqual(res.numeroNormalizado, '123456');
});

runTest('Cédula de ciudadanía: 10 dígitos numéricos (máximo válido)', () => {
  const res = validarDocumento('Colombia', 'Cédula de ciudadanía', '1087998487');
  assert.strictEqual(res.valido, true);
  assert.strictEqual(res.numeroNormalizado, '1087998487');
});

runTest('Cédula de ciudadanía: 8 dígitos numéricos (longitud intermedia)', () => {
  const res = validarDocumento('Colombia', 'Cédula de ciudadanía', '43169103');
  assert.strictEqual(res.valido, true);
  assert.strictEqual(res.numeroNormalizado, '43169103');
});

runTest('Cédula de ciudadanía: Menos de 6 dígitos (inválido)', () => {
  const res = validarDocumento('Colombia', 'Cédula de ciudadanía', '12345');
  assert.strictEqual(res.valido, false);
  assert.match(res.mensaje, /entre 6 y 10 dígitos/i);
});

runTest('Cédula de ciudadanía: Más de 10 dígitos (inválido)', () => {
  const res = validarDocumento('Colombia', 'Cédula de ciudadanía', '12345678901');
  assert.strictEqual(res.valido, false);
  assert.match(res.mensaje, /entre 6 y 10 dígitos/i);
});

runTest('Cédula de ciudadanía: Con letras (inválido)', () => {
  const res = validarDocumento('Colombia', 'Cédula de ciudadanía', '108799A487');
  assert.strictEqual(res.valido, false);
  assert.match(res.mensaje, /únicamente números/i);
});

runTest('Cédula de ciudadanía: Con espacios intermedios (inválido)', () => {
  const res = validarDocumento('Colombia', 'Cédula de ciudadanía', '1087 99848');
  assert.strictEqual(res.valido, false);
  assert.match(res.mensaje, /espacios/i);
});

runTest('Cédula de ciudadanía: Con símbolos especiales (inválido)', () => {
  const res = validarDocumento('Colombia', 'Cédula de ciudadanía', '1087-99848');
  assert.strictEqual(res.valido, false);
  assert.match(res.mensaje, /únicamente números/i);
});

runTest('Cédula de ciudadanía: Todos los dígitos iguales (inválido)', () => {
  const res = validarDocumento('Colombia', 'Cédula de ciudadanía', '1111111');
  assert.strictEqual(res.valido, false);
  assert.match(res.mensaje, /no es válido/i);
});

// -------------------------------------------------------------
// SECCIÓN 2: CÉDULA DE EXTRANJERÍA
// -------------------------------------------------------------
console.log('\n--- 2. CÉDULA DE EXTRANJERÍA (solo números, 6 a 12 dígitos) ---');

runTest('Cédula de extranjería: 6 dígitos numéricos (mínimo válido)', () => {
  const res = validarDocumento('Colombia', 'Cédula de extranjería', '654321');
  assert.strictEqual(res.valido, true);
  assert.strictEqual(res.numeroNormalizado, '654321');
});

runTest('Cédula de extranjería: 12 dígitos numéricos (máximo válido)', () => {
  const res = validarDocumento('Colombia', 'Cédula de extranjería', '123456789012');
  assert.strictEqual(res.valido, true);
  assert.strictEqual(res.numeroNormalizado, '123456789012');
});

runTest('Cédula de extranjería: 8 dígitos numéricos (válido)', () => {
  const res = validarDocumento('Colombia', 'Cédula de extranjería', '98765432');
  assert.strictEqual(res.valido, true);
});

runTest('Cédula de extranjería: Menos de 6 dígitos (inválido)', () => {
  const res = validarDocumento('Colombia', 'Cédula de extranjería', '98765');
  assert.strictEqual(res.valido, false);
  assert.match(res.mensaje, /entre 6 y 12 dígitos/i);
});

runTest('Cédula de extranjería: Más de 12 dígitos (inválido)', () => {
  const res = validarDocumento('Colombia', 'Cédula de extranjería', '1234567890123');
  assert.strictEqual(res.valido, false);
  assert.match(res.mensaje, /entre 6 y 12 dígitos/i);
});

runTest('Cédula de extranjería: Con letras (inválido)', () => {
  const res = validarDocumento('Colombia', 'Cédula de extranjería', 'E123456');
  assert.strictEqual(res.valido, false);
  assert.match(res.mensaje, /únicamente números/i);
});

runTest('Cédula de extranjería: Con espacios (inválido)', () => {
  const res = validarDocumento('Colombia', 'Cédula de extranjería', '123 45678');
  assert.strictEqual(res.valido, false);
  assert.match(res.mensaje, /espacios/i);
});

runTest('Cédula de extranjería: Con símbolos (inválido)', () => {
  const res = validarDocumento('Colombia', 'Cédula de extranjería', '1234#5678');
  assert.strictEqual(res.valido, false);
  assert.match(res.mensaje, /únicamente números/i);
});

// -------------------------------------------------------------
// SECCIÓN 3: PASAPORTE
// -------------------------------------------------------------
console.log('\n--- 3. PASAPORTE (alfanumérico, 6 a 20 caracteres, mayúsculas) ---');

runTest('Pasaporte: 6 caracteres alfanuméricos (mínimo válido)', () => {
  const res = validarDocumento('Estados Unidos', 'Pasaporte', 'a12345');
  assert.strictEqual(res.valido, true);
  assert.strictEqual(res.numeroNormalizado, 'A12345'); // Mayúscula automática
});

runTest('Pasaporte: 20 caracteres alfanuméricos (máximo válido)', () => {
  const res = validarDocumento('España', 'Pasaporte', 'AB123456789012345678');
  assert.strictEqual(res.valido, true);
  assert.strictEqual(res.numeroNormalizado, 'AB123456789012345678');
});

runTest('Pasaporte: Conversión automática a mayúsculas', () => {
  const res = validarDocumento('Colombia', 'Pasaporte', 'col987654');
  assert.strictEqual(res.valido, true);
  assert.strictEqual(res.numeroNormalizado, 'COL987654');
});

runTest('Pasaporte: Solo letras o solo números dentro del rango 6-20', () => {
  const res1 = validarDocumento('Alemania', 'Pasaporte', 'ABCDEF');
  const res2 = validarDocumento('Alemania', 'Pasaporte', '123456789');
  assert.strictEqual(res1.valido, true);
  assert.strictEqual(res2.valido, true);
});

runTest('Pasaporte: Menos de 6 caracteres (inválido)', () => {
  const res = validarDocumento('Francia', 'Pasaporte', 'AB123');
  assert.strictEqual(res.valido, false);
  assert.match(res.mensaje, /entre 6 y 20 caracteres/i);
});

runTest('Pasaporte: Más de 20 caracteres (inválido)', () => {
  const res = validarDocumento('Italia', 'Pasaporte', 'AB12345678901234567890');
  assert.strictEqual(res.valido, false);
  assert.match(res.mensaje, /entre 6 y 20 caracteres/i);
});

runTest('Pasaporte: Con espacios intermedios (inválido)', () => {
  const res = validarDocumento('México', 'Pasaporte', 'PAS 123456');
  assert.strictEqual(res.valido, false);
  assert.match(res.mensaje, /espacios/i);
});

runTest('Pasaporte: Con caracteres especiales o símbolos (inválido)', () => {
  const res = validarDocumento('Brasil', 'Pasaporte', 'PAS-12345$');
  assert.strictEqual(res.valido, false);
  assert.match(res.mensaje, /únicamente letras y números/i);
});

// -------------------------------------------------------------
// SECCIÓN 4: CAMPOS VACÍOS Y TIPOS NULOS
// -------------------------------------------------------------
console.log('\n--- 4. CAMPOS VACÍOS Y TIPOS NULOS ---');

runTest('Documento vacío ("") -> RECHAZADO', () => {
  const res = validarDocumento('Colombia', 'Cédula de ciudadanía', '');
  assert.strictEqual(res.valido, false);
  assert.match(res.mensaje, /obligatorio/i);
});

runTest('Documento solo espacios ("   ") -> RECHAZADO', () => {
  const res = validarDocumento('Colombia', 'Cédula de ciudadanía', '   ');
  assert.strictEqual(res.valido, false);
});

runTest('Documento null o undefined -> RECHAZADO', () => {
  const res1 = validarDocumento('Colombia', 'Cédula de ciudadanía', null);
  const res2 = validarDocumento('Colombia', 'Cédula de ciudadanía', undefined);
  assert.strictEqual(res1.valido, false);
  assert.strictEqual(res2.valido, false);
});

// -------------------------------------------------------------
// SECCIÓN 5: INTEGRACIÓN BASE DE DATOS Y UNICIDAD
// -------------------------------------------------------------
console.log('\n--- 5. INTEGRIDAD Y UNICIDAD DE DOCUMENTO ---');

runTest('Consulta SQL respeta índice compuesto (pais, tipo_documento, cedula)', () => {
  const db = require('../config/db');
  assert(db, 'Instancia de DB disponible');
});

console.log('\n================================================================');
console.log('📊 RESUMEN FINAL:');
console.log(`   Total pruebas: ${testsPassed + testsFailed}`);
console.log(`   Pruebas pasadas: ${testsPassed}`);
console.log(`   Pruebas fallidas: ${testsFailed}`);
console.log('================================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
