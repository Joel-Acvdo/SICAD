# Frontend · SICAD

> [Documentación](../README.md) › Técnica ([índice](./README.md)) › **Frontend** · Relacionado: [Arquitectura](./arquitectura.md) · [Base de datos](./base-de-datos.md)

Portal web construido con **Next.js (App Router)**, **React**, **Tailwind CSS** y **Redux Toolkit**.
El código está en [`frontend/`](../../frontend). Este documento muestra el **flujo de pantallas**
con los mockups de diseño y su ruta correspondiente en el código.

> ⚠️ **Nota:** los mockups todavía muestran la validación por **NFC**. El sistema migró a **QR**
> (el código ya usa QR); los mockups se están actualizando en Pencil. El flujo y las pantallas
> son los mismos.

## Guía de estilo

Paleta, tipografía (Inter) y componentes base. Coincide con los tokens usados en Tailwind.

![Guía de estilo SICAD](../mockups/guia-de-estilo-sicad.png)

## Flujo de pantallas

### 1. Acceso (login)

Dos entradas según el tipo de usuario. Redirige por rol tras iniciar sesión.

| Pantalla | Ruta en el código |
|----------|-------------------|
| Login de comunidad (alumnos y personal) | [`/login`](../../frontend/src/app/login/page.js) |
| Login administrativo (Servicios Escolares / Caseta) | [`/login-admin`](../../frontend/src/app/login-admin/page.js) |

![Login comunidad](../mockups/1-login-alumnos-escritorio.png)
![Login administrativo](../mockups/2-login-admin-escritorio.png)

### 2. Comunidad — credencial digital

El alumno o trabajador ve su credencial con **código QR** e historial de accesos.

Ruta: [`/credencial`](../../frontend/src/app/credencial/page.js)

![Credencial digital](../mockups/4-credencial-escritorio.png)

### 3. Punto de acceso — terminal de validación

Terminal que valida el acceso en tiempo real (permitido / denegado).

Ruta: [`/acceso`](../../frontend/src/app/acceso/page.js)

![Validación permitida](../mockups/3-validacion-nfc-escritorio.png)
![Validación denegada](../mockups/3-validacion-nfc-escritorio2.png)

### 4. Servicios Escolares — gestión

Alta, edición, renovación y revocación de usuarios y credenciales.

| Pantalla | Ruta en el código |
|----------|-------------------|
| Gestión de usuarios | [`/admin/usuarios`](../../frontend/src/app/admin/usuarios/page.js) |
| Registrar usuario | [`/admin/usuarios/nuevo`](../../frontend/src/app/admin/usuarios/nuevo/page.js) |
| Editar usuario | [`/admin/usuarios/[id]`](../../frontend/src/app/admin/usuarios/[id]/page.js) |
| Bitácora de accesos | [`/admin/bitacora`](../../frontend/src/app/admin/bitacora/page.js) |

![Gestión de usuarios](../mockups/5-gestion-usuarios-escritorio.png)
![Registrar usuario](../mockups/8-registrar-usuario-escritorio.png)
![Editar usuario](../mockups/11-editar-usuario-escritorio.png)
![Renovar vigencia](../mockups/12-renovar-vigencia-escritorio.png)
![Bitácora de Servicios Escolares](../mockups/10-bitacora-servicios-escritorio.png)

Notificaciones al revocar / reactivar un acceso:

![Notificación de revocación](../mockups/13-notif-revocar-escritorio.png)
![Notificación de activación](../mockups/14-notif-activar-escritorio.png)

### 5. Caseta — seguridad

Validación manual de la comunidad y registro de externos con pase temporal.

| Pantalla | Ruta en el código |
|----------|-------------------|
| Buscar y validar alumno | [`/caseta/validar`](../../frontend/src/app/caseta/validar/page.js) |
| Registrar externo | [`/caseta/externos`](../../frontend/src/app/caseta/externos/page.js) |
| Bitácora de caseta | [`/caseta/bitacora`](../../frontend/src/app/caseta/bitacora/page.js) |

![Buscar alumno en caseta](../mockups/7-buscar-alumno-caseta-escritorio.png)
![Registrar externo](../mockups/6-registro-externo-escritorio-caseta.png)
![Bitácora de caseta](../mockups/9-bitacora-caseta-escritorio.png)

## Estado global (Redux)

El estado se organiza en tres slices en [`frontend/src/store/`](../../frontend/src/store):

- `authSlice` — sesión y usuario autenticado.
- `userSlice` — usuarios de la comunidad (alta, edición, revocación).
- `accessSlice` — credenciales, bitácora de accesos y visitantes externos.

El consumo de la API se centraliza en el cliente Axios [`frontend/src/lib/api.js`](../../frontend/src/lib/api.js).
Todas las pantallas son **responsivas** (existe versión de escritorio y móvil de cada mockup en
[`mockups/`](../mockups)).
