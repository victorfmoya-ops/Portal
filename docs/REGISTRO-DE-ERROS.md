# Registro de erros — Portal Família Àṣẹ Omos Odé

Todo erro que apareceu durante a construção, a esteira e os testes fica anotado aqui:
**o que apareceu**, **por que aconteceu** e **como foi resolvido**. Serve de guia para
quando o mesmo problema voltar.

> Formato: data · etapa · sintoma → causa → solução.

## 27/10/2026 — Preparação do ambiente

### E01 · Versão anterior do portal sumida da pasta, mas ainda rodando no Docker
- **Sintoma:** `docker ps` mostrava `portal-web-1` e o Supabase `portal-omos-ode`, mas a
  pasta `Documents\portal` só tinha o protótipo e o vídeo.
- **Causa:** a versão anterior foi apagada (estava na Lixeira) porque não ficou igual ao vídeo.
- **Solução:** por decisão do responsável, o projeto recomeçou do zero. Os containers antigos
  foram **parados** (não apagados; os dados do banco antigo continuam no volume
  `supabase_db_portal-omos-ode`).

### E02 · Memória insuficiente (1,2 GB livres de 16 GB)
- **Sintoma:** pouca memória para Supabase + GitLab + SonarQube ao mesmo tempo.
- **Causa:** outros projetos rodando no Docker (Darkflow, Darkflow AI, nexdesk, transitos-pro).
- **Solução:** com autorização, esses containers foram parados (`docker stop`). Para religar:
  `docker start <nome>` ou `docker compose up -d` na pasta de cada projeto.

### E03 · `prom-client` marcado como descontinuado no `npm install`
- **Sintoma:** `npm warn deprecated prom-client@15.1.3: prom-client has been replaced by @prometheus-io/client`.
- **Causa:** a biblioteca de métricas mudou de nome (mesmo projeto oficial do Prometheus).
- **Solução:** troca por `@prometheus-io/client@0.16.1` (mesma API).

### E04 · `eslint@9` sem suporte
- **Sintoma:** `npm warn deprecated eslint@9.39.5: This version is no longer supported`.
- **Solução:** atualizado para `eslint@10.13.0`. O npm avisou `ERESOLVE overriding peer
  dependency` porque alguns plugins do `eslint-config-next` ainda declaram suporte só até a
  versão 9; o lint roda normalmente (verificado na esteira).

### E05 · Comando `docker inspect` com aspas quebrado no PowerShell
- **Sintoma:** `template parsing error: unterminated quoted string`.
- **Causa:** o PowerShell remove as aspas internas do template Go do `docker inspect`.
- **Solução:** usar o Git Bash para esse comando (aspas simples por fora).

## 27/10/2026 — Construção do portal

### E06 · Script de ambiente parava com `NativeCommandError` no primeiro passo
- **Sintoma:** `scripts\configurar-ambiente.ps1` terminava logo após "Subindo o Supabase" e o `.env.local` não era criado.
- **Causa:** no Windows PowerShell 5.1, com `$ErrorActionPreference = 'Stop'`, qualquer texto que um programa
  (o `npx`) escreve no *stderr* — mesmo um aviso inofensivo como "Stopped services" — vira erro fatal.
- **Solução:** antes de chamar programas externos o script muda para `Continue` e confere o **código de saída**
  (`$LASTEXITCODE`), que é o jeito certo de saber se o comando falhou.

### E07 · Tipos: "more than one relationship was found for 'membros'"
- **Sintoma:** `tsc` acusou `SelectQueryError` nas telas de Financeiro e Festas.
- **Causa:** `mensalidades` e `contribuicoes_festa` apontam para `membros` duas vezes (quem paga e quem decidiu);
  o Supabase não sabe qual relação usar.
- **Solução:** indicar a chave explícita: `membros!mensalidades_membro_id_fkey(nome)`.

### E08 · `proxyClientMaxBodySize` desconhecido no `next.config.ts`
- **Causa:** no Next.js 16.4 a opção fica dentro de `experimental`.
- **Solução:** movida para `experimental.proxyClientMaxBodySize` (junto do `serverActions.bodySizeLimit`), para aceitar
  comprovantes de até 10 MB.

### E09 · Lint: "Calling setState synchronously within an effect"
- **Causa:** o componente de aviso (toast) copiava a mensagem da URL para o estado dentro do `useEffect`, padrão
  desaconselhado no React 19 (renderizações em cascata).
- **Solução:** a mensagem passou a ser calculada direto da URL; o efeito só agenda o fechamento. Cada ação acrescenta
  `t=<carimbo>` na URL para a mesma mensagem poder aparecer de novo.

### E10 · Portal dizia "banco indisponível" (`fetch failed`) rodando fora do Docker
- **Sintoma:** `/api/health` respondia 503 e a página inicial abria com o conteúdo padrão.
- **Causa:** o Next.js também lê o arquivo `.env` (o do Docker), que tinha
  `SUPABASE_INTERNAL_URL=http://host.docker.internal:55421` — endereço que só existe **dentro** de um container.
- **Solução:** esse valor saiu do `.env` e ficou só no `docker-compose.yml` (com valor padrão). Fora do Docker o servidor
  usa a mesma URL do navegador.

### E11 · Aviso `"next start" does not work with "output: standalone"`
- **Solução:** o modo `standalone` só é ligado no build do Docker (`NEXT_OUTPUT=standalone` no Dockerfile); localmente
  `next start` funciona normalmente.

### E12 · Testes E2E: login "não terminava" e texto encontrado duas vezes
- **Sintoma 1:** o teste falhava em `/consentimento` — o login funcionou, mas o teste conferiu antes da tela do termo carregar.
  **Solução:** esperar explicitamente pela URL (`waitForURL`) e só então aceitar o termo.
- **Sintoma 2:** `strict mode violation: resolved to 2 elements` para "Presença obrigatória de todos os filhos".
  **Causa:** o texto aparece no selo da função **e** no rótulo do formulário. **Solução:** procurar só o selo (`.pill`).
  Nos dois casos o portal estava certo; o ajuste foi no teste.

### E13 · Testes de banco na esteira: imagem do Postgres sem `storage`, `auth.identities` e `auth.uid()` antigo
- **Sintoma:** na imagem `supabase/postgres` pura: `relation "storage.buckets" does not exist`,
  `must be owner of table users` e, depois, 11 testes falhando com "Acesso negado".
- **Causa:** no Supabase completo esses objetos são criados pelos serviços Auth e Storage; a imagem pura traz só o básico,
  e a versão antiga de `auth.uid()` lê o usuário de `request.jwt.claim.sub` (não de `request.jwt.claims`).
- **Solução:** `supabase/tests/ci/preparar-banco.sql` (só para a esteira) cria o mínimo — `auth.identities`, colunas do
  `auth.users`, `storage.buckets/objects`, `storage.foldername()` e a definição atual de `auth.uid()` — executado como
  `supabase_admin` (dono das tabelas). Resultado: 24/24 testes aprovados, igual ao `supabase test db` local.

### E14 · Avisos de quebra de linha (LF/CRLF) no primeiro `git add`
- **Risco:** com `core.autocrlf=true`, o `infra/agendador/rotinas.sh` iria para o container Linux com CRLF e quebraria.
- **Solução:** `.gitattributes` com `eol=lf` para tudo (e `crlf` só nos `.ps1`).

### E15 · Mensagem de commit com here-string falhou no PowerShell
- **Sintoma:** `did not match any file(s) known to git`.
- **Causa:** o fechamento `'@` precisa ficar sozinho na linha; havia `2>&1` logo depois.
- **Solução:** mensagem gravada num arquivo e `git commit -F arquivo`.

### E17 · Acentos quebrados na saída do script ("anÃ¡lise")
- **Causa:** o Windows PowerShell 5.1 lê arquivos `.ps1` sem BOM como ANSI; o script estava em UTF-8 sem BOM.
- **Solução:** todos os `scripts/*.ps1` salvos em **UTF-8 com BOM**.

## 27/10/2026 — Esteira (GitLab CI)

### E18 · Pipeline 1 falhou antes de começar ("script config should be a string")
- **Sintoma:** pipeline criado já como *failed*, sem nenhum job.
- **Causa:** no job `testes-banco`, a linha `echo "Testes de RLS aprovados: ..."` tinha **dois-pontos seguidos de espaço**;
  no YAML isso transforma a linha em chave/valor, não em texto.
- **Solução:** linha entre aspas simples. **Prevenção:** validar sempre com a API de lint do GitLab antes do push
  (`POST /projects/:id/ci/lint`), como passou a ser feito.

### E16 · Segredo local exibido num relatório
- **Sintoma:** o relatório do Trivy (varredura de segredos) mostrou parte do `.env` local, incluindo o `CRON_SECRET`
  de desenvolvimento.
- **Risco:** baixo (arquivo local, fora do Git, valor só de desenvolvimento), mas segredo exibido = segredo trocado.
- **Solução:** `CRON_SECRET` regenerado (veja "Trocar segredos" em CONFIGURACOES-E-PROCESSOS.md). Na esteira o Trivy roda
  sobre o código do Git, onde os `.env` não existem.
