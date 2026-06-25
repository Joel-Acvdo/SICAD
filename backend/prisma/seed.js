// Datos iniciales para arrancar el sistema:
// roles base, usuarios administrativos y puntos de acceso de ejemplo.

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

  // --- Usuarios ---
  const adminHash = await bcrypt.hash('Admin123!', 10);
  await prisma.usuario.upsert({
    where: { correo: 'admin@upa.edu.mx' },
    update: {},
    create: {
      nombre: 'Administrador',
      apellidos: 'SICAD',
      correo: 'admin@upa.edu.mx',
      matricula_empleado: 'EMP0001',
      password_hash: adminHash,
      tipo: 'ADMINISTRATIVO',
      estatus: 'ACTIVO',
      id_rol: rolAdmin.id_rol,
    },
  });

  const casetaHash = await bcrypt.hash('Caseta123!', 10);
  await prisma.usuario.upsert({
    where: { correo: 'caseta@upa.edu.mx' },
    update: {},
    create: {
      nombre: 'Personal',
      apellidos: 'Caseta',
      correo: 'caseta@upa.edu.mx',
      matricula_empleado: 'EMP0002',
      password_hash: casetaHash,
      tipo: 'SEGURIDAD',
      estatus: 'ACTIVO',
      id_rol: rolSeguridad.id_rol,
    },
  });

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

  console.log('✅ Datos iniciales sembrados.');
  console.log('   admin@upa.edu.mx / Admin123!');
  console.log('   caseta@upa.edu.mx / Caseta123!');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
