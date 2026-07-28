// Pruebas unitarias de las validaciones incorporadas a partir de los reportes de
// QA (sin base de datos). Sirven como documentación viva del comportamiento esperado.
//   MEJ-03 → fortaleza de la contraseña
//   MEJ-04 → saneamiento y límites del texto libre de visitantes
//   OBS-03 → el código del QR no debe revelar datos de la persona
//   OBS-07 → nombres y matrículas sin datos basura
//   + campos obligatorios (todo menos la foto) y vigencia máxima de 2 años
const { evaluarPassword } = require('../../src/utils/password');
const { crearSchema } = require('../../src/modules/usuarios/usuarios.schema');
const { registrarSchema: visitanteSchema } = require('../../src/modules/visitantes/visitantes.schema');
const { renovarSchema } = require('../../src/modules/credenciales/credenciales.schema');
const { generarCodigoQr } = require('../../src/utils/codigoQr');

// Alta válida mínima. Todos estos campos son obligatorios: lo único opcional
// al registrar un usuario es la foto.
const base = {
  nombre: 'Ana',
  apellidos: 'López',
  correo: 'ana@correo.com',
  matricula_empleado: 'UP230999',
  carrera: 'Ing. en Sistemas Computacionales',
  tipo: 'ALUMNO',
  password: 'Fuerte123',
};

describe('MEJ-03 · Fortaleza de la contraseña', () => {

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

describe('Campos obligatorios del alta de usuario', () => {
  it('acepta un alta completa', () => {
    expect(crearSchema.safeParse(base).success).toBe(true);
  });

  it.each(['nombre', 'apellidos', 'correo', 'matricula_empleado', 'carrera', 'password'])(
    'rechaza el alta si falta %s',
    (campo) => {
      expect(crearSchema.safeParse({ ...base, [campo]: '' }).success).toBe(false);
    }
  );

  it('la foto es el único campo opcional', () => {
    const { foto, ...sinFoto } = { ...base, foto: 'data:image/jpeg;base64,AAA' };
    expect(crearSchema.safeParse(sinFoto).success).toBe(true);
  });
});

describe('Formato de los datos de la persona', () => {
  it('rechaza nombres que no son nombres (números o símbolos)', () => {
    expect(crearSchema.safeParse({ ...base, nombre: '7854' }).success).toBe(false);
    expect(crearSchema.safeParse({ ...base, apellidos: '7896' }).success).toBe(false);
    expect(crearSchema.safeParse({ ...base, nombre: '@#$%' }).success).toBe(false);
  });

  it('acepta nombres reales con acentos, guiones y apóstrofos', () => {
    expect(crearSchema.safeParse({ ...base, nombre: 'José Ramón' }).success).toBe(true);
    expect(crearSchema.safeParse({ ...base, apellidos: 'de la Cruz Núñez' }).success).toBe(true);
    expect(crearSchema.safeParse({ ...base, apellidos: "O'Connor-Pérez" }).success).toBe(true);
  });

  it('rechaza matrículas con símbolos raros', () => {
    expect(crearSchema.safeParse({ ...base, matricula_empleado: '-=-=-' }).success).toBe(false);
  });

  it('normaliza el correo a minúsculas para evitar duplicados', () => {
    const r = crearSchema.safeParse({ ...base, correo: 'ANA@CORREO.COM' });
    expect(r.success).toBe(true);
    expect(r.data.correo).toBe('ana@correo.com');
  });

  it('recorta los espacios sobrantes de los nombres', () => {
    const r = crearSchema.safeParse({ ...base, nombre: '  Ana  ' });
    expect(r.data.nombre).toBe('Ana');
  });

  it('rechaza textos que exceden el tamaño de su columna', () => {
    expect(crearSchema.safeParse({ ...base, nombre: 'A'.repeat(120) }).success).toBe(false);
  });

  it('solo acepta imágenes reales en la foto', () => {
    expect(crearSchema.safeParse({ ...base, foto: 'texto cualquiera' }).success).toBe(false);
    expect(crearSchema.safeParse({ ...base, foto: 'data:image/jpeg;base64,AAA' }).success).toBe(true);
  });
});

describe('Vigencia de la credencial (máximo 2 años)', () => {
  const enMeses = (m) => {
    const d = new Date();
    d.setMonth(d.getMonth() + m);
    return d.toISOString().slice(0, 10);
  };

  it('acepta hasta 24 meses', () => {
    expect(renovarSchema.safeParse({ meses: 24 }).success).toBe(true);
  });

  it('rechaza más de 24 meses', () => {
    expect(renovarSchema.safeParse({ meses: 36 }).success).toBe(false);
  });

  it('rechaza una fecha en el pasado', () => {
    expect(renovarSchema.safeParse({ fecha_vencimiento: '2020-01-01' }).success).toBe(false);
  });

  it('rechaza una fecha a más de 2 años', () => {
    expect(renovarSchema.safeParse({ fecha_vencimiento: enMeses(30) }).success).toBe(false);
  });

  it('acepta una fecha dentro de los 2 años', () => {
    expect(renovarSchema.safeParse({ fecha_vencimiento: enMeses(12) }).success).toBe(true);
  });

  it('rechaza una fecha con formato inválido', () => {
    expect(renovarSchema.safeParse({ fecha_vencimiento: 'abc' }).success).toBe(false);
  });
});

describe('Código QR opaco (OBS-03)', () => {
  it('no contiene la matrícula ni datos de la persona', () => {
    const codigo = generarCodigoQr();
    expect(codigo).not.toContain('UP230571');
    expect(codigo).toMatch(/^SICAD-[0-9A-F]{32}$/);
  });

  it('genera códigos distintos cada vez', () => {
    const generados = new Set(Array.from({ length: 500 }, generarCodigoQr));
    expect(generados.size).toBe(500);
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
