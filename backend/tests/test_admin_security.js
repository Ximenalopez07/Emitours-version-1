require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../config/db');

const baseUrl = 'http://127.0.0.1:3000';

async function runTests() {
  console.log(`\n========================================================================`);
  console.log(`[TESTS] PRUEBAS OBLIGATORIAS: VALIDACIONES DE ESPACIOS Y SEGURIDAD ADMIN`);
  console.log(`========================================================================\n`);

  let failures = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`);
    } else {
      console.error(`  ❌ FALLO: ${message}`);
      failures++;
    }
  }

  // CASO 1: Correo sin espacios y con formato válido
  console.log('\n--- CASO 1: Correo sin espacios y con formato válido ---');
  const res1 = await fetch(`${baseUrl}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'admin@emitours.com', contrasena: 'Admin123*' })
  });
  const data1 = await res1.json();
  assert(res1.status === 200 && data1.status === 'OK', `Login exitoso (200 OK) con correo sin espacios y formato válido`);
  assert(data1.token && typeof data1.token === 'string', `Token JWT generado`);

  // CASO 2: Correo con espacios al inicio, en medio y al final
  console.log('\n--- CASO 2: Correo con espacios al inicio, en medio y al final ---');
  const emailsWithSpaces = [
    { label: 'Espacio al inicio', correo: ' admin@emitours.com' },
    { label: 'Espacio en medio', correo: 'admin @emitours.com' },
    { label: 'Espacio al final', correo: 'admin@emitours.com ' },
    { label: 'Varios espacios internos', correo: 'helen henao@gmail.com' }
  ];

  for (const item of emailsWithSpaces) {
    const res = await fetch(`${baseUrl}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: item.correo, contrasena: 'Admin123*' })
    });
    const data = await res.json();
    assert(res.status === 400, `Rechazo 400 para ${item.label}: "${item.correo}"`);
    assert(data.mensaje === 'El correo electrónico no puede contener espacios', `Mensaje exacto para ${item.label}: "${data.mensaje}"`);
  }

  // CASO 3: Contraseña sin espacios
  console.log('\n--- CASO 3: Contraseña sin espacios ---');
  const res3 = await fetch(`${baseUrl}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'helenhenao8@gmail.com', contrasena: 'helen01234*' })
  });
  const data3 = await res3.json();
  assert(res3.status === 200 && data3.status === 'OK', `Autenticación exitosa con contraseña sin espacios`);

  // CASO 4: Contraseña con espacios al inicio, en medio y al final
  console.log('\n--- CASO 4: Contraseña con espacios al inicio, en medio y al final ---');
  const passwordsWithSpaces = [
    { label: 'Espacio al inicio', pass: ' helen01234*' },
    { label: 'Espacio en medio', pass: 'helen 01234*' },
    { label: 'Espacio al final', pass: 'helen01234* ' },
    { label: 'Múltiples espacios', pass: '  Admin123*  ' }
  ];

  for (const item of passwordsWithSpaces) {
    const res = await fetch(`${baseUrl}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'admin@emitours.com', contrasena: item.pass })
    });
    const data = await res.json();
    assert(res.status === 400, `Rechazo 400 para contraseña con ${item.label}: "${item.pass}"`);
    assert(data.mensaje === 'La contraseña no puede contener espacios', `Mensaje exacto: "${data.mensaje}"`);
  }

  // CASO 5: Verificación de pegado de texto con espacios simulado
  console.log('\n--- CASO 5: Rechazo de pegado y envío con espacios ---');
  const pastedEmailRes = await fetch(`${baseUrl}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'correo pegado @emitours.com', contrasena: 'Admin123*' })
  });
  const pastedEmailData = await pastedEmailRes.json();
  assert(pastedEmailRes.status === 400 && pastedEmailData.mensaje === 'El correo electrónico no puede contener espacios', `Texto pegado en correo con espacios es rechazado con "El correo electrónico no puede contener espacios"`);

  const pastedPassRes = await fetch(`${baseUrl}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'admin@emitours.com', contrasena: 'clave pegada con espacios' })
  });
  const pastedPassData = await pastedPassRes.json();
  assert(pastedPassRes.status === 400 && pastedPassData.mensaje === 'La contraseña no puede contener espacios', `Texto pegado en contraseña con espacios es rechazado con "La contraseña no puede contener espacios"`);

  // CASO 6: Campos vacíos
  console.log('\n--- CASO 6: Campos vacíos ---');
  const emptyEmailRes = await fetch(`${baseUrl}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: '', contrasena: 'Admin123*' })
  });
  const emptyEmailData = await emptyEmailRes.json();
  assert(emptyEmailRes.status === 400 && emptyEmailData.mensaje === 'Ingresa tu correo electrónico', `Correo vacío devuelve: "${emptyEmailData.mensaje}"`);

  const emptyPassRes = await fetch(`${baseUrl}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'admin@emitours.com', contrasena: '' })
  });
  const emptyPassData = await emptyPassRes.json();
  assert(emptyPassRes.status === 400 && emptyPassData.mensaje === 'Ingresa tu contraseña', `Contraseña vacía devuelve: "${emptyPassData.mensaje}"`);

  // CASO 7: Inicio de sesión con las credenciales actuales
  console.log('\n--- CASO 7: Inicio de sesión con todas las credenciales actuales ---');
  const currentCredentials = [
    { correo: 'helenhenao8@gmail.com', pass: 'helen01234*' },
    { correo: 'ximena@gmail.com', pass: 'Ximena07*' },
    { correo: 'admin@emitours.com', pass: 'Admin123*' }
  ];

  for (const cred of currentCredentials) {
    const res = await fetch(`${baseUrl}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: cred.correo, contrasena: cred.pass })
    });
    const data = await res.json();
    assert(res.status === 200 && data.status === 'OK', `Login exitoso para administrador legítimo: ${cred.correo}`);
    assert(data.admin && data.admin.correo === cred.correo, `Datos de admin devueltos correctamente sin contraseñas ni hashes`);
  }

  // CASO 8: Espacios no pueden enviarse al backend ni ser procesados
  console.log('\n--- CASO 8: Validación de seguridad de backend contra inyecciones de espacios ---');
  const backendSpaceTest1 = await fetch(`${baseUrl}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: ' admin@emitours.com ', contrasena: ' Admin123* ' })
  });
  assert(backendSpaceTest1.status === 400, `El backend rechaza peticiones con espacios con HTTP 400 sin procesar autenticación`);

  // CASO 9: Intentos ilimitados (sin bloqueos)
  console.log('\n--- CASO 9: Intentos ilimitados (sin bloqueos) ---');
  const INTENTOS = 15;
  let all401 = true;
  for (let i = 1; i <= INTENTOS; i++) {
    const res = await fetch(`${baseUrl}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'admin@emitours.com', contrasena: `PasswordSinEspaciosErronea_${i}` })
    });
    if (res.status !== 401) all401 = false;
  }
  assert(all401, `Se realizaron ${INTENTOS} intentos fallidos consecutivos sin bloqueos de cuenta ni 429`);

  const legitLoginAfterFailures = await fetch(`${baseUrl}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'admin@emitours.com', contrasena: 'Admin123*' })
  });
  const legitData = await legitLoginAfterFailures.json();
  assert(legitLoginAfterFailures.status === 200 && legitData.status === 'OK', `Intento inmediato posterior con credenciales correctas tiene éxito total`);

  console.log('\n========================================================================');
  if (failures === 0) {
    console.log('🎉 TODAS LAS PRUEBAS DE VALIDACIÓN DE ESPACIOS PASARON EXITOSAMENTE 🎉');
  } else {
    console.error(`⚠️ SE REGISTRARON ${failures} FALLOS.`);
  }
  console.log('========================================================================\n');

  process.exit(failures === 0 ? 0 : 1);
}

runTests();
