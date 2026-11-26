# Publicar o portal numa hospedagem com Node.js (por FTP)

Passo a passo para colocar o portal no ar numa hospedagem que roda **Node.js** — por exemplo cPanel com
**“Setup Node.js App”**, Hostinger com Node.js ou um VPS. O envio dos arquivos é por **FTP** (de preferência
**FTPS/SFTP**) ou pelo gerenciador de arquivos do painel.

> O portal **não roda** em hospedagem só HTML/PHP: login, área restrita, comprovantes e rotinas precisam do Node.js.

## 🍳 Receita rápida (resumo de tudo abaixo)

| # | Faça | Onde | Detalhe |
|---|---|---|---|
| 1 | Criar o projeto Supabase (região São Paulo) | supabase.com | seção 1 |
| 2 | `npx supabase link --project-ref <ref>` e `npx supabase db push` | PowerShell, na pasta do projeto | aplica as 7 migrations (inclui a regra dos comprovantes) |
| 3 | Rodar `supabase/seed.sql` no SQL Editor | painel do Supabase | só dados reais da casa |
| 4 | Ajustar *Site URL*, *Redirect URLs*, confirmação de e-mail e SMTP | Supabase → Authentication | seção 1 |
| 5 | Copiar `.env.example` → `.env.producao` e preencher | PC | seção 2 (nunca vai para o Git nem para o FTP) |
| 6 | `powershell -ExecutionPolicy Bypass -File scripts\gerar-pacote-ftp.ps1` | PC | gera `dist\ftp\portal.zip` e confere que não tem segredo |
| 7 | Criar a aplicação Node.js 22, arquivo `server.js`, pasta fora do `public_html` | painel da hospedagem | seção 4 |
| 8 | Cadastrar as variáveis de ambiente | painel da hospedagem | seção 4 |
| 9 | Subir `portal.zip` por **FTPS/SFTP**, extrair, apagar o zip, **Restart** | FileZilla ou gerenciador de arquivos | seção 5 |
| 10 | Cadastrar os 2 Cron Jobs (limpar comprovantes e gerar mensalidades) | painel da hospedagem | seção 6 |
| 11 | Criar o primeiro administrador | Supabase → SQL Editor | seção 7 |
| 12 | `$env:BASE="https://seu-dominio.com.br"; node infra\ci\smoke.mjs` | PC | tem que passar tudo (seção 8) |

**Regra dos comprovantes (vale em produção):** o filho envia o comprovante da mensalidade ou da ajuda na festa,
mas **só o administrador vê** (tela *Administração → Comprovantes por mês*). Cada comprovante fica guardado
**até 6 meses** após o envio e é apagado pela rotina `limpar-comprovantes`; recusados ou substituídos são apagados logo.

## O que você precisa antes

| Item | Onde | Observação |
|---|---|---|
| Hospedagem com **Node.js 20.9 ou mais novo** (recomendado **22**) | painel da hospedagem | procure “Node.js”, “Setup Node.js App” ou “Aplicações Node” |
| **Domínio** com **HTTPS** (SSL) ativo | painel da hospedagem (AutoSSL/Let's Encrypt é grátis) | sem HTTPS o login fica inseguro |
| **Projeto Supabase** na nuvem (banco, login e arquivos) | https://supabase.com (plano gratuito para começar) | região **South America (São Paulo)** |
| Node.js e o projeto no seu PC | este repositório | é no PC que o pacote é gerado |

## 1. Banco de dados (Supabase na nuvem) — uma vez só

1. Crie o projeto no Supabase (região São Paulo) e guarde a **senha do banco**.
   *(Alternativa: `infra/terraform/producao` cria o projeto e a configuração de login por código.)*
2. No PC, na pasta do projeto, aplique a estrutura do banco:
   ```powershell
   npx supabase login
   npx supabase link --project-ref <ref-do-projeto>     # o ref está na URL do painel do Supabase
   npx supabase db push                                  # aplica supabase/migrations (tabelas, segurança, arquivos)
   ```
3. Carregue os **dados reais da casa**: no painel do Supabase → **SQL Editor**, cole o conteúdo de
   `supabase/seed.sql` e execute. (Ele tem só dados reais: casa, site, grupos, locais, rodízio e agenda.
   **Nunca** rode `infra/ci/dados-de-teste.sql` em produção.)
4. **Authentication → URL Configuration**: *Site URL* = `https://seu-dominio.com.br`;
   *Redirect URLs* = `https://seu-dominio.com.br/**`.
5. **Authentication → Providers → Email**: deixe **“Confirm email”** ligado.
   **Authentication → SMTP**: configure um SMTP próprio (o envio padrão do Supabase tem limite baixo).
6. Login com Google (opcional): siga `docs/GUIA-LOGIN-GOOGLE.md` usando o domínio de produção.
7. Anote em **Project Settings → API**: a *Project URL*, a chave **anon** (pública) e a **service_role** (segredo).

## 2. Arquivo de produção no seu PC

Copie `.env.example` para **`.env.producao`** (o git ignora esse arquivo) e preencha:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase (`https://….supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave **anon** |
| `NEXT_PUBLIC_SITE_URL` | `https://seu-dominio.com.br` |
| `NEXT_PUBLIC_ORG_SLUG` | `omos-ode` |
| `SUPABASE_SERVICE_ROLE_KEY` | chave **service_role** (segredo) |
| `CRON_SECRET` / `METRICS_TOKEN` | textos aleatórios com 32+ caracteres (gere novos; não reaproveite os do PC) |
| `RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` | opcional — caixinha “Não sou um robô” (ver `CONFIGURACOES-E-PROCESSOS.md`, seção 5) |

Para gerar um texto aleatório no PowerShell:
`-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})`

## 3. Gerar o pacote

```powershell
powershell -ExecutionPolicy Bypass -File scripts\gerar-pacote-ftp.ps1
```

O script **recusa** valores inseguros (sem `https`, apontando para o seu PC, campos vazios), compila o portal com
os dados de produção e cria:

- `dist\ftp\portal\` — a aplicação pronta (`server.js`, `.next`, `public`, `node_modules` mínimos);
- `dist\ftp\portal.zip` — o mesmo conteúdo compactado.

No fim ele confere que **nenhum `.env` e nenhum valor secreto** foi parar no pacote e que não há binário de
Windows dentro (o pacote roda em Linux). Se algo aparecer, ele para e não gera o pacote.

## 4. Criar a aplicação Node.js no painel

No cPanel: **Setup Node.js App → Create Application** (em outros painéis os nomes são parecidos):

| Campo | Valor |
|---|---|
| Node.js version | **22** (mínimo 20.9) |
| Application mode | **Production** |
| Application root | uma pasta **fora** do `public_html`, por exemplo `portal` |
| Application URL | o seu domínio |
| Application startup file | **`server.js`** |

Em **Environment variables**, cadastre (valores do seu `.env.producao`):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ORG_SLUG`,
`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `METRICS_TOKEN`, `NODE_ENV=production`, `TZ=America/Sao_Paulo`
e, se usar o captcha, `RECAPTCHA_SITE_KEY` e `RECAPTCHA_SECRET_KEY`.

> **Não** clique em “Run NPM Install”: o pacote já traz tudo o que precisa.
> **Hostinger e painéis que pedem repositório Git / comando de build:** prefira enviar o pacote pronto
> (sem build no servidor). Se o painel só aceitar build próprio, ele precisa das mesmas variáveis **antes** do build.

## 5. Enviar os arquivos

- **Mais rápido:** envie `dist\ftp\portal.zip` para a pasta da aplicação (FTP ou gerenciador de arquivos) e use
  **Extrair** no gerenciador de arquivos. Depois apague o `.zip` do servidor.
- **Por FTP arquivo a arquivo:** envie **o conteúdo** de `dist\ftp\portal\` (incluindo a pasta oculta `.next`).
  No FileZilla, ative *Servidor → Forçar exibição de arquivos ocultos*.
- Use **FTPS ou SFTP** (FTP comum manda usuário e senha sem criptografia).
- **Nunca** envie `.env.producao`, `.env` ou `.env.local`.

Depois: **Restart** na aplicação Node.js do painel.

## 6. Rotinas automáticas (Cron Jobs do painel)

1. Guarde o `CRON_SECRET` num arquivo protegido na sua pasta pessoal do servidor (assim ele não fica à mostra na
   lista de Cron Jobs do painel). No **Terminal** do painel:
   ```bash
   printf '%s' 'COLE-AQUI-O-CRON_SECRET' > ~/.portal_cron_secret && chmod 600 ~/.portal_cron_secret
   ```
   (sem terminal: crie o arquivo `.portal_cron_secret` fora do `public_html` pelo gerenciador de arquivos,
   com o valor e permissão **600**).
2. Cadastre as duas rotinas em **Cron Jobs**:

| Quando | Comando |
|---|---|
| a cada 15 minutos (`*/15 * * * *`) | `curl -fsS -X POST -H "Authorization: Bearer $(cat ~/.portal_cron_secret)" https://seu-dominio.com.br/api/cron/limpar-comprovantes` |
| a cada 6 horas (`0 */6 * * *`) | `curl -fsS -X POST -H "Authorization: Bearer $(cat ~/.portal_cron_secret)" https://seu-dominio.com.br/api/cron/gerar-mensalidades` |

A primeira apaga os comprovantes recusados/substituídos e os com mais de 6 meses (privacidade); a segunda garante as mensalidades do mês
(o banco também lança no dia 1º via pg_cron, se disponível no plano).

## 7. Primeiro administrador

1. Supabase → **SQL Editor**:
   ```sql
   insert into public.membros (org_id, email, nome, papel)
   select id, 'email-do-admin@exemplo.com', 'Nome do Admin', 'admin' from public.organizacoes where slug = 'omos-ode';
   ```
2. No site: **Área restrita → Primeiro acesso (criar senha)** com esse e-mail → confirmar pelo e-mail recebido.
3. Os demais filhos e administradores são cadastrados pelo próprio painel (Administração → Filhos).

## 8. Conferir depois de publicar

No PC, rode o teste de fumaça contra o site no ar:
```powershell
$env:BASE = "https://seu-dominio.com.br"; node infra\ci\smoke.mjs
```
Tem que mostrar **“Todas as verificações passaram”** (site, banco, área restrita protegida, rotas técnicas
fechadas e cabeçalhos de segurança). Confira também: o cadeado do HTTPS, entrar e sair da área restrita, e o
captcha (se ligado).

## 9. Atualizar o site depois

1. `git pull` / mudanças no PC → `scripts\gerar-pacote-ftp.ps1`
2. Se houver migration nova: `npx supabase db push`
3. Envie o novo pacote (substituindo os arquivos) → **Restart** no painel → teste de fumaça.

## Segurança — resumo

- Segredos (service_role, CRON_SECRET, METRICS_TOKEN, chave secreta do captcha) ficam **só** nas variáveis do
  painel. O pacote é conferido para não conter nenhum deles.
- A pasta da aplicação fica **fora** do `public_html` (o servidor Node é quem entrega as páginas).
- HTTPS obrigatório: o portal envia HSTS e o cookie de sessão vira `Secure` automaticamente com `https://`.
- Monitoramento: o `/api/health` responde `{"status":"ok","banco":"up"}`; use um monitor de disponibilidade
  gratuito (ex.: UptimeRobot) apontando para ele. Prometheus/Grafana do projeto são opcionais em produção.
