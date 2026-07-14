# Documentación técnica · SICAD

> [Documentación](../README.md) › **Técnica** · [README del proyecto](../../README.md) · [Cómo contribuir](../../CONTRIBUTING.md)

Documentación del **código y la arquitectura** del sistema. Se actualiza conforme avanza el desarrollo.

## Por capa

| Capa | Dónde | Documento |
|------|-------|-----------|
| **Frontend** (Next.js + Redux) | [`frontend/`](../../frontend) | [frontend.md](./frontend.md) — flujo de pantallas |
| **Backend** (Express + Prisma + JWT) | [`backend/`](../../backend) | [arquitectura.md → Backend](./arquitectura.md#backend) |
| **Base de datos** (PostgreSQL) | [`backend/prisma/`](../../backend/prisma) | [base-de-datos.md](./base-de-datos.md) |

## Índice

| Documento | Contenido | Estado |
|-----------|-----------|--------|
| [`arquitectura.md`](./arquitectura.md) | Stack, estructura del monorepo, modelo de datos (ER) y módulos | Disponible |
| [`frontend.md`](./frontend.md) | Flujo de pantallas (mockups) y estado global (Redux) | Disponible |
| `api.md` | Referencia de endpoints de la API REST | Pendiente |
| [`base-de-datos.md`](./base-de-datos.md) | Diagrama ER, relaciones, enums y diccionario de datos | Disponible |
| `instalacion.md` | Guía de instalación y despliegue (local + Docker) | Pendiente |
| `manual-usuario.md` | Manual de usuario del sistema | Pendiente |

La documentación de cada módulo se incorporará a este apartado conforme avance el desarrollo del sistema.
