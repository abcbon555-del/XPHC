#!/bin/sh
# Sao luu database ra file nen .sql.gz, giu 14 ban gan nhat.
# Chay thu:   sh scripts/backup-db.sh
# Tu dong hang ngay: them vao crontab (xem docs/DEPLOYMENT.md muc 6).
set -e

COMPOSE="docker compose --env-file .env.production -f docker-compose.prod.yml"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP="${KEEP:-14}"

mkdir -p "$BACKUP_DIR"
TS=$(date +%Y%m%d_%H%M%S)
OUT="$BACKUP_DIR/xphc_db_$TS.sql.gz"

$COMPOSE exec -T db pg_dump -U postgres xphc_db | gzip > "$OUT"

# Xoa cac ban cu, chi giu $KEEP ban moi nhat
ls -1t "$BACKUP_DIR"/xphc_db_*.sql.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

echo "Da sao luu: $OUT"
echo "Ban sao luu hien co:"
ls -1t "$BACKUP_DIR"/xphc_db_*.sql.gz 2>/dev/null | head -n "$KEEP"
