# Guía: Implementación de Certificados SSL con AD CS + Docker
### Dominio: fandite.com | 3 equipos Windows Home (Frontend, Backend, BD)

**Contexto:** VM Windows Server con AD CS (CA propia) + 3 hosts Windows Home fuera del dominio, cada uno con Docker corriendo un servicio (Frontend / Backend / BD PostgreSQL).

**Nombres DNS ya resueltos:**
| Servicio | FQDN | IP |
|---|---|---|
| Frontend | sicad.fandite.com | 10.22.146.149 |
| Backend | backend.fandite.com | 10.22.146.150 |
| BD (PostgreSQL) | bd.fandite.com | 10.22.146.151 |

---

## Paso 1 — Instalar el rol de Inscripción Web de Certificados (en la VM)

1. Administrador del servidor → Agregar roles y características
2. Servicios de certificados de Active Directory → marcar **"Inscripción de certificados vía Web"**
3. Instalar y completar el asistente de configuración post-instalación
4. Verificar acceso desde cualquier equipo de la red:
   ```
   http://<IP-VM>/certsrv
   ```

---

## Paso 2 — Instalar el certificado raíz de la CA como confiable (en los 3 hosts)

Repetir en **cada uno** de los 3 equipos Windows Home:

1. Ir a `http://<IP-VM>/certsrv`
2. Clic en **"Download a CA certificate, certificate chain, or CRL"**
3. Descargar el certificado de la CA (`certnew.cer` o similar)
4. Doble clic en el archivo → **Instalar certificado**
5. Almacén: **Entidades de certificación raíz de confianza**
6. Confirmar instalación

Esto es indispensable — sin este paso, aunque los certificados de servicio sean válidos, los equipos mostrarán "no confiable".

---

## Paso 3 — Solicitar los 3 certificados de servicio (CSR vía Git Bash + web)

Repetir en **cada uno** de los 3 equipos, con Git Bash:

```bash
cd ~/Desktop
mkdir certs && cd certs

# Frontend
openssl req -new -newkey rsa:2048 -nodes -keyout sicad.key -out sicad.csr -subj "/CN=sicad.fandite.com"

# Backend
openssl req -new -newkey rsa:2048 -nodes -keyout backend.key -out backend.csr -subj "/CN=backend.fandite.com"

# BD
openssl req -new -newkey rsa:2048 -nodes -keyout bd.key -out bd.csr -subj "/CN=bd.fandite.com"
```

Luego, en cada equipo:
1. Ir a `http://<IP-VM>/certsrv` → **"Request a certificate"** → **"advanced certificate request"**
2. Pegar el contenido completo del `.csr` correspondiente en "Saved Request"
3. Seleccionar la plantilla duplicada (Servidor Web)
4. Submit → descargar el certificado emitido (`certnew.cer`)
5. Renombrar a algo claro: `sicad.crt`, `backend.crt`, `bd.crt`

Si la plantilla requiere aprobación manual, emitir la solicitud pendiente desde `certsrv.msc` en la VM antes de descargar.

**Resultado por host:** un archivo `.key` (clave privada) y un `.crt` (certificado firmado), ya en formato PEM listos para usar — sin conversión adicional.

---

## Paso 4 — Preparar los archivos de certificado para Docker

Como ya están en formato PEM/texto plano (gracias al método OpenSSL), solo falta:

1. Crear una carpeta `certs/` dentro del proyecto de cada host (si no existe ya)
2. Copiar ahí `<nombre>.key` y `<nombre>.crt`
3. Copiar también el certificado raíz de la CA (`ca.crt`) a esa misma carpeta en cada host — lo necesitarán Node (para conectarse a Postgres) y Postgres (para validar la cadena)

Estructura esperada por host, ejemplo Backend:
```
backend-app/
├── docker-compose.yml
├── certs/
│   ├── backend.key
│   ├── backend.crt
│   └── ca.crt
```

---

## Paso 5 — Modificar `docker-compose.yml` de cada host (montar certificados)

**Frontend (con Nginx sirviendo el contenido y terminando SSL):**
```yaml
services:
  frontend:
    image: mi-frontend
    volumes:
      - ./certs:/etc/nginx/certs:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "443:443"
```

**Backend (Node/Express):**
```yaml
services:
  backend:
    image: mi-backend
    volumes:
      - ./certs:/app/certs:ro
    ports:
      - "443:443"
    environment:
      - DB_HOST=bd.fandite.com
```

**BD (PostgreSQL):**
```yaml
services:
  postgres:
    image: postgres:16
    volumes:
      - ./certs/bd.crt:/var/lib/postgresql/server.crt:ro
      - ./certs/bd.key:/var/lib/postgresql/server.key:ro
      - ./certs/ca.crt:/var/lib/postgresql/root.crt:ro
      - ./pgdata:/var/lib/postgresql/data
    command: >
      postgres
      -c ssl=on
      -c ssl_cert_file=/var/lib/postgresql/server.crt
      -c ssl_key_file=/var/lib/postgresql/server.key
```

⚠️ PostgreSQL exige permisos `600` en `server.key`. Si Docker Desktop en Windows da error de permisos, agregar un `entrypoint.sh` que ejecute `chmod 600` antes de iniciar Postgres, o usar un `Dockerfile` personalizado.

---

## Paso 6 — Configurar cada servicio para usar el certificado

**Frontend — `nginx.conf`:**
```nginx
server {
    listen 443 ssl;
    server_name sicad.fandite.com;

    ssl_certificate     /etc/nginx/certs/sicad.crt;
    ssl_certificate_key /etc/nginx/certs/sicad.key;

    location / {
        root /usr/share/nginx/html;
        index index.html;
    }
}
```

**Backend — código Node/Express (si Node maneja SSL directamente en vez de un Nginx delante):**
```javascript
const https = require('https');
const fs = require('fs');
const express = require('express');
const app = express();

const options = {
  key: fs.readFileSync('/app/certs/backend.key'),
  cert: fs.readFileSync('/app/certs/backend.crt')
};

https.createServer(options, app).listen(443, () => {
  console.log('Backend HTTPS activo en 443');
});
```

**Backend — conexión a PostgreSQL con SSL:**
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  host: 'bd.fandite.com',
  ssl: {
    ca: fs.readFileSync('/app/certs/ca.crt'),
    rejectUnauthorized: true
  }
});
```

**BD:** ya queda configurada directamente en el `docker-compose.yml` del Paso 5 (`ssl=on` + rutas de certificado).

---

## Paso 7 — Abrir puertos en el Firewall de Windows (en cada host)

En cada uno de los 3 equipos:

1. Panel de Control → Firewall de Windows Defender → Configuración avanzada
2. Reglas de entrada → Nueva regla → Puerto
3. Frontend y Backend: TCP **443**
4. BD: TCP **5432** (puerto por defecto de PostgreSQL)
5. Permitir la conexión → aplicar a los 3 perfiles (dominio, privado, público según corresponda)

Sin este paso, aunque todo esté bien configurado dentro del contenedor, el tráfico entrante será bloqueado por Windows y parecerá que "no conecta".

---

## Paso 8 — Levantar los contenedores

En cada host, dentro de la carpeta del proyecto:
```bash
docker-compose up --build -d
```

---

## Paso 9 — Verificación

1. Desde otro equipo de la red (con el certificado raíz ya instalado como confiable), abrir:
   ```
   https://sicad.fandite.com
   ```
   Debe cargar sin advertencia de certificado no confiable (candado cerrado, sin alertas).

2. Verificar conexión cifrada Backend → BD revisando los logs del contenedor de PostgreSQL (debe mostrar conexión SSL) o consultando:
   ```sql
   SELECT * FROM pg_stat_ssl;
   ```

3. Confirmar que `https://backend.fandite.com` responde correctamente desde el Frontend.

---

## Notas finales
- Anota la fecha de expiración del certificado raíz y de cada certificado emitido.
- Si algo fallara por "certificado no confiable", el 90% de las veces es que el Paso 2 no se hizo en ese equipo específico.
- Si algo fallara por "conexión rechazada", revisar primero el Paso 7 (firewall).
