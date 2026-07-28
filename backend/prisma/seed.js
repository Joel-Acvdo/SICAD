// Datos iniciales para arrancar el sistema:
// roles, usuarios (admin, caseta y comunidad), credenciales, puntos y accesos de ejemplo.

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos iniciales...');

  // --- Roles ---
  const rolAdmin = await prisma.rol.upsert({
    where: { nombre: 'Administrador' },
    update: {},
    create: { nombre: 'Administrador', descripcion: 'Acceso total al sistema' },
  });
  const rolSeguridad = await prisma.rol.upsert({
    where: { nombre: 'Seguridad' },
    update: {},
    create: { nombre: 'Seguridad', descripcion: 'Personal de caseta: gestiona externos y bitácora' },
  });
  const rolComunidad = await prisma.rol.upsert({
    where: { nombre: 'Comunidad' },
    update: {},
    create: { nombre: 'Comunidad', descripcion: 'Alumnos y trabajadores activos' },
  });

  // --- Contraseñas demo (hasheadas con bcrypt) ---
  const passAdmin = await bcrypt.hash('Admin123!', 10);
  const passCaseta = await bcrypt.hash('Caseta123!', 10);
  const passComunidad = await bcrypt.hash('Alumno123!', 10);

  // --- Usuarios (upsert por correo, idempotente) ---
  const usuarios = [
    { nombre: 'Administrador', apellidos: 'SICAD', correo: 'admin@upa.edu.mx', matricula_empleado: 'EMP0001', carrera: 'Servicios Escolares', tipo: 'ADMINISTRATIVO', estatus: 'ACTIVO', id_rol: rolAdmin.id_rol, password_hash: passAdmin },
    { nombre: 'Personal', apellidos: 'Caseta', correo: 'caseta@upa.edu.mx', matricula_empleado: 'EMP0002', carrera: 'Vigilancia', tipo: 'SEGURIDAD', estatus: 'ACTIVO', id_rol: rolSeguridad.id_rol, password_hash: passCaseta },
    { nombre: 'Joel Alberto', apellidos: 'Acevedo Moreno', correo: 'joel.acevedo@upa.edu.mx', matricula_empleado: 'UP230571', carrera: 'Ing. en Sistemas Computacionales', tipo: 'ALUMNO', estatus: 'ACTIVO', id_rol: rolComunidad.id_rol, password_hash: passComunidad },
    { nombre: 'Andrei', apellidos: 'Torres Sánchez', correo: 'andrei.torres@upa.edu.mx', matricula_empleado: 'UP230164', carrera: 'Ing. en Sistemas Computacionales', tipo: 'ALUMNO', estatus: 'ACTIVO', id_rol: rolComunidad.id_rol, password_hash: passComunidad },
    { nombre: 'María Fernanda', apellidos: 'Pérez', correo: 'maria.perez@upa.edu.mx', matricula_empleado: 'EMP0123', carrera: 'Departamento de Docencia', tipo: 'DOCENTE', estatus: 'ACTIVO', id_rol: rolComunidad.id_rol, password_hash: passComunidad },
    { nombre: 'Luis', apellidos: 'Ramírez Gómez', correo: 'luis.ramirez@upa.edu.mx', matricula_empleado: 'UP229988', carrera: 'Ing. Industrial', tipo: 'ALUMNO', estatus: 'INACTIVO', id_rol: rolComunidad.id_rol, password_hash: passComunidad },
  ];

  const porMatricula = {};
  for (const u of usuarios) {
    const { password_hash, ...sinPass } = u;
    const usuario = await prisma.usuario.upsert({
      where: { correo: u.correo },
      update: sinPass, // no reescribe la contraseña en re-siembras
      create: u,
    });
    porMatricula[u.matricula_empleado] = usuario;
  }

  // --- Credenciales de la comunidad (una por usuario) ---
  // OBS-03: los códigos son OPACOS (no llevan la matrícula dentro). Aquí son
  // fijos para que el seed sea reproducible; los que emite la app en caliente
  // se generan al azar (ver src/utils/codigoQr.js).
  const QR_JOEL = 'SICAD-4F9A2C7E1B6D80A3C5E7F9B1D3A5C7E9';
  const QR_ANDREI = 'SICAD-B2D4F6A8C0E2A4C6E8B0D2F4A6C8E0B2';
  const QR_DOCENTE = 'SICAD-1A3C5E7B9D1F3A5C7E9B1D3F5A7C9E1B';
  const QR_REVOCADA = 'SICAD-9E7C5A3F1D9B7E5C3A1F9D7B5E3C1A9F';
  const credenciales = [
    { codigo_qr: QR_JOEL, estado: 'ACTIVA', matricula: 'UP230571', vence: new Date('2026-12-31T23:59:59.000Z') },
    { codigo_qr: QR_ANDREI, estado: 'ACTIVA', matricula: 'UP230164', vence: new Date('2026-12-31T23:59:59.000Z') },
    { codigo_qr: QR_DOCENTE, estado: 'ACTIVA', matricula: 'EMP0123', vence: new Date('2027-08-31T23:59:59.000Z') },
    { codigo_qr: QR_REVOCADA, estado: 'REVOCADA', matricula: 'UP229988', vence: new Date('2025-12-31T23:59:59.000Z') },
  ];
  // Se identifica por USUARIO, no por código: cada persona tiene una sola
  // credencial. (Antes el upsert iba por codigo_qr y, al cambiar los códigos,
  // el seed creaba una credencial nueva en vez de actualizar la existente.)
  for (const c of credenciales) {
    const usuario = porMatricula[c.matricula];
    const existente = await prisma.credencial.findFirst({ where: { id_usuario: usuario.id_usuario } });
    if (existente) {
      await prisma.credencial.update({
        where: { id_credencial: existente.id_credencial },
        data: { codigo_qr: c.codigo_qr, estado: c.estado, fecha_vencimiento: c.vence },
      });
    } else {
      await prisma.credencial.create({
        data: { codigo_qr: c.codigo_qr, estado: c.estado, fecha_vencimiento: c.vence, id_usuario: usuario.id_usuario },
      });
    }
  }

  // --- Puntos de acceso ---
  const puntos = [
    { nombre: 'Entrada Principal', ubicacion: 'Acceso peatonal norte' },
    { nombre: 'Estacionamiento', ubicacion: 'Acceso vehicular sur' },
    { nombre: 'Edificio A', ubicacion: 'Aulas y laboratorios' },
  ];
  for (const p of puntos) {
    const existe = await prisma.puntoAcceso.findFirst({ where: { nombre: p.nombre } });
    if (!existe) await prisma.puntoAcceso.create({ data: p });
  }

  // --- Accesos de ejemplo (solo si la bitácora está vacía) ---
  if ((await prisma.acceso.count()) === 0) {
    const cred = (qr) => prisma.credencial.findUnique({ where: { codigo_qr: qr } });
    const punto = (nombre) => prisma.puntoAcceso.findFirst({ where: { nombre } });
    const [joel, andrei, luis, entrada, edificio] = await Promise.all([
      cred(QR_JOEL), cred(QR_ANDREI), cred(QR_REVOCADA),
      punto('Entrada Principal'), punto('Edificio A'),
    ]);
    await prisma.acceso.createMany({
      data: [
        { tipo_evento: 'ENTRADA', resultado: 'PERMITIDO', id_credencial: joel.id_credencial, id_punto: entrada.id_punto },
        { tipo_evento: 'ENTRADA', resultado: 'PERMITIDO', id_credencial: andrei.id_credencial, id_punto: edificio.id_punto },
        { tipo_evento: 'ENTRADA', resultado: 'DENEGADO', id_credencial: luis.id_credencial, id_punto: entrada.id_punto },
      ],
    });
  }

  console.log('✅ Datos iniciales sembrados.');
  console.log('   Admin:     admin@upa.edu.mx / Admin123!');
  console.log('   Caseta:    caseta@upa.edu.mx / Caseta123!');
  console.log('   Comunidad: matrícula o correo / Alumno123!  (ej. UP230571)');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
