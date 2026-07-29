# SICAD con HTTPS — Workflow para el equipo

Guía para levantar SICAD **repartido en 3 laptops** (ver [RED-DISTRIBUIDA.md](RED-DISTRIBUIDA.md))
pero ahora con **conexión segura HTTPS/TLS**, usando nuestra propia CA (`fandite-root-CA`).

> **Por qué nos importa:** además de cifrar el tráfico, el **lector de QR del frontend
> solo funciona sobre HTTPS** (los navegadores bloquean la cámara en HTTP). Sin esto,
> esa pantalla no abre la cámara en las laptops/celulares de la red.

---

## Estado de implementación

Esto se cablea **por fases**. Marca qué hay listo en el repo antes de pedirle al equipo que levante:

| Fase | Qué cifra | Estado |
|---|---|---|
| **A — Frontend HTTPS** | Navegador ⇄ Frontend (lo que ve el usuario) | ✅ cableado (Nginx + perfil `tls`) |
| **B — Backend + BD** | Frontend ⇄ Backend ⇄ Postgres | ✅ cableado (Nginx backend + Postgres SSL) |

Mientras una fase esté "por cablear", el tramo correspondiente sigue en HTTP.
Este documento describe **qué hará cada persona** una vez cableado.

---

## Mapa de la red (Familia 4)

| Laptop | Rol | IP fija | FQDN | Puerto TLS |
|---|---|---|---|---|
| 1 | **Frontend** | `192.168.13.1` | `sicad.fandite.com` | **443** |
| 2 | **Backend** | `192.168.13.2` | `backend.fandite.com` | **443** |
| 3 | **Base de datos** | `192.168.13.3` | `bd.fandite.com` | **5432** (SSL) |

```
[Celular / PC]  ──HTTPS 443──►  [Laptop 1: Frontend + Nginx]
                                       │  /api  (HTTPS)
                                       ▼
                              [Laptop 2: Backend]  ──SSL──►  [Laptop 3: Postgres]
```

---

## Quién tiene qué certificado

Cada laptop necesita **solo su trío**. La clave privada (`.key`) **nunca sale de su laptop**.

| Laptop | Archivos en su carpeta `cert/` |
|---|---|
| Frontend | `sicad.crt` · `sicad.key` · `ca.crt` |
| Backend | `backend.crt` · `backend.key` · `ca.crt` |
| BD | `bd.crt` · `bd.key` · `ca.crt` |

> 🔒 **Seguridad de las llaves.** No repartas las `.key` por el repositorio. Cada quien
> recibe su trío por un canal directo (USB / mensaje privado). El repo debe ignorar las
> llaves — asegúrate de que `.gitignore` contenga:
> ```
> cert/*.key
> cert/*.cer
> cert/*.crt
> cert/*.csr
> ```
> El único que puede compartirse abiertamente es `ca.crt` (es público).

---

## Paso 0 — Lo que hace TODO el equipo (una sola vez por laptop)

Esto va **en las 3 laptops de servicio Y en cualquier equipo/celular que abra la app**.

### 0.1 · Confiar en nuestra CA (`ca.crt`)

Sin esto, aunque los certificados sean válidos, el navegador dirá "no confiable".

**En Windows** (laptops):
1. Doble clic en `ca.crt` → **Instalar certificado**.
2. Almacén: **Entidades de certificación raíz de confianza** → aceptar la advertencia.

**En Android** (celulares que abran la app):
Ajustes → Seguridad → Cifrado y credenciales → **Instalar un certificado** → **Certificado de CA** → elegir `ca.crt`.

### 0.2 · IP fija, DNS y firewall

Igual que en [RED-DISTRIBUIDA.md](RED-DISTRIBUIDA.md) (IP fija + `hosts`/DNS), pero
**abriendo los puertos TLS**. En **PowerShell como Administrador**, cada laptop la suya:

```bash
netsh advfirewall firewall add rule name="SICAD HTTPS 443" dir=in action=allow protocol=TCP localport=443
```
```bash
netsh advfirewall firewall add rule name="SICAD Postgres 5432" dir=in action=allow protocol=TCP localport=5432
```

Y los nombres en `C:\Windows\System32\drivers\etc\hosts` (si no hay servidor DNS):
```
192.168.13.1    sicad.fandite.com
192.168.13.2    backend.fandite.com
192.168.13.3    bd.fandite.com
```

---

## Paso 1 — Instrucciones por rol

Cada persona hace **solo su sección**. El orden de arranque es **BD → Backend → Frontend**.

### 🟦 Laptop 3 — Base de datos

1. Copia a `cert/`: `bd.crt`, `bd.key`, `ca.crt`.
2. Copia el entorno y levanta:
   ```bash
   copy .env.laptop-bd.example .env
   ```
   ```bash
   docker compose up -d db
   ```
   > SSL se enciende **solo**: el entrypoint detecta `bd.key` en `cert/`, copia
   > los certificados dentro del contenedor con permisos `600` (Postgres lo
   > exige) y arranca con TLS. Sin certificados, Postgres arranca normal (dev).
3. Verifica que Postgres quedó con SSL activo:
   ```bash
   docker compose exec db psql -U sicad -d sicad -tAc "SHOW ssl;"
   ```
   Debe imprimir `on`.

### 🟩 Laptop 2 — Backend

1. Copia a `cert/`: `backend.crt`, `backend.key`, `ca.crt`.
2. Copia el entorno y levanta el backend **junto con su proxy HTTPS**:
   ```bash
   copy .env.laptop-backend.example .env
   ```
   ```bash
   docker compose up -d --build backend backend-proxy
   ```
   > Su `.env` trae `COMPOSE_PROFILES=tls` (sube el `backend-proxy`) y `DB_SSL=on`
   > (exige conexión cifrada a Postgres, validada contra `ca.crt`). Nginx termina
   > TLS en 443; Express sigue interno en 4000.
3. En el log debe resolver la BD y arrancar sin errores de conexión:
   ```bash
   docker compose logs backend
   ```

### 🟥 Laptop 1 — Frontend

1. Copia a `cert/`: `sicad.crt`, `sicad.key`, `ca.crt`.
2. Copia el entorno y levanta el frontend **junto con el proxy HTTPS** (Nginx):
   ```bash
   copy .env.laptop-frontend.example .env
   ```
   ```bash
   docker compose up -d --build frontend frontend-proxy
   ```
   > El `.env` de esta laptop trae `COMPOSE_PROFILES=tls`, así que el perfil se
   > activa **solo** — no hace falta el flag `--profile`. Nginx (`frontend-proxy`)
   > termina TLS en 443 y redirige el 80 a HTTPS; el contenedor de Next queda
   > interno en 3000. En modo "todo en una máquina" (sin ese `.env`) el proxy
   > **no** se levanta.

3. **Arranque automático tras reiniciar la laptop.** Ambos contenedores usan
   `restart: unless-stopped`, así que vuelven solos al reiniciar Windows/Docker
   — **siempre que**:
   - Docker Desktop esté configurado para iniciar con la sesión
     (Settings → General → *Start Docker Desktop when you sign in*).
   - No hayas hecho `docker compose down` (eso **elimina** los contenedores y ya
     no hay nada que reiniciar; para volver a subirlos, repite el paso 2).
   - Para solo detenerlos sin borrarlos usa `docker compose stop`; para
     reanudarlos, `docker compose start`.

---

## Paso 2 — Verificación

Desde cualquier equipo de la red **con `ca.crt` ya instalado** (Paso 0.1):

1. Abre **https://sicad.fandite.com** → debe cargar con **candado cerrado**, sin advertencias.
2. La cámara del **lector QR** ahora sí abre (requería HTTPS).
3. Salud de la API a través del proxy: `https://sicad.fandite.com/api/health`.
4. Conexión Backend → BD cifrada:
   ```bash
   docker compose exec db psql -U sicad -d sicad -c "SELECT ssl, client_addr FROM pg_stat_ssl JOIN pg_stat_activity USING (pid);"
   ```
   La conexión del backend debe aparecer con `ssl = t`.

---

## Probar TODO en un solo host (antes de repartir)

Para validar la cadena TLS completa en **una sola máquina** (sin las 3 laptops),
usa el override [docker-compose.allinone-tls.yml](docker-compose.allinone-tls.yml).
Los dos proxies no pueden compartir 80/443, así que ahí solo el `frontend-proxy`
se publica al host y el `backend-proxy` queda interno (el frontend lo alcanza por
su alias de red).

1. Copia los **6** certificados de servicio + `ca.crt` a `cert/` (aquí conviven todos).
2. Agrega a `C:\Windows\System32\drivers\etc\hosts` (como Administrador):
   ```
   127.0.0.1   sicad.fandite.com
   ```
3. Instala `ca.crt` como raíz de confianza (Paso 0.1) y levanta:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.allinone-tls.yml --profile tls up -d --build
   ```
4. Abre `https://sicad.fandite.com` — candado cerrado, con toda la cadena cifrada por dentro.
5. Apaga con:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.allinone-tls.yml --profile tls down
   ```

> Es solo para probar. En el despliegue real cada laptop levanta lo suyo (sin este override).

---

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| "Certificado no confiable" / candado roto (`ERR_CERT_AUTHORITY_INVALID`) | Falta instalar `ca.crt` como raíz en **ese** equipo (Paso 0.1). Es el 90% de los casos. |
| `ERR_CERT_COMMON_NAME_INVALID` | Estás entrando por **IP** (p. ej. `https://192.168.13.1`). El certificado solo vale para el **nombre** — entra por `https://sicad.fandite.com`. (Si aun por nombre falla, el cert no trae SAN: reemitir con SAN.) |
| `400 Bad Request: The plain HTTP request was sent to HTTPS port` | Entraste por `http://…:443` (p. ej. el clic del puerto en Docker). El 443 es HTTPS: usa `https://…`. |
| "Conexión rechazada" al abrir 443 | Firewall: falta la regla del puerto 443 en esa laptop (Paso 0.2). |
| Backend no conecta a la BD | Puerto 5432 cerrado, contenedor `db` abajo, o falta `ca.crt` en la laptop del backend. |
| La BD reinicia en bucle: `set: illegal option -` en los logs | `db/ssl-entrypoint.sh` quedó con saltos de línea Windows (CRLF). El `.gitattributes` (`*.sh text eol=lf`) lo evita al clonar; si lo editaste a mano, guárdalo en **LF**. |
| Frontend: "self-signed certificate in chain" al llamar `/api` | El Node de Next no confía en la CA: falta `NODE_EXTRA_CA_CERTS` apuntando a `ca.crt` (queda cableado en la Fase B). |
| La cámara del QR no abre | Se está entrando por HTTP o por IP en vez de `https://sicad.fandite.com`. |

---

## Notas

- **Vigencia:** los certificados de servicio expiran el **28-jul-2028**; la CA raíz el **28-jul-2031**. Anótenlo.
- **Todo en una máquina (desarrollo):** el modo `docker compose up -d --build` sin TLS sigue existiendo para desarrollar; TLS es para el despliegue en las 3 laptops.
