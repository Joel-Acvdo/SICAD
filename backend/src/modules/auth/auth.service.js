// Lógica de negocio de autenticación: registro, login y consulta del perfil.
const prisma = require('../../config/prisma');
const { hashPassword, compararPassword } = require('../../utils/password');
const { generarToken } = require('../../utils/jwt');
const ApiError = require('../../utils/ApiError');

// Quita el hash de contraseña antes de devolver el usuario.
function sanitizar(usuario) {
  if (!usuario) return usuario;
  const { password_hash, ...resto } = usuario;
  return resto;
}

async function registrar(datos) {
  const existe = await prisma.usuario.findUnique({ where: { correo: datos.correo } });
  if (existe) throw ApiError.conflict('Ya existe un usuario con ese correo');

  const password_hash = await hashPassword(datos.password);

  const usuario = await prisma.usuario.create({
    data: {
      nombre: datos.nombre,
      apellidos: datos.apellidos,
      correo: datos.correo,
      matricula_empleado: datos.matricula_empleado || null,
      password_hash,
      tipo: datos.tipo,
      id_rol: datos.id_rol,
    },
    include: { rol: true },
  });

  return sanitizar(usuario);
}

async function login(correo, password) {
  const usuario = await prisma.usuario.findUnique({
    where: { correo },
    include: { rol: true },
  });

  // Mensaje genérico para no revelar si el correo existe.
  if (!usuario) throw ApiError.unauthorized('Credenciales incorrectas');

  // Revocación automática de privilegios: un usuario inactivo no puede entrar.
  if (usuario.estatus !== 'ACTIVO') {
    throw ApiError.forbidden('La cuenta está inactiva o suspendida');
  }

  const coincide = await compararPassword(password, usuario.password_hash);
  if (!coincide) throw ApiError.unauthorized('Credenciales incorrectas');

  const token = generarToken({
    id: usuario.id_usuario,
    correo: usuario.correo,
    rol: usuario.rol.nombre,
  });

  return { token, usuario: sanitizar(usuario) };
}

async function obtenerPerfil(idUsuario) {
  const usuario = await prisma.usuario.findUnique({
    where: { id_usuario: idUsuario },
    include: { rol: true },
  });
  if (!usuario) throw ApiError.notFound('Usuario no encontrado');
  return sanitizar(usuario);
}

module.exports = { registrar, login, obtenerPerfil };
