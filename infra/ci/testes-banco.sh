#!/bin/sh
# Testes de segurança do banco (RLS + regras do filho) num Postgres DESCARTÁVEL.
# Usado pela esteira (GitLab.com ou laboratório local): o banco é o "service" pg do job.
# Variáveis: PGHOST (padrão pg), PGPASSWORD (senha do container descartável).
set -eu
export PGHOST="${PGHOST:-pg}"
export PGPORT="${PGPORT:-5432}"
ADMIN="psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -q"

echo "Aguardando o banco em $PGHOST:$PGPORT..."
for i in $(seq 1 90); do
  pg_isready -U postgres -h "$PGHOST" -p "$PGPORT" >/dev/null 2>&1 && break
  sleep 2
done
# a imagem do Supabase roda as próprias migrations depois de aceitar conexões
for i in $(seq 1 60); do
  psql -U supabase_admin -d postgres -tAc "select 1 from pg_roles where rolname = 'authenticated'" 2>/dev/null | grep -q 1 && break
  sleep 2
done

$ADMIN < supabase/tests/ci/preparar-banco.sql
for f in supabase/migrations/*.sql; do
  echo "migration $f"
  psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q < "$f"
done
$ADMIN < supabase/seed.sql
$ADMIN < infra/ci/dados-de-teste.sql
psql -U supabase_admin -d postgres -qc "create extension if not exists pgtap"
$ADMIN -tA < supabase/tests/rls_permissoes.test.sql | tee pgtap.txt

if grep -q '^not ok' pgtap.txt; then echo "Há testes de RLS reprovados"; exit 1; fi
echo "Testes de RLS aprovados = $(grep -c '^ok' pgtap.txt)"
