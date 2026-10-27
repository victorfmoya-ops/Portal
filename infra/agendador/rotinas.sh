#!/bin/sh
# Agendador do portal: chama as rotinas automáticas com o token CRON_SECRET.
#  - a cada 15 min: apaga comprovantes já analisados (privacidade/LGPD)
#  - a cada 6 h:    garante as mensalidades do mês (idempotente)
set -eu
URL="${PORTAL_URL:-http://web:3000}"

chamar() {
  resposta=$(wget -q -O- --header="Authorization: Bearer ${CRON_SECRET}" --post-data='' "$URL/api/cron/$1" 2>&1) \
    && echo "$(date -Iseconds) [ok] $1 $resposta" \
    || echo "$(date -Iseconds) [ERRO] $1 $resposta"
}

ciclo=0
while true; do
  chamar limpar-comprovantes
  # 24 ciclos de 15 min = 6 horas
  if [ $((ciclo % 24)) -eq 0 ]; then chamar gerar-mensalidades; fi
  ciclo=$((ciclo + 1))
  sleep 900
done
