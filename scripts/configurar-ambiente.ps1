<#
.SYNOPSIS
  Prepara o ambiente de desenvolvimento do portal em um comando.
.DESCRIPTION
  1. Sobe o Supabase local (banco, login, arquivos) — aplica migrations e dados de exemplo.
  2. Gera .env.local (para "npm run dev") e .env (para o Docker) com as chaves do Supabase local
     e segredos aleatórios. Não sobrescreve segredos que já existem.
  Uso:  powershell -ExecutionPolicy Bypass -File scripts\configurar-ambiente.ps1
#>
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

function Segredo([int]$tamanho = 40) {
  $bytes = New-Object byte[] $tamanho
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  ([Convert]::ToBase64String($bytes) -replace '[^A-Za-z0-9]', '').Substring(0, $tamanho - 8)
}

function LerEnv([string]$arquivo) {
  $mapa = @{}
  if (Test-Path $arquivo) {
    Get-Content $arquivo | Where-Object { $_ -match '^\s*([A-Z0-9_]+)=(.*)$' } | ForEach-Object { $mapa[$Matches[1]] = $Matches[2] }
  }
  $mapa
}

Write-Host '1/3 Subindo o Supabase local (pode demorar na primeira vez)...' -ForegroundColor Cyan
# O npx escreve avisos no stderr: no PowerShell 5.1 isso viraria erro fatal, então conferimos o código de saída.
$ErrorActionPreference = 'Continue'
npx supabase start 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Falha ao subir o Supabase local (o Docker Desktop está ligado?)' }

Write-Host '2/3 Lendo as chaves do Supabase local...' -ForegroundColor Cyan
$status = @{}
npx supabase status -o env 2>$null | ForEach-Object {
  if ($_ -match '^([A-Z_]+)="?([^"]*)"?$') { $status[$Matches[1]] = $Matches[2] }
}
if (-not $status['ANON_KEY']) { throw 'Não consegui ler as chaves do Supabase (o Docker está ligado?)' }

$antigo = LerEnv '.env.local'
$cron = if ($antigo['CRON_SECRET'] -and $antigo['CRON_SECRET'] -ne '__GERAR__') { $antigo['CRON_SECRET'] } else { Segredo }
$metrics = if ($antigo['METRICS_TOKEN'] -and $antigo['METRICS_TOKEN'] -ne '__GERAR__') { $antigo['METRICS_TOKEN'] } else { Segredo }
$antigoDocker = LerEnv '.env'
$grafana = if ($antigoDocker['GRAFANA_ADMIN_PASSWORD'] -and $antigoDocker['GRAFANA_ADMIN_PASSWORD'] -ne '__GERAR__') { $antigoDocker['GRAFANA_ADMIN_PASSWORD'] } else { Segredo 24 }

$comum = @"
NEXT_PUBLIC_SUPABASE_URL=$($status['API_URL'])
NEXT_PUBLIC_SUPABASE_ANON_KEY=$($status['ANON_KEY'])
NEXT_PUBLIC_ORG_SLUG=omos-ode
SUPABASE_SERVICE_ROLE_KEY=$($status['SERVICE_ROLE_KEY'])
CRON_SECRET=$cron
METRICS_TOKEN=$metrics
GOOGLE_CLIENT_ID=$($antigo['GOOGLE_CLIENT_ID'])
GOOGLE_CLIENT_SECRET=$($antigo['GOOGLE_CLIENT_SECRET'])
"@

$utf8 = New-Object Text.UTF8Encoding $false
[IO.File]::WriteAllText('.env.local', "# gerado por scripts/configurar-ambiente.ps1 (npm run dev)`n$comum`nNEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000`n", $utf8)
[IO.File]::WriteAllText('.env', "# gerado por scripts/configurar-ambiente.ps1 (Docker)`n$comum`nNEXT_PUBLIC_SITE_URL=http://127.0.0.1:3020`nWEB_HOST_PORT=3020`nPROMETHEUS_HOST_PORT=9096`nGRAFANA_HOST_PORT=3006`nGRAFANA_ADMIN_PASSWORD=$grafana`n", $utf8)

Write-Host '3/3 Pronto!' -ForegroundColor Green
Write-Host '  Desenvolvimento : npm run dev                -> http://127.0.0.1:3000'
Write-Host '  Docker completo : docker compose up -d --build -> http://127.0.0.1:3020'
Write-Host '  Banco (Studio)  : http://127.0.0.1:55423'
Write-Host '  E-mails de teste: http://127.0.0.1:55424'
