# SICAD — Sistema de Control de Acceso Digital

Plataforma de software para el control de acceso digital de la comunidad universitaria
de la **Universidad Politécnica de Aguascalientes (UPA)**. Reemplaza las tarjetas físicas
por credenciales digitales **NFC**, revoca privilegios automáticamente al dar de baja a un
usuario y gestiona el ingreso temporal de visitantes/proveedores desde un portal de caseta.

> Proyecto Integrador · ISC08C · 8vo Cuatrimestre · Equipo SICAD

---

## 🧱 Arquitectura

Monorepo con dos aplicaciones y una base de datos relacional:

```
SICAD/
├── backend/      → API REST (Node.js + Express + Prisma + JWT)
├── frontend/     → Portal web (Next.js + React + Tailwind + Redux Toolkit)
├── docker-compose.yml
└── .github/workflows/   → CI/CD (build + release automatizados)
```

| Capa            | Tecnología                                              |
|-----------------|---------------------------------------------------------|
| Frontend        | Next.js, React, Tailwind CSS, Redux Toolkit, Axios      |
| Backend         | Node.js, Express.js, Prisma ORM, JWT                    |
| Base de datos   | PostgreSQL                                              |
| Pruebas         | Jest (unitarias + integración), Postman                 |
| DevOps          | Docker, Docker Compose, GitHub Actions (CI/CD)          |

### Módulos

1. **Autenticación (JWT)** — login, roles y permisos (RBAC).
2. **Gestión de usuarios** — alta/baja/edición con revocación automática de privilegios.
3. **Credenciales NFC** — emisión, asignación y validación.
4. **Control de acceso** — validación de credencial y registro del evento.
5. **Portal de caseta** — registro y gestión de externos.
6. **Bitácora y reportes** — historial de accesos para consulta y auditoría.

---

## 🚀 Puesta en marcha (desarrollo)

### Opción A — Todo con Docker (recomendada)

```bash
docker compose up --build
```

- Backend → http://localhost:4000
- Frontend → http://localhost:3000
- PostgreSQL → localhost:5432

### Opción B — Local (sin Docker)

Necesitas un PostgreSQL corriendo. Luego:

```bash
# 1. Levantar solo la base de datos con Docker
docker compose up -d db

# 2. Backend
cd backend
cp .env.example .env        # ajusta DATABASE_URL y JWT_SECRET
npm install
npx prisma migrate dev      # crea las tablas
npm run seed                # datos de ejemplo (roles, admin, puntos)
npm run dev

# 3. Frontend (en otra terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

### Credenciales de ejemplo (tras el seed)

| Correo                | Contraseña   | Rol           |
|-----------------------|--------------|---------------|
| admin@upa.edu.mx      | Admin123!    | Administrador |
| caseta@upa.edu.mx     | Caseta123!   | Seguridad     |

---

## 🌿 Estrategia de ramas (Git)

Trabajamos con **tres ramas** simulando un entorno laboral:

```
feature/* ──▶ dev ──▶ qa ──▶ main
```

| Rama    | Propósito                                                        |
|---------|-----------------------------------------------------------------|
| `main`  | Producción. Solo recibe cambios ya aprobados por QA.            |
| `qa`    | Pruebas. QA valida lo que viene de `dev` antes de pasar a `main`.|
| `dev`   | Integración de desarrollo. Aquí se juntan las features.         |

**Flujo:**
1. Cada integrante crea una rama `feature/mi-tarea` desde `dev`.
2. Pull Request hacia `dev`.
3. Cuando `dev` está estable → PR hacia `qa`.
4. QA prueba y aprueba → PR de `qa` hacia `main`.

> Nadie hace push directo a `qa` ni a `main`: todo pasa por Pull Request.

---

## 🧪 Pruebas

```bash
cd backend
npm test            # Jest: unitarias + integración
npm run test:watch
```

---

## ⚙️ CI/CD

- **`.github/workflows/ci.yml`** — en cada push/PR a `dev`, `qa` y `main`: instala
  dependencias, corre lint, ejecuta las pruebas de Jest y construye el frontend.
- **`.github/workflows/release.yml`** — al crear un tag `v*` (ej. `v1.0.0`): construye
  las imágenes Docker y publica un **Release** automático en GitHub.

---

## 👥 Equipo

| Integrante                   | Rol                                  |
|------------------------------|--------------------------------------|
| Ángel Issac Núñez Hernández  | Líder de proyecto / DevOps           |
| Joel Alberto Acevedo Moreno  | Front-End / UX-UI / Analista         |
| Andrei Torres Sánchez        | Back-End / Base de datos             |
| Armando Guadarrama Jiménez   | Back-End / Base de datos             |
| Ximena Guadalupe López E.    | Tester / Redacción técnica           |
