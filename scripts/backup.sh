#!/bin/bash
# scripts/backup.sh
# Backup do banco de dados Supabase

set -e

# Configurações
SUPABASE_PROJECT_REF="seu-project-ref"
SUPABASE_DB_PASSWORD="sua-db-password"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.sql"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Fazer backup via pg_dump
# Nota: É necessário ter pg_dump instalado no ambiente onde este script roda
PGPASSWORD=$SUPABASE_DB_PASSWORD pg_dump \
  -h db.${SUPABASE_PROJECT_REF}.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -F c \
  -b \
  -v \
  -f $BACKUP_FILE

# Comprimir
gzip $BACKUP_FILE

echo "✅ Backup criado: ${BACKUP_FILE}.gz"

# Limpar backups antigos (manter últimos 7 dias)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "✅ Backups antigos removidos"
