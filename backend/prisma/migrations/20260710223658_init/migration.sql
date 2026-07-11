-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('ALUMNO', 'TRABAJADOR', 'ADMINISTRATIVO', 'DOCENTE', 'SEGURIDAD');

-- CreateEnum
CREATE TYPE "EstatusUsuario" AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "EstadoCredencial" AS ENUM ('ACTIVA', 'INACTIVA', 'VENCIDA', 'REVOCADA');

-- CreateEnum
CREATE TYPE "EstatusVisitante" AS ENUM ('VIGENTE', 'EXPIRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateEnum
CREATE TYPE "ResultadoAcceso" AS ENUM ('PERMITIDO', 'DENEGADO');

-- CreateTable
CREATE TABLE "rol" (
    "id_rol" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255),

    CONSTRAINT "rol_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100) NOT NULL,
    "correo" VARCHAR(150) NOT NULL,
    "matricula_empleado" VARCHAR(50),
    "password_hash" VARCHAR(255) NOT NULL,
    "tipo" "TipoUsuario" NOT NULL,
    "estatus" "EstatusUsuario" NOT NULL DEFAULT 'ACTIVO',
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_rol" INTEGER NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "credencial" (
    "id_credencial" SERIAL NOT NULL,
    "codigo_nfc" VARCHAR(255) NOT NULL,
    "estado" "EstadoCredencial" NOT NULL DEFAULT 'ACTIVA',
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "credencial_pkey" PRIMARY KEY ("id_credencial")
);

-- CreateTable
CREATE TABLE "visitante" (
    "id_visitante" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "identificacion" VARCHAR(50) NOT NULL,
    "empresa" VARCHAR(150),
    "motivo" VARCHAR(255),
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "estatus" "EstatusVisitante" NOT NULL DEFAULT 'VIGENTE',
    "id_usuario_registro" INTEGER NOT NULL,

    CONSTRAINT "visitante_pkey" PRIMARY KEY ("id_visitante")
);

-- CreateTable
CREATE TABLE "punto_acceso" (
    "id_punto" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "ubicacion" VARCHAR(150),

    CONSTRAINT "punto_acceso_pkey" PRIMARY KEY ("id_punto")
);

-- CreateTable
CREATE TABLE "acceso" (
    "id_acceso" SERIAL NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_evento" "TipoEvento" NOT NULL,
    "resultado" "ResultadoAcceso" NOT NULL,
    "id_credencial" INTEGER,
    "id_visitante" INTEGER,
    "id_punto" INTEGER NOT NULL,

    CONSTRAINT "acceso_pkey" PRIMARY KEY ("id_acceso")
);

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_key" ON "rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_matricula_empleado_key" ON "usuario"("matricula_empleado");

-- CreateIndex
CREATE UNIQUE INDEX "credencial_codigo_nfc_key" ON "credencial"("codigo_nfc");

-- CreateIndex
CREATE INDEX "acceso_fecha_hora_idx" ON "acceso"("fecha_hora");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "rol"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credencial" ADD CONSTRAINT "credencial_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitante" ADD CONSTRAINT "visitante_id_usuario_registro_fkey" FOREIGN KEY ("id_usuario_registro") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acceso" ADD CONSTRAINT "acceso_id_credencial_fkey" FOREIGN KEY ("id_credencial") REFERENCES "credencial"("id_credencial") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acceso" ADD CONSTRAINT "acceso_id_visitante_fkey" FOREIGN KEY ("id_visitante") REFERENCES "visitante"("id_visitante") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acceso" ADD CONSTRAINT "acceso_id_punto_fkey" FOREIGN KEY ("id_punto") REFERENCES "punto_acceso"("id_punto") ON DELETE RESTRICT ON UPDATE CASCADE;
