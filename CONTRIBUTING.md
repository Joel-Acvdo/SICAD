# Guía de contribución — SICAD

Trabajamos simulando un entorno laboral con **tres ramas** y Pull Requests.

## Ramas

```
feature/* ──▶ dev ──▶ qa ──▶ main
```

- **`main`** — Producción. Solo recibe cambios aprobados por QA. Nadie hace push directo.
- **`qa`** — Pruebas. QA valida aquí lo que viene de `dev`.
- **`dev`** — Integración de desarrollo. Punto de partida de toda nueva tarea.

## Flujo de trabajo

1. Actualiza tu `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   ```
2. Crea tu rama de tarea:
   ```bash
   git checkout -b feature/nombre-de-la-tarea
   ```
3. Haz commits pequeños y frecuentes (mínimo uno diario):
   ```bash
   git add .
   git commit -m "feat(usuarios): agrega endpoint de alta"
   git push origin feature/nombre-de-la-tarea
   ```
4. Abre un **Pull Request hacia `dev`**. Debe pasar el CI (build + pruebas).
5. Cuando `dev` está estable → PR de `dev` hacia **`qa`**.
6. QA prueba y aprueba → PR de `qa` hacia **`main`**.

## Convención de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

| Tipo       | Uso                                       |
|------------|-------------------------------------------|
| `feat`     | Nueva funcionalidad                       |
| `fix`      | Corrección de error                       |
| `docs`     | Documentación                             |
| `test`     | Pruebas                                   |
| `refactor` | Reestructura sin cambiar comportamiento   |
| `chore`    | Configuración, dependencias, CI           |

Ejemplo: `feat(credenciales): valida vigencia NFC en el acceso`

## Antes de abrir un PR

- [ ] El backend pasa `npm test`.
- [ ] El frontend compila con `npm run build`.
- [ ] No subiste archivos `.env` ni secretos.
