# SICAD — Sistema de Control de Acceso Digital

Plataforma web y móvil para el control de acceso digital de la comunidad universitaria
de la **Universidad Politécnica de Aguascalientes (UPA)**. Reemplaza las tarjetas físicas
por credenciales digitales con **código QR**, valida el acceso en tiempo real, revoca privilegios
automáticamente al dar de baja a un usuario y gestiona el ingreso temporal de
visitantes/proveedores desde un portal de caseta. Todo queda en una bitácora auditable.

> Proyecto Integrador · ISC08C · 8vo Cuatrimestre · Equipo SICAD

🔗 Repositorio: https://github.com/Joel-Acvdo/SICAD

---

## Estado del proyecto

| Parte | Estado |
|-------|--------|
| **Frontend** (Next.js + Redux) | ✅ Funcional — todas las pantallas conectadas al estado global |
| **Backend** (Express + Prisma) | 🟡 Módulo de Auth (JWT) listo; faltan los demás módulos |
| **Base de datos** (PostgreSQL) | 🟡 Esquema Prisma completo (6 entidades) + migración inicial |
| **CI/CD** (GitHub Actions) | ✅ 3 pipelines: build/test, release y deploy a Azure |
| **Mockups + guía de estilo** | ✅ 14 pantallas (escritorio y móvil) + guía de estilo |
| **Despliegue en Azure** | ⏳ Pipeline listo; falta crear recursos y secretos |

> **Nota:** hoy el frontend corre en **modo demo** con estado local (Redux + localStorage),
> por lo que se puede probar completo sin levantar el backend. La conexión front↔backend
> con Axios es el siguiente paso.

---

## Arquitectura

Monorepo con dos aplicaciones y una base de datos relacional:

```
SICAD/
├── backend/            → API REST (Node.js + Express + Prisma + JWT)
├── frontend/           → Portal web (Next.js + React + Tailwind + Redux Toolkit)
├── documentacion/      → Documentación técnica y de planeación
├── docker-compose.yml
└── .github/workflows/  → CI/CD (build+test, release y deploy a Azure)
```

| Capa            | Tecnología                                              |
|-----------------|---------------------------------------------------------|
| Frontend        | Next.js 14, React, Tailwind CSS, Redux Toolkit, Axios   |
| Backend         | Node.js, Express.js, Prisma ORM, JWT                    |
| Base de datos   | PostgreSQL (en la nube: Azure Database for PostgreSQL)  |
| Pruebas         | Jest (unitarias + integración)                          |
| DevOps          | Docker, GitHub Actions (CI/CD), Azure App Service       |

> Diagrama y detalle del monorepo (frontend ↔ backend ↔ base de datos): [`documentacion/tecnica/arquitectura.md`](documentacion/tecnica/arquitectura.md).

### Estado global (Redux)

Tres slices en `frontend/src/store/`:
- `authSlice` — sesión y usuario autenticado.
- `userSlice` — usuarios de la comunidad (alta, edición, revocación).
- `accessSlice` — credenciales, accesos (bitácora) y visitantes externos.

### Pantallas

Login (alumnos y administrativos), credencial digital, terminal de validación por QR
(permitido/denegado), gestión de usuarios (buscar/editar/renovar/revocar), registrar y
editar usuario, bitácora de servicios escolares, y el portal de caseta (validar alumno por
nombre, registrar externo, bitácora en vivo). Todo responsivo (escritorio y móvil).

---

## Puesta en marcha

### Frontend (modo demo — no requiere backend)

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

**Credenciales demo** (cualquier contraseña):

| Usuario | Rol | Va a… |
|---------|-----|-------|
| `UP230571` | Alumno | su credencial digital |
| `admin@upa.edu.mx` | Servicios Escolares | gestión de usuarios |
| `caseta@upa.edu.mx` | Caseta / Seguridad | portal de caseta |

### Backend + base de datos

```bash
docker compose up -d db      # PostgreSQL en Docker
cd backend
cp .env.example .env         # ajusta DATABASE_URL y JWT_SECRET
npm install
npx prisma migrate dev       # crea las tablas
npm run seed                 # datos de ejemplo
npm run dev                  # http://localhost:4000
```

### Todo con Docker

```bash
docker compose up --build
```

---

## Estrategia de ramas (Git)

Trabajamos con **tres ramas** simulando un entorno laboral:

```
feature/* ──▶ dev ──▶ qa ──▶ main
```

| Rama    | Propósito                                                        |
|---------|-----------------------------------------------------------------|
| `main`  | Producción. Solo recibe cambios ya aprobados por QA.            |
| `qa`    | Pruebas. QA valida lo que viene de `dev` antes de pasar a `main`.|
| `dev`   | Integración de desarrollo. Aquí se juntan las features.         |

QA (Ximena) valida e integra de `dev` a `qa` y aprueba el paso a `main`. Cada commit se
atribuye al integrante que hizo esa parte según su rol.

---

## Pruebas

```bash
cd backend
npm test            # Jest: unitarias + integración
```

---

## CI/CD (`.github/workflows/`)

| Pipeline | Archivo | Cuándo | Qué hace |
|----------|---------|--------|----------|
| **CI — Build & Test** | `ci.yml` | push/PR a dev, qa, main | instala, corre Jest y compila el frontend |
| **Release** | `release.yml` | al crear un tag `v*` | construye imágenes Docker + publica un Release |
| **CD — Deploy a Azure** | `deploy.yml` | push a `main` | build+push de imágenes a ghcr.io y despliegue a Azure App Service |

Los tres están comentados. El despliegue a Azure usa **Azure Database for PostgreSQL** +
**App Service (contenedores)** y requiere el secreto `AZURE_CREDENTIALS` en GitHub.

---

## Documentación

Toda la documentación vive en [`documentacion/`](documentacion/README.md):

- **Técnica** ([índice](documentacion/tecnica/README.md)) — [arquitectura](documentacion/tecnica/arquitectura.md) del monorepo (frontend ↔ backend ↔ base de datos) y [modelo de base de datos](documentacion/tecnica/base-de-datos.md) (diagrama ER en Mermaid).
- **Planeación** ([índice](documentacion/planeacion/README.md)) — Project Charter, propuesta, planeación inicial y estrategia de pruebas.
- **Cómo colaborar** — [CONTRIBUTING.md](CONTRIBUTING.md): flujo de ramas (`feature → dev → qa → main`) y convención de commits.
- Mockups y guía de estilo (Pencil / PNG).

---

## Equipo

| Integrante                   | Rol                                  |
|------------------------------|--------------------------------------|
| Ángel Issac Núñez Hernández  | Líder de proyecto / DevOps           |
| Joel Alberto Acevedo Moreno  | Front-End / UX-UI / Analista         |
| Andrei Torres Sánchez        | Back-End / Base de datos             |
| Armando Guadarrama Jiménez   | Back-End / Base de datos             |
| Ximena Guadalupe López E.    | Tester / Redacción técnica           |
