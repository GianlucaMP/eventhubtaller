#!/usr/bin/env bash
set -euo pipefail
umask 077

root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
state="$root/.eventhub-local"
data="$state/data"
socket="$state/socket"
port=55439
database=eventhub

if ! command -v pg_config >/dev/null; then
  echo 'Instalá el servidor PostgreSQL y sus herramientas de línea de comandos.' >&2
  exit 1
fi
bin=$(pg_config --bindir)
if [[ ! -x "$bin/initdb" || ! -x "$bin/pg_ctl" ]]; then
  echo "Faltan initdb o pg_ctl en $bin. Instalá el servidor PostgreSQL." >&2
  exit 1
fi

case "${1:-start}" in
  start)
    mkdir -p -- "$socket"
    if [[ ! -s "$data/PG_VERSION" ]]; then
      "$bin/initdb" -D "$data" --auth-local=peer --auth-host=scram-sha-256 --encoding=UTF8 --no-locale
    fi
    if ! "$bin/pg_ctl" -D "$data" status >/dev/null; then
      printf -v options '%q ' -h '' -k "$socket" -p "$port"
      "$bin/pg_ctl" -D "$data" -l "$state/postgres.log" -o "$options" start
    fi

    psql=("$bin/psql" -X -h "$socket" -p "$port" -v ON_ERROR_STOP=1)
    if [[ $("${psql[@]}" -d postgres -Atc "select 1 from pg_database where datname = 'eventhub'") != 1 ]]; then
      "$bin/createdb" -h "$socket" -p "$port" "$database"
    fi
    if [[ ! -f "$state/seed-aplicado" ]]; then
      if [[ -z $("${psql[@]}" -d "$database" -Atc "select to_regclass('eventhub.eventos')") ]]; then
        "${psql[@]}" -d "$database" -f "$root/neon/migrations/20261109000100_eventhub.sql"
      fi
      "${psql[@]}" -d "$database" -f "$root/neon/seed.sql"
      touch "$state/seed-aplicado"
    fi

    db_url=$(node -e '
      const [host, port, database, user] = process.argv.slice(1);
      const params = new URLSearchParams({ host });
      console.log(`postgresql://${encodeURIComponent(user)}@localhost:${port}/${database}?${params}`);
    ' "$socket" "$port" "$database" "$(id -un)")
    if (set -o noclobber; printf 'PORT=3000\nCORS_ORIGIN=http://localhost:5173\nDATABASE_URL=%s\n' "$db_url" > "$root/backend/.env") 2>/dev/null; then
      echo 'Configuración creada en backend/.env.'
    else
      printf 'backend/.env ya existe. Si querés usar esta base, configurá DATABASE_URL=%s\n' "$db_url"
    fi
    echo 'Base local de EventHub lista.'
    ;;
  stop)
    if "$bin/pg_ctl" -D "$data" status >/dev/null 2>&1; then
      "$bin/pg_ctl" -D "$data" -m fast stop
    fi
    ;;
  *)
    echo "Uso: bash $0 [start|stop]" >&2
    exit 2
    ;;
esac
