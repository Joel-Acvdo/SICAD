# Arquitectura · SICAD

Documento técnico de la arquitectura del Sistema de Control de Acceso Digital.

## 1. Visión general

SICAD es una aplicación web tipo **monorepo** con tres piezas: un frontend, un backend
(API REST) y una base de datos relacional. Todo se orquesta con Docker.

```
┌─────────────┐     HTTP/JSON      ┌─────────────┐     SQL      ┌──────────────┐
│  Frontend   │  ───────────────▶  │   Backend   │  ─────────▶  │  PostgreSQL  │
│  Next.js    │  ◀───────────────  │  Express    │  ◀─────────  │              │
└─────────────┘                    └─────────────┘   (Prisma)   └──────────────┘
```

## 2. Stack tecnológico

| Capa | Tecnología | Por qué |
|------|------------|---------|
| Frontend | Next.js, React, Tailwind CSS, Redux Toolkit, Axios | Framework moderno, SSR, estado global y consumo de API |
| Backend | Node.js, Express.js, Prisma ORM, JWT | API REST sencilla, ORM tipado, autenticación con tokens |
| Base de datos | PostgreSQL | Motor relacional robusto |
| Pruebas | Jest, Supertest | Unitarias e integración |
| DevOps | Docker, Docker Compose, GitHub Actions | Contenedores y CI/CD |

## 3. Estructura del repositorio

```
SICAD/
├── backend/                 API REST
│   ├── prisma/
│   │   ├── schema.prisma     Modelo de datos (entidades del ER)
│   │   └── seed.js           Datos iniciales (roles, usuarios, puntos)
│   ├── src/
│   │   ├── config/           Configuración (env, cliente Prisma)
│   │   ├── middlewares/       Autenticación, autorización, errores, validación
│   │   ├── modules/          Módulos por dominio (auth, usuarios, ...)
│   │   ├── routes/           Enrutador principal
│   │   ├── utils/            JWT, contraseñas, errores
│   │   ├── app.js            App Express (sin arrancar servidor)
│   │   └── server.js         Punto de entrada
│   └── tests/                Pruebas con Jest
├── frontend/                Portal web (Next.js App Router)
│   └── src/
│       ├── app/             Páginas/rutas
│       ├── components/      Componentes reutilizables (Logo, Campo, ...)
│       ├── lib/             Cliente Axios
│       └── store/           Redux Toolkit
├── documentacion/          Este apartado
└── docker-compose.yml      Orquestación (db + backend + frontend)
```

## 4. Modelo de datos (Entidad–Relación)

Definido en `backend/prisma/schema.prisma`. Entidades principales:

| Entidad | Descripción | Relaciones |
|---------|-------------|------------|
| **Rol** | Roles del sistema (Administrador, Seguridad, Comunidad) | 1—N con Usuario |
| **Usuario** | Comunidad interna (alumnos y trabajadores) | N—1 con Rol; 1—N con Credencial y Visitante |
| **Credencial** | Credencial digital NFC asociada a un usuario | N—1 con Usuario; 1—N con Acceso |
| **Visitante** | Externos registrados temporalmente | N—1 con Usuario (quien registra); 1—N con Acceso |
| **PuntoAcceso** | Puntos físicos de acceso del campus | 1—N con Acceso |
| **Acceso** | Bitácora de eventos de entrada/salida | N—1 con Credencial, Visitante y PuntoAcceso |

Un evento de **Acceso** lo genera **una credencial** (comunidad) **o un visitante** (externo).

## 5. Módulos del backend

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Autenticación (auth)** | Implementado | Login con JWT, registro y perfil. RBAC por roles. |
| Gestión de usuarios | Pendiente | CRUD + revocación automática de privilegios |
| Credenciales NFC | Pendiente | Emisión, asignación y validación |
| Control de acceso | Pendiente | Validación de credencial y registro de evento |
| Visitantes / caseta | Pendiente | Registro temporal de externos |
| Bitácora y reportes | Pendiente | Consulta e historial de accesos |

## 6. Seguridad

- **Contraseñas:** hasheadas con bcrypt (nunca se guardan en texto plano).
- **Sesiones:** JWT firmado con `JWT_SECRET`, expira según `JWT_EXPIRES_IN`.
- **Autorización:** middleware `autorizar(...roles)` restringe rutas por rol (RBAC).
- **Revocación de privilegios:** un usuario con estatus distinto de `ACTIVO` no puede
  iniciar sesión ni validar acceso.

## 7. Endpoints implementados (Auth)

| Método | Ruta | Descripción | Protección |
|--------|------|-------------|------------|
| `GET`  | `/api/health` | Estado del servicio | Pública |
| `POST` | `/api/auth/login` | Inicia sesión, devuelve token JWT | Pública |
| `POST` | `/api/auth/registro` | Alta de usuario | Solo Administrador |
| `GET`  | `/api/auth/perfil` | Datos del usuario autenticado | Autenticado |

## 8. Cómo ejecutar

Ver la guía completa en el [`README.md`](../../README.md) raíz. Resumen:

```bash
docker compose up --build      # todo con Docker
# o, en local:
cd backend && npm install && npx prisma migrate dev && npm run seed && npm run dev
cd frontend && npm install && npm run dev
```
