// Pruebas unitarias de las validaciones incorporadas a partir del reporte de mejoras
// de QA (sin base de datos). Sirven como documentación viva del comportamiento esperado.
//   MEJ-03 → fortaleza de la contraseña
//   MEJ-04 → saneamiento y límites del texto libre de visitantes
const { evaluarPassword } = require('../../src/utils/password');
const { crearSchema } = require('../../src/modules/usuarios/usuarios.schema');
const { registrarSchema: visitanteSchema } = require('../../src/modules/visitantes/visitantes.schema');

describe('MEJ-03 · Fortaleza de la contraseña', () => {
  const base = { nombre: 'Ana', apellidos: 'López', correo: 'ana@correo.com', tipo: 'ALUMNO' };

  it('rechaza contraseñas de menos de 8 caracteres', () => {
    expect(evaluarPassword('123456').ok).toBe(false);
    expect(evaluarPassword('aaaaaa').ok).toBe(false);
  });

  it('exige combinar letras y números', () => {
    expect(evaluarPassword('solotexto').ok).toBe(false);
    expect(evaluarPassword('12345678').ok).toBe(false);
  });

  it('rechaza contraseñas obvias y la propia matrícula', () => {
    expect(evaluarPassword('password').ok).toBe(false);
    expect(evaluarPassword('Sicad123!').ok).toBe(false);
    expect(evaluarPassword('up230571', 'UP230571').ok).toBe(false);
  });

  it('acepta una contraseña fuerte', () => {
    expect(evaluarPassword('Fuerte123').ok).toBe(true);
  });

  it('rechaza el alta si la contraseña enviada es débil', () => {
    const r = crearSchema.safeParse({ ...base, password: '123456' });
    expect(r.success).toBe(false);
  });

  it('acepta el alta con una contraseña fuerte', () => {
    const r = crearSchema.safeParse({ ...base, password: 'Fuerte123' });
    expect(r.success).toBe(true);
  });
});

describe('MEJ-04 · Saneamiento del texto libre de visitantes', () => {
  it('recorta los espacios sobrantes del nombre', () => {
    const r = visitanteSchema.safeParse({ nombre: '  Juan Pérez  ', identificacion: 'INE123' });
    expect(r.success).toBe(true);
    expect(r.data.nombre).toBe('Juan Pérez');
  });

  it('rechaza un nombre que excede el tamaño de su columna', () => {
    const r = visitanteSchema.safeParse({ nombre: 'x'.repeat(300), identificacion: 'INE123' });
    expect(r.success).toBe(false);
  });

  it('rechaza una identificación demasiado larga', () => {
    const r = visitanteSchema.safeParse({ nombre: 'Juan', identificacion: 'y'.repeat(60) });
    expect(r.success).toBe(false);
  });
});
