# Contexto.md — Contexto del proyecto SICAD

Guía de contexto para trabajar en este repositorio. Léela antes de hacer cambios.

## Qué es SICAD

**Sistema de Control de Acceso Digital** para la **Universidad Politécnica de Aguascalientes (UPA)**.
Reemplaza las tarjetas físicas por **credenciales digitales con código QR**, valida el acceso en
tiempo real, revoca privilegios al dar de baja a un usuario y gestiona el ingreso de visitantes
desde un portal de caseta. Todo queda en una bitácora auditable. Es un **proyecto integrador
escolar** (ISC08C, 8vo cuatrimestre); se evalúa con **3 rúbricas**: Diseño de Interfaces,
Virtualización, y Tecnologías y Aplicaciones en Internet.

## Stack y estructura

Monorepo con dos apps + base de datos:

```
SICAD/
├── backend/     API REST — Node.js + Express + Prisma (ORM) + JWT.  Módulos en src/modules/<dominio>/
│                (controller/service/routes/schema). PostgreSQL.
├── frontend/    Portal web — Next.js 14 (App Router) + React + Tailwind + Redux Toolkit + Axios.
│                Páginas en src/app/, estado en src/store/ (slices con thunks), cliente en src/lib/api.js.
├── documentacion/  Docs técnicas (arquitectura, base-de-datos, frontend), mockups y PDFs.
├── docker-compose.yml   Orquesta db + backend + frontend.
└── .github/workflows/   CI/CD (ver "Pipelines").
```

- **Base de datos:** PostgreSQL. Modelo en `backend/prisma/schema.prisma` (6 entidades: Rol, Usuario,
  Credencial, Visitante, PuntoAcceso, Acceso). Migraciones + `seed.js`.
- **Auth:** JWT (login por correo O matrícula) + RBAC (`middlewares/auth.middleware.js`).
- **Frontend↔Backend:** conectado vía Axios (`src/lib/api.js` adjunta el token). Los slices Redux
  usan `createAsyncThunk`. **Ya NO es localStorage.**

## Cómo correr

**Requisito:** Docker Desktop encendido.

Forma fácil (todo con Docker):
```bash
docker compose up --build          # db + backend + frontend → http://localhost:3000
```

Forma de desarrollo (recarga en caliente, 3 terminales):
```bash
docker compose up -d db            # 1) BD (Postgres :5432)
cd backend && node src/server.js   # 2) backend (:4000)  (.env apunta a localhost:5432)
cd frontend && npm run dev         # 3) frontend (:3000)
```
⚠️ NO corras `npm run build` mientras `npm run dev` está activo (comparten `.next` y se pisan → CSS roto).

**Usuarios demo** (BD sembrada por `backend/prisma/seed.js`):
- `admin@upa.edu.mx` / `Admin123!` (Servicios Escolares → gestión + dashboard)
- `caseta@upa.edu.mx` / `Caseta123!` (Seguridad → validar, externos, bitácora)
- Comunidad: matrícula o correo / `Alumno123!` (ej. `UP230571` → su credencial QR)

## Flujo de ramas y autoría de commits

```
feature/* → dev → qa → main → Azure
```
- **qa** dispara `qa.yml` en un **runner self-hosted (la laptop)**: valida + `docker compose up` (host de
  QA) + abre un **PR qa→main**.
- **main** dispara `deploy.yml`: build+push a ghcr.io + deploy a **Azure Container Apps** (pendiente de montar).

**Autoría de commits** (repartir por rol con `git -c user.name=... -c user.email=...`; datos en `autor.ps1`):
- **Joel Acevedo** (Front-End/UX): frontend, mockups, logo.
- **Andrei Torres** / **Armando Guadarrama** (Back-End/BD): backend, API, prisma.
- **Ángel Núñez "Issac"** (Líder/DevOps, cuenta GitHub `AINH-Zero`): pipelines/infra; **aprueba/mergea
  los PR qa→main** desde su cuenta.
- **Ximena López** (Tester/QA): valida dev→qa.
- **NO** poner `Co-Authored-By: Claude` en los commits (decisión del equipo).
- En runner Windows NO usar `shell: bash` (agarra el bash de WSL) — usar **PowerShell**.

## Estado (a 2026-07)

Hecho: NFC→QR, Docker funcional, backend completo (auth + usuarios/credenciales/accesos/visitantes/
puntos/stats), **frontend conectado a la API**, dashboard con Recharts + reporte PDF, lector QR con
cámara (solo entradas) + confirmación en vivo en el celular, **Azure Container Apps desplegado**,
página de Ajustes (cambio de contraseña propio + reportar pérdida). Pendiente: presentación en inglés.

## Convenciones

- Comentarios en español, claros pero sin ruido. Componentes reutilizables (`Campo`, `Modal`, `Badge`,
  `TopBar`, `QrCode`, `FotoPersona`, `DemoAcceso`). Nombres de credencial: campo `codigo_qr` (ya NO `codigo_nfc`).
- Al conectar pantallas: thunks en el slice + manejo de `cargando`/`error`.
- **Hooks personalizados** en `frontend/src/hooks/`. El principal es `useAccesosEnVivo`
  (`hooks/useAccesosEnVivo.js`): sondea GET /accesos cada N segundos y expone
  `{ accesos, cargando, ultimaActualizacion, hayNuevo }`; da el "tiempo real" de la bitácora
  de Caseta (la de Admin se queda estática a propósito, por sus filtros). Documentación completa
  en el encabezado del archivo.
- Zona horaria: el backend corre con `TZ=America/Mexico_City` (docker-compose) para que los
  filtros "Hoy" y la agrupación por día de las gráficas cuadren con la hora local.
