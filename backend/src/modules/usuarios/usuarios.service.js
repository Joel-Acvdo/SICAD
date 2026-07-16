// Lógica de negocio de usuarios: listar, obtener, crear (con emisión de credencial),
// actualizar y cambiar estatus (con revocación automática de la credencial).
const prisma = require('../../config/prisma');
const { hashPassword } = require('../../utils/password');
const ApiError = require('../../utils/ApiError');

// Contraseña temporal que se asigna al emitir un usuario nuevo desde el panel.
const PASSWORD_INICIAL = 'Sicad123!';

function sanitizar(u) {
  if (!u) return u;
  const { password_hash, ...resto } = u;
  return resto;
}

// Cada tipo de usuario cae en un rol del sistema (RBAC).
function rolPorTipo(tipo) {
  if (tipo === 'ADMINISTRATIVO') return 'Administrador';
  if (tipo === 'SEGURIDAD') return 'Seguridad';
  return 'Comunidad';
}

async function idRol(nombre) {
  const rol = await prisma.rol.findUnique({ where: { nombre } });
  if (!rol) throw ApiError.badRequest(`Rol no configurado: ${nombre}`);
  return rol.id_rol;
}

function codigoQR(matricula) {
  const sufijo = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `QR-${matricula || 'USER'}-${sufijo}`;
}

async function listar() {
  const usuarios = await prisma.usuario.findMany({
    include: { rol: true },
    orderBy: { id_usuario: 'asc' },
  });
  return usuarios.map(sanitizar);
}

async function obtener(id) {
  const usuario = await prisma.usuario.findUnique({ where: { id_usuario: id }, include: { rol: true } });
  if (!usuario) throw ApiError.notFound('Usuario no encontrado');
  return sanitizar(usuario);
}

async function crear(datos) {
  const existe = await prisma.usuario.findUnique({ where: { correo: datos.correo } });
  if (existe) throw ApiError.conflict('Ya existe un usuario con ese correo');

  const id_rol = await idRol(rolPorTipo(datos.tipo));
  const password_hash = await hashPassword(PASSWORD_INICIAL);
  const vence = new Date();
  vence.setFullYear(vence.getFullYear() + 1);

  // Alta del usuario + emisión de su credencial QR (vigencia +1 año) en un solo paso.
  const usuario = await prisma.usuario.create({
    data: {
      nombre: datos.nombre,
      apellidos: datos.apellidos,
      correo: datos.correo,
      matricula_empleado: datos.matricula_empleado || null,
      carrera: datos.carrera || null,
      tipo: datos.tipo,
      id_rol,
      password_hash,
      credenciales: {
        create: { codigo_qr: codigoQR(datos.matricula_empleado), estado: 'ACTIVA', fecha_vencimiento: vence },
      },
    },
    include: { rol: true },
  });
  return sanitizar(usuario);
}

async function actualizar(id, datos) {
  await obtener(id); // valida existencia (lanza 404 si no está)
  const data = {
    nombre: datos.nombre,
    apellidos: datos.apellidos,
    correo: datos.correo,
    matricula_empleado: datos.matricula_empleado ?? null,
    carrera: datos.carrera ?? null,
  };
  if (datos.tipo) {
    data.tipo = datos.tipo;
    data.id_rol = await idRol(rolPorTipo(datos.tipo));
  }
  const usuario = await prisma.usuario.update({ where: { id_usuario: id }, data, include: { rol: true } });
  return sanitizar(usuario);
}

async function cambiarEstatus(id, estatus) {
  await obtener(id);
  // Revocación automática de privilegios: al inactivar/suspender se revoca la credencial;
  // al reactivar, vuelve a ACTIVA.
  const estadoCred = estatus === 'ACTIVO' ? 'ACTIVA' : 'REVOCADA';
  const [usuario] = await prisma.$transaction([
    prisma.usuario.update({ where: { id_usuario: id }, data: { estatus }, include: { rol: true } }),
    prisma.credencial.updateMany({ where: { id_usuario: id }, data: { estado: estadoCred } }),
  ]);
  return sanitizar(usuario);
}

module.exports = { listar, obtener, crear, actualizar, cambiarEstatus };
