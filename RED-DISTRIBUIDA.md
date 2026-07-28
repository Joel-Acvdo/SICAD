# SICAD repartido en 3 laptops (Familia 4)

Guía para correr SICAD con **cada capa en una laptop distinta**, sobre la red del
laboratorio (routers Cisco 2811 con RIPv2, ver el reporte de red del equipo).

## Reparto

| Laptop | Rol | IP fija | Nombre DNS | Puerto |
|---|---|---|---|---|
| 1 | **Frontend** (la app) | `192.168.13.1` | `sicad.fandite.com` | 3000 |
| 2 | **Backend** (API) | `192.168.13.2` | `backend.fandite.com` | 4000 |
| 3 | **Base de datos** | `192.168.13.3` | `bd.fandite.com` | 5432 |

Red de la **Familia 4**: `192.168.13.0/24` · máscara `255.255.255.0` · gateway `192.168.13.254`.
Los usuarios y los celulares **solo abren la laptop 1**; ella habla con las demás.

```
[Celular / PC]  →  sicad.fandite.com:3000  →  [Laptop 1: Frontend]
                                                     │  /api
                                                     ▼
                                            [Laptop 2: Backend]
                                                     │
                                                     ▼
                                            [Laptop 3: Base de datos]
```

## Cómo encuentra cada servicio a su vecino

No hace falta reconfigurar nada al mover las cosas: cada servicio prueba varios
destinos **en orden** y se queda con el primero que **responde de verdad**.

| Orden | Backend busca la BD | Frontend busca el backend |
|---|---|---|
| 1 | `DATABASE_URL` del entorno | `BACKEND_URL` del entorno |
| 2 | servicio `db` de Docker | servicio `backend` de Docker |
| 3 | `bd.fandite.com` | `backend.fandite.com` |
| 4 | `192.168.13.3` | `192.168.13.2` |
| 5 | `localhost` | `localhost` |

- El **paso 1 gana siempre** → por eso **Azure** y el Docker de una sola máquina
  siguen funcionando sin tocar nada.
- El frontend **revalida cada 30 segundos**: si apagas o mueves la laptop del
  backend, lo reencuentra solo, sin reiniciar.

---

## Paso 1 · IP fija en cada laptop (Windows)

Configuración → Red e Internet → Ethernet → Editar IP → **Manual** → IPv4:

| | Laptop 1 | Laptop 2 | Laptop 3 |
|---|---|---|---|
| Dirección IP | `192.168.13.1` | `192.168.13.2` | `192.168.13.3` |
| Máscara | `255.255.255.0` | `255.255.255.0` | `255.255.255.0` |
| Puerta de enlace | `192.168.13.254` | `192.168.13.254` | `192.168.13.254` |

**Comprueba** que se ven entre ellas:
```bash
ping 192.168.13.2
```

## Paso 2 · Nombres `.fandite.com`

Si el equipo levanta un **servidor DNS**, registra ahí los 3 nombres apuntando a
sus IPs. Si **no hay servidor DNS**, agrega estas líneas al archivo `hosts` de
**cada** laptop (Bloc de notas **como administrador** →
`C:\Windows\System32\drivers\etc\hosts`):

```
192.168.13.1    sicad.fandite.com
192.168.13.2    backend.fandite.com
192.168.13.3    bd.fandite.com
```

> Si te saltas este paso no pasa nada: la cascada cae sola a las IPs fijas.

## Paso 3 · Abrir los puertos en el Firewall

En **PowerShell como Administrador**, en cada laptop la suya:

```bash
netsh advfirewall firewall add rule name="SICAD frontend 3000" dir=in action=allow protocol=TCP localport=3000
```
```bash
netsh advfirewall firewall add rule name="SICAD backend 4000" dir=in action=allow protocol=TCP localport=4000
```
```bash
netsh advfirewall firewall add rule name="SICAD base de datos 5432" dir=in action=allow protocol=TCP localport=5432
```

## Paso 4 · Arrancar (en este orden)

**Laptop 3 — base de datos:**
```bash
copy .env.laptop-bd.example .env
```
```bash
docker compose up -d db
```

**Laptop 2 — backend:**
```bash
copy .env.laptop-backend.example .env
```
```bash
docker compose up -d --build backend
```
En el log verás a cuál base de datos se conectó:
`✅ Base de datos: DNS bd.fandite.com`

**Laptop 1 — frontend:**
```bash
copy .env.laptop-frontend.example .env
```
```bash
docker compose up -d --build frontend
```

## Paso 5 · Probar

Desde cualquier equipo de la red (o un celular):

- App: **http://sicad.fandite.com:3000** (o `http://192.168.13.1:3000`)
- Salud de la API a través del proxy: `http://192.168.13.1:3000/api/health`
- Salud del backend directo: `http://192.168.13.2:4000/api/health`

En los logs del frontend aparece dónde encontró el backend:
```bash
docker compose logs frontend | findstr SICAD
```

---

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| "No se pudo contactar al servidor de SICAD" | La laptop del backend está apagada o el puerto 4000 cerrado en su firewall. |
| El backend dice `localhost (ningún destino respondió)` | La laptop de la BD no responde: revisa IP, firewall del 5432 y que el contenedor `db` esté arriba. |
| Los nombres `.fandite.com` no resuelven | Falta el DNS o las líneas del archivo `hosts` (Paso 2). Funciona igual por IP. |
| El celular no abre la app | Debe estar en la misma red y usar la IP/nombre de la **laptop 1**, no `localhost`. |
| La cámara del lector QR no abre | El navegador exige HTTPS o `localhost`. Ver la nota del lector QR en `Contexto.md`. |

## Todo en una sola máquina

Sigue funcionando igual que siempre, sin `.env` especial:
```bash
docker compose up -d --build
```
