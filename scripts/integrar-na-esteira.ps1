<#
.SYNOPSIS
  Integra o portal na esteira DevSecOps local (GitLab CE + Runner + SonarQube),
  o laboratório compartilhado que fica em C:\Darkflow\devsecops.
.DESCRIPTION
  1. Liga a esteira (se estiver parada) e espera GitLab e SonarQube ficarem prontos
  2. SonarQube: cria o projeto "portal-ase" e um token de análise
  3. GitLab: cria o projeto root/portal-ase e as variáveis de CI (segredos mascarados)
  4. git push para o GitLab LOCAL -> dispara o pipeline (.gitlab-ci.yml)
  Nada é enviado para a internet.
  Uso: powershell -ExecutionPolicy Bypass -File scripts\integrar-na-esteira.ps1
#>
param([string]$LabDir = 'C:\Darkflow\devsecops')
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
function Passo($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function LerEnv($arquivo) {
  $m = @{}
  Get-Content $arquivo | Where-Object { $_ -match '^\s*([A-Z0-9_]+)=(.*)$' } | ForEach-Object { $m[$Matches[1]] = $Matches[2].Trim() }
  $m
}
$lab = LerEnv (Join-Path $LabDir '.env')
$portal = LerEnv (Join-Path $raiz '.env')

Passo '1/4 Ligando a esteira (GitLab, Runner, SonarQube)'
$ErrorActionPreference = 'Continue'
docker compose -f (Join-Path $LabDir 'docker-compose.yml') --env-file (Join-Path $LabDir '.env') up -d 2>&1 | Out-Null
$ErrorActionPreference = 'Stop'
$limite = (Get-Date).AddMinutes(20)
do {
  $gl = docker inspect -f '{{.State.Health.Status}}' darkflow-devsecops-gitlab-1 2>$null
  try { $sq = (Invoke-RestMethod -TimeoutSec 5 http://localhost:9000/api/system/status).status } catch { $sq = 'iniciando' }
  Write-Host "   GitLab: $gl | SonarQube: $sq"
  if ($gl -eq 'healthy' -and $sq -eq 'UP') { break }
  Start-Sleep 15
} while ((Get-Date) -lt $limite)
if ($gl -ne 'healthy' -or $sq -ne 'UP') { throw 'A esteira não ficou pronta a tempo (veja docs/REGISTRO-DE-ERROS.md).' }

Passo '2/4 SonarQube: projeto portal-ase e token de análise'
$sonar = @{ Authorization = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:$($lab['SONAR_ADMIN_PASSWORD'])")) }
try { Invoke-RestMethod -Method Post -Headers $sonar 'http://localhost:9000/api/projects/create?project=portal-ase&name=Portal%20Familia%20Ase' | Out-Null } catch { }
try { Invoke-RestMethod -Method Post -Headers $sonar 'http://localhost:9000/api/user_tokens/revoke?name=gitlab-ci-portal-ase' | Out-Null } catch { }
$tokenSonar = (Invoke-RestMethod -Method Post -Headers $sonar 'http://localhost:9000/api/user_tokens/generate?name=gitlab-ci-portal-ase&type=PROJECT_ANALYSIS_TOKEN&projectKey=portal-ase').token

Passo '3/4 GitLab: projeto root/portal-ase e variáveis do CI'
$api = 'http://localhost:8929/api/v4'
$pat = $lab['GITLAB_API_TOKEN']
$ok = $false
if ($pat) { try { Invoke-RestMethod -Headers @{ 'PRIVATE-TOKEN' = $pat } "$api/user" | Out-Null; $ok = $true } catch { } }
if (-not $ok) {
  # token de 7 dias vencido: gera outro pelo console do GitLab (fica só no .env do laboratório)
  $pat = 'glpat-' + (-join ((1..16) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) }))
  $ruby = "u=User.find_by_username('root'); t=u.personal_access_tokens.create!(scopes: ['api','write_repository'], name: 'portal-ase-bootstrap', expires_at: 7.days.from_now); t.set_token('$pat'); t.save!"
  docker exec darkflow-devsecops-gitlab-1 gitlab-rails runner $ruby | Out-Null
  $linhas = @(Get-Content (Join-Path $LabDir '.env') | Where-Object { $_ -notmatch '^GITLAB_API_TOKEN=' }) + "GITLAB_API_TOKEN=$pat"
  [IO.File]::WriteAllLines((Join-Path $LabDir '.env'), $linhas, (New-Object Text.UTF8Encoding($false)))
}
$h = @{ 'PRIVATE-TOKEN' = $pat }
try { $projeto = Invoke-RestMethod -Headers $h "$api/projects/root%2Fportal-ase" }
catch { $projeto = Invoke-RestMethod -Method Post -Headers $h "$api/projects" -Body @{ name = 'portal-ase'; visibility = 'private'; initialize_with_readme = 'false'; default_branch = 'main' } }

$variaveis = @(
  @{ key = 'SONAR_HOST_URL'; value = 'http://sonarqube:9000'; masked = 'false' },
  @{ key = 'SONAR_TOKEN'; value = $tokenSonar; masked = 'true' },
  # ambiente de revisão usa o Supabase LOCAL (dados fictícios do seed)
  @{ key = 'REVIEW_SUPABASE_URL'; value = 'http://host.docker.internal:55421'; masked = 'false' },
  @{ key = 'REVIEW_SUPABASE_ANON_KEY'; value = $portal['NEXT_PUBLIC_SUPABASE_ANON_KEY']; masked = 'true' },
  @{ key = 'REVIEW_SUPABASE_SERVICE_ROLE_KEY'; value = $portal['SUPABASE_SERVICE_ROLE_KEY']; masked = 'true' }
)
foreach ($v in $variaveis) {
  $corpo = @{ key = $v.key; value = $v.value; masked = $v.masked; protected = 'false' }
  try { Invoke-RestMethod -Method Put -Headers $h "$api/projects/$($projeto.id)/variables/$($v.key)" -Body $corpo | Out-Null }
  catch { Invoke-RestMethod -Method Post -Headers $h "$api/projects/$($projeto.id)/variables" -Body $corpo | Out-Null }
}
Write-Host "   projeto: $($projeto.web_url)"

Passo '4/4 Enviando o código para o GitLab LOCAL (dispara o pipeline)'
$basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("root:$pat"))
$ErrorActionPreference = 'Continue'
git -C $raiz -c "http.extraHeader=Authorization: Basic $basic" push --force 'http://localhost:8929/root/portal-ase.git' 'HEAD:main' 2>&1 | Out-Null
if ($LASTEXITCODE) { throw 'Falha no git push para o GitLab local' }
Write-Host "`nPipeline : http://localhost:8929/root/portal-ase/-/pipelines" -ForegroundColor Green
Write-Host 'SonarQube: http://localhost:9000/dashboard?id=portal-ase' -ForegroundColor Green
