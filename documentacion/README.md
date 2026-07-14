# Documentación · SICAD

> [README del proyecto](../README.md) · [Guía de contribución](../CONTRIBUTING.md)

Centro de documentación del proyecto **Sistema de Control de Acceso Digital (SICAD)**.

## Estructura

| Carpeta | Qué contiene |
|---------|--------------|
| [`planeacion/`](./planeacion/README.md) | Documentos de planeación del proyecto (Project Charter, propuesta, planeación inicial, estrategia de pruebas). Son los entregables de las materias integradoras. |
| [`tecnica/`](./tecnica/README.md) | Documentación de **nuestro código**: arquitectura, modelo de datos, API, guía de instalación. Se mantiene al día conforme avanza el desarrollo. |

## Contexto rápido por capa

- **Frontend** (Next.js + Redux) → cómo está armado el portal web y el **flujo de pantallas** (mockups): [`tecnica/frontend.md`](./tecnica/frontend.md). Código en [`frontend/`](../frontend).
- **Backend** (Express + Prisma + JWT) → API REST y módulos: sección Backend en [`tecnica/arquitectura.md`](./tecnica/arquitectura.md). Código en [`backend/`](../backend).
- **Base de datos** (PostgreSQL) → entidades, relaciones y diccionario de datos: [`tecnica/base-de-datos.md`](./tecnica/base-de-datos.md).

## Otros recursos

- **Documento maestro del proyecto**: [`SICAD-Documentacion-Proyecto-Integrador.pdf`](./SICAD-Documentacion-Proyecto-Integrador.pdf).
- **Mockups** (escritorio y móvil de cada pantalla): carpeta [`mockups/`](./mockups) — ver el flujo en [`tecnica/frontend.md`](./tecnica/frontend.md).
- **Diagrama ER** (imagen): [`tecnica/diagrama-er-sicad.png`](./tecnica/diagrama-er-sicad.png).

Responsable de la documentación: Ximena López (redacción técnica).
