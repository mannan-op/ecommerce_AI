#!/usr/bin/env bash
# PostgreSQL backup helper — run on a schedule in production (cron / k8s CronJob).
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DATABASE_URL="${DATABASE_URL:-postgres://ecommerce:ecommerce@localhost:5432/ecommerce}"

mkdir -p "$BACKUP_DIR"
OUTPUT="$BACKUP_DIR/ecommerce-${TIMESTAMP}.sql.gz"

echo "Writing backup to $OUTPUT"
pg_dump "$DATABASE_URL" | gzip > "$OUTPUT"
echo "Done."
