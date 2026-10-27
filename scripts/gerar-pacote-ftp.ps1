<#
.SYNOPSIS
  Gera o pacote do portal para subir por FTP numa hospedagem com Node.js
  (cPanel "Setup Node.js App", Hostinger com Node.js, VPS...).
.DESCRIPTION
  1. Lê o arquivo de PRODUÇÃO (.env.producao — nunca vai para o git) e confere se está completo e seguro
  2. Compila o portal (Next.js "standalone") com as variáveis públicas de produção
  3. Monta dist\ftp\portal\ (server.js + .next + public + node_modules mínimos) e dist\ftp\portal.zip
  4. Confere que nenhum arquivo .env nem valor secreto foi parar dentro do pacote
  Uso:  powershell -ExecutionPolicy Bypass -File scripts\gerar-pacote-ftp.ps1
        -Arquivo <arq>  usa outro arquivo de variáveis (padrão: .env.producao)
        -Teste          aceita http:// e 127.0.0.1 (só para validar o pacote no próprio PC)
  Passo a passo completo: docs\PUBLICAR-NA-HOSPEDAGEM.md
#>
param([string]$Arquivo = '.env.producao', [switch]$Teste)
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz
function Passo($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function LerEnv($arquivo) {
  $m = @{}
  Get-Content $arquivo -Encoding UTF8 | Where-Object { $_ -match '^\s*([A-Z0-9_]+)=(.*)$' } | ForEach-Object { $m[$Matches[1]] = $Matches[2].Trim() }
  $m
}

Passo "1/4 Conferindo as variáveis de produção ($Arquivo)"
if (-not (Test-Path $Arquivo)) {
  throw "Arquivo $Arquivo não encontrado. Copie o .env.example para $Arquivo e preencha com os valores de PRODUÇÃO (docs\PUBLICAR-NA-HOSPEDAGEM.md)."
}
$e = LerEnv $Arquivo
$erros = @()
$obrigatorias = 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SITE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'CRON_SECRET', 'METRICS_TOKEN'
foreach ($v in $obrigatorias) { if (-not $e[$v] -or $e[$v] -match '__') { $erros += "$v está vazia" } }
if (-not $Teste) {
  foreach ($v in 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SITE_URL') {
    if ($e[$v] -and $e[$v] -notmatch '^https://') { $erros += "$v precisa começar com https://" }
    if ($e[$v] -match '127\.0\.0\.1|localhost|host\.docker\.internal') { $erros += "$v aponta para o seu computador, não para a internet" }
  }
}
foreach ($v in 'CRON_SECRET', 'METRICS_TOKEN') { if ($e[$v] -and $e[$v].Length -lt 16) { $erros += "$v precisa ter pelo menos 16 caracteres" } }
if ([bool]$e['RECAPTCHA_SITE_KEY'] -ne [bool]$e['RECAPTCHA_SECRET_KEY']) { $erros += 'reCAPTCHA: preencha as DUAS chaves (do site e secreta) ou nenhuma' }
if ($erros) { $erros | ForEach-Object { Write-Host "   x $_" -ForegroundColor Red }; throw 'Corrija o arquivo de produção e rode de novo.' }
Write-Host "   site: $($e['NEXT_PUBLIC_SITE_URL']) | banco: $($e['NEXT_PUBLIC_SUPABASE_URL']) | captcha: $(if ($e['RECAPTCHA_SITE_KEY']) { 'ligado' } else { 'desligado' })"

Passo '2/4 Compilando o portal (Next.js standalone)'
# variáveis do processo têm prioridade sobre .env/.env.local na compilação; as NEXT_PUBLIC_* ficam gravadas no pacote
$env:NEXT_OUTPUT = 'standalone'
$env:NEXT_TELEMETRY_DISABLED = '1'
foreach ($v in 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SITE_URL') { Set-Item "env:$v" $e[$v] }
$env:NEXT_PUBLIC_ORG_SLUG = if ($e['NEXT_PUBLIC_ORG_SLUG']) { $e['NEXT_PUBLIC_ORG_SLUG'] } else { 'omos-ode' }
$ErrorActionPreference = 'Continue'
npm run build
$ok = $LASTEXITCODE -eq 0
$ErrorActionPreference = 'Stop'
if (-not $ok) { throw 'A compilação falhou (veja as mensagens acima).' }

Passo '3/4 Montando dist\ftp\portal'
$saida = Join-Path $raiz 'dist\ftp'
$pacote = Join-Path $saida 'portal'
if (Test-Path $saida) { Remove-Item $saida -Recurse -Force }
New-Item -ItemType Directory -Force $pacote | Out-Null
Copy-Item '.next\standalone\*' $pacote -Recurse -Force
New-Item -ItemType Directory -Force (Join-Path $pacote '.next') | Out-Null
Copy-Item '.next\static' (Join-Path $pacote '.next\static') -Recurse -Force
Copy-Item 'public' (Join-Path $pacote 'public') -Recurse -Force
# sem o otimizador de imagens o "sharp" não é usado; o binário dele é do sistema onde o pacote foi gerado
# (Windows) e não roda na hospedagem (Linux)
foreach ($d in 'node_modules\sharp', 'node_modules\@img') { $c = Join-Path $pacote $d; if (Test-Path $c) { Remove-Item $c -Recurse -Force } }
$nativos = @(Get-ChildItem $pacote -Recurse -Force -File -Include '*.node', '*.exe', '*.dll')
if ($nativos) { throw "Binário nativo no pacote (não roda em outro sistema): $($nativos.FullName -join ', ')" }
# nada de .env no pacote: os segredos ficam só no painel da hospedagem
Get-ChildItem $pacote -Recurse -Force -File | Where-Object { $_.Name -like '.env*' } | Remove-Item -Force

Passo '4/4 Conferindo que nenhum segredo está no pacote'
$segredos = @()
foreach ($arq in @($Arquivo, '.env', '.env.local')) {
  if (Test-Path $arq) {
    $x = LerEnv $arq
    foreach ($v in 'SUPABASE_SERVICE_ROLE_KEY', 'CRON_SECRET', 'METRICS_TOKEN', 'RECAPTCHA_SECRET_KEY', 'GOOGLE_CLIENT_SECRET', 'GRAFANA_ADMIN_PASSWORD') {
      if ($x[$v] -and $x[$v].Length -ge 12 -and $x[$v] -notmatch '__') { $segredos += [pscustomobject]@{ Nome = "$v ($arq)"; Valor = $x[$v] } }
    }
  }
}
$envNoPacote = @(Get-ChildItem $pacote -Recurse -Force -File | Where-Object { $_.Name -like '.env*' })
if ($envNoPacote) { throw "Arquivo .env dentro do pacote: $($envNoPacote.FullName -join ', ')" }
$arquivos = Get-ChildItem $pacote -Recurse -Force -File | Where-Object { $_.Length -lt 20MB }
foreach ($s in $segredos) {
  $achou = $arquivos | Select-String -SimpleMatch -Pattern $s.Valor -List | Select-Object -First 1
  if ($achou) { throw "SEGREDO no pacote: $($s.Nome) em $($achou.Path). O pacote NÃO pode ser enviado." }
}
Write-Host "   ok: nenhum .env e nenhum dos $($segredos.Count) valores secretos conhecidos aparece no pacote" -ForegroundColor Green
if (-not (Test-Path (Join-Path $pacote 'server.js'))) { throw 'server.js não foi gerado.' }

$zip = Join-Path $saida 'portal.zip'
Compress-Archive -Path (Join-Path $pacote '*') -DestinationPath $zip -Force
$total = (Get-ChildItem $pacote -Recurse -Force -File | Measure-Object Length -Sum)
Write-Host "`nPacote pronto:" -ForegroundColor Green
Write-Host "  Pasta : $pacote  ($($total.Count) arquivos, $([math]::Round($total.Sum / 1MB, 1)) MB)"
Write-Host "  Zip   : $zip  ($([math]::Round((Get-Item $zip).Length / 1MB, 1)) MB) — suba o zip e extraia no gerenciador de arquivos (mais rápido que FTP arquivo a arquivo)"
Write-Host '  Arquivo de inicialização no painel: server.js   |   Node.js 20.9 ou mais novo (recomendado 22)'
Write-Host '  Variáveis para cadastrar no painel (valores do seu arquivo de produção):'
Write-Host '    SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, METRICS_TOKEN, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,'
$extra = if ($e['RECAPTCHA_SITE_KEY']) { ', RECAPTCHA_SITE_KEY, RECAPTCHA_SECRET_KEY' } else { '' }
Write-Host ('    NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_ORG_SLUG, NODE_ENV=production, TZ=America/Sao_Paulo' + $extra)
Write-Host '  NUNCA envie o arquivo de produção (.env.producao) para a hospedagem.' -ForegroundColor Yellow
