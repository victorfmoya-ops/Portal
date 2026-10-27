<#
.SYNOPSIS
  Cria (ou recria) um ADMINISTRADOR no banco LOCAL com senha aleatória e e-mail já confirmado.
.DESCRIPTION
  Uso: powershell -ExecutionPolicy Bypass -File scripts\criar-admin.ps1 -Email voce@exemplo.com -Nome "Seu nome"
  A senha aparece UMA vez na tela e não é gravada em arquivo. Rode de novo depois de "npx supabase db reset".
  Somente para o ambiente local (em produção o admin é cadastrado como descrito em CONFIGURACOES-E-PROCESSOS.md).
#>
param(
  [Parameter(Mandatory = $true)][string]$Email,
  [string]$Nome = 'Administrador(a)'
)
$ErrorActionPreference = 'Stop'
if ($Email -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') { throw 'E-mail inválido' }
$bytes = New-Object byte[] 18
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$senha = 'Ase' + (([Convert]::ToBase64String($bytes) -replace '[^A-Za-z0-9]', '').Substring(0, 12)) + '7'
$email = $Email.ToLower().Replace("'", "''")
$nome = $Nome.Replace("'", "''")

$sql = @"
do `$`$
declare v_user uuid; v_org uuid := (select id from public.organizacoes where slug = 'omos-ode');
begin
  select id into v_user from auth.users where email = '$email';
  if v_user is null then
    v_user := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', v_user, 'authenticated', 'authenticated', '$email',
      extensions.crypt('$senha', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_user, v_user::text, jsonb_build_object('sub', v_user::text, 'email', '$email', 'email_verified', true), 'email', now(), now(), now());
  else
    update auth.users set encrypted_password = extensions.crypt('$senha', extensions.gen_salt('bf')), email_confirmed_at = coalesce(email_confirmed_at, now()) where id = v_user;
  end if;
  insert into public.membros (org_id, user_id, email, nome, papel)
  values (v_org, v_user, '$email', '$nome', 'admin')
  on conflict (org_id, email) do update set papel = 'admin', status = 'ativo', user_id = excluded.user_id;
end `$`$;
"@

$sql | docker exec -i supabase_db_portal-ase psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q
if ($LASTEXITCODE -ne 0) { throw 'Não consegui criar o administrador (o Supabase local está ligado?)' }
Write-Host "`nAdministrador pronto no ambiente local:" -ForegroundColor Green
Write-Host "  Portal : http://127.0.0.1:3020/entrar  (ou :3000 com npm run dev)"
Write-Host "  E-mail : $Email"
Write-Host "  Senha  : $senha   (anote agora; troque em 'Esqueci a senha' se quiser)"
