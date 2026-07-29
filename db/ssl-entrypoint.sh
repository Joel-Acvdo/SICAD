#!/bin/sh
# ============================================================================
# Entrypoint de Postgres para SICAD con SSL.
#
# Postgres exige que la llave privada tenga permisos 600 y sea del usuario
# postgres. Un bind-mount desde Windows NO permite ajustar permisos, así que
# aquí COPIAMOS los certificados a una ruta interna del contenedor y les damos
# los permisos correctos antes de arrancar.
#
# AUTO-DETECCIÓN: si existe /etc/sicad/cert/bd.key, se enciende SSL. Si no
# (modo "todo en una máquina" sin certificados), Postgres arranca normal.
# ============================================================================
set -e

SSL_ARGS=""
CERT_SRC=/etc/sicad/cert
SSL_DIR=/var/lib/postgresql/ssl

if [ -f "$CERT_SRC/bd.key" ] && [ -f "$CERT_SRC/bd.crt" ]; then
  echo "[SICAD] Certificados encontrados → habilitando SSL en Postgres."
  mkdir -p "$SSL_DIR"
  cp "$CERT_SRC/bd.crt" "$SSL_DIR/server.crt"
  cp "$CERT_SRC/bd.key" "$SSL_DIR/server.key"
  chmod 600 "$SSL_DIR/server.key"
  chmod 644 "$SSL_DIR/server.crt"
  chown -R postgres:postgres "$SSL_DIR"

  SSL_ARGS="-c ssl=on -c ssl_cert_file=$SSL_DIR/server.crt -c ssl_key_file=$SSL_DIR/server.key"
  # ca.crt es opcional (solo si se quiere validar certificados de clientes).
  if [ -f "$CERT_SRC/ca.crt" ]; then
    cp "$CERT_SRC/ca.crt" "$SSL_DIR/root.crt"
    chmod 644 "$SSL_DIR/root.crt"
    chown postgres:postgres "$SSL_DIR/root.crt"
    SSL_ARGS="$SSL_ARGS -c ssl_ca_file=$SSL_DIR/root.crt"
  fi
else
  echo "[SICAD] Sin certificados en $CERT_SRC → Postgres sin SSL (modo dev)."
fi

# Delega en el entrypoint oficial de la imagen, añadiendo los flags de SSL.
exec docker-entrypoint.sh postgres $SSL_ARGS "$@"
