// Pruebas unitarias de las utilidades de seguridad (sin base de datos).
const { generarToken, verificarToken } = require('../../src/utils/jwt');
const { hashPassword, compararPassword } = require('../../src/utils/password');

describe('Utilidades JWT', () => {
  it('genera un token y lo verifica devolviendo el payload', () => {
    const payload = { id: 1, correo: 'test@upa.edu.mx', rol: 'Administrador' };
    const token = generarToken(payload);

    expect(typeof token).toBe('string');

    const decodificado = verificarToken(token);
    expect(decodificado.id).toBe(payload.id);
    expect(decodificado.correo).toBe(payload.correo);
    expect(decodificado.rol).toBe(payload.rol);
  });

  it('lanza error con un token inválido', () => {
    expect(() => verificarToken('token.falso.invalido')).toThrow();
  });
});

describe('Utilidades de contraseña', () => {
  it('hashea una contraseña y la compara correctamente', async () => {
    const plano = 'Admin123!';
    const hash = await hashPassword(plano);

    expect(hash).not.toBe(plano);
    await expect(compararPassword(plano, hash)).resolves.toBe(true);
    await expect(compararPassword('incorrecta', hash)).resolves.toBe(false);
  });
});
