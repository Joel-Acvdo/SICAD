# Pruebas funcionales de SICAD

Ejecución de pruebas del **23/07/2026** sobre la rama `dev`, con el sistema corriendo en Docker
(frontend `:3000`, backend `:4000`, PostgreSQL `:5432`).

## Entregables

| Archivo | Contenido |
|---|---|
| `SICAD_casos_de_prueba.pdf` | Los 52 casos de prueba diseñados y ejecutados, con pasos, resultado esperado, resultado obtenido y estado. |
| `SICAD_reporte_incidencias.pdf` | 14 fichas de defecto (BUG-01 … BUG-14) en el formato de la plantilla de incidencias, con capturas. |
| `SICAD_reporte_mejoras.pdf` | 6 propuestas de mejora (MEJ-01 … MEJ-06): validaciones y funciones que no son defectos pero reforzarían la operación. |
| `capturas/` | 50 capturas de pantalla nombradas por caso de prueba (`cpNN-descripcion.png`). |

## Resumen

- **52 casos ejecutados:** 33 aprobados · 16 fallidos · 3 observaciones.
- **Lo que salió bien:** el control de permisos por rol (RBAC) del backend resistió todos los intentos
  de acceso indebido; el flujo crítico *reportar pérdida → credencial revocada → la caseta deniega el
  paso* funciona de extremo a extremo; los mensajes de error del inicio de sesión no revelan si un
  usuario existe.
- **Lo más urgente:** BUG-01 (pantallas de administración accesibles sin sesión), BUG-14 (la caseta ve
  "acceso registrado" aunque el registro haya fallado), BUG-09 (una credencial revocada no se puede
  reactivar nunca) y BUG-10 (una credencial vencida en 1990 sigue marcada como ACTIVA).

## Cómo reproducir las pruebas

Los scripts de automatización (Playwright sobre el Chrome instalado) no se versionan porque son
material de trabajo de QA. Cada ficha de incidencia incluye los pasos manuales exactos para reproducir
el defecto desde el navegador.

**Usuarios usados en las pruebas:** `caseta@upa.edu.mx` / `Caseta123!` · `admin@upa.edu.mx` /
`Admin123!` · `UP230571` / `Alumno123!`
