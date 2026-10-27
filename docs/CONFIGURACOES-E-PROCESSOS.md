# Configurações e processos — Portal Família Àṣẹ Omos Odé

Documento técnico de referência: **como o projeto está montado, como rodar, configurar, testar,
publicar e manter**. Para a apresentação ao cliente veja `APRESENTACAO-CLIENTE.md`; para problemas
já resolvidos, `REGISTRO-DE-ERROS.md`.

---

## 1. Visão geral da arquitetura

```
 Navegador / celular (PWA)
        │  HTTPS
        ▼
 ┌──────────────────────┐   Server Actions / rotas    ┌──────────────────────────────┐
 │  Portal (Next.js 16) │ ──────────────────────────▶ │  Supabase                    │
 │  site público + área │   (sessão do usuário: RLS)   │  • Postgres + RLS + funções  │
 │  restrita + /api/*   │                              │  • Auth (Google / e-mail)    │
 └─────────┬────────────┘                              │  • Storage (comprovantes,    │
           │ /api/cron (token)                         │    galeria)                  │
 ┌─────────┴────────────┐                              └──────────────────────────────┘
 │ Agendador (alpine)   │  limpa comprovantes, lança mensalidades
 └──────────────────────┘
 Prometheus ◀── /api/metrics (token) + Blackbox (sondas) ──▶ Grafana (painel) + alertas
```

- **Toda regra de permissão está no banco** (RLS + funções `SECURITY DEFINER`). A tela só mostra; quem
  barra é o Postgres. Mesmo que alguém chame a API direto, o filho não grava fora das 3 ações permitidas.
- O servidor usa a **sessão do usuário** em todas as telas. A chave de serviço (que ignora a RLS) só é
  usada pelas rotinas automáticas e para remover arquivo órfão.

## 2. Tecnologias e versões

| Camada | Tecnologia |
|---|---|
| App | Next.js 16.4.3 (App Router, Server Actions, `proxy.ts`), React 19.3, TypeScript 5.9, Zod 4 |
| Banco / login / arquivos | Supabase (Postgres 17, Auth, Storage) — local via Supabase CLI 2.122 |
| Métricas | `@prometheus-io/client` 0.16, Prometheus v3.15.1, Blackbox v0.27, Grafana 13.0.2 |
| Testes | Vitest 5 (unitários), pgTAP (RLS), Playwright 1.64 (ponta a ponta) |
| Esteira | GitLab CE + Runner (Docker), Gitleaks, Semgrep, Trivy, npm audit, SonarQube, OWASP ZAP |
| Infra como código | Terraform 1.13 (providers `kreuzwerker/docker` 3.9 e `supabase/supabase` 1.11) |

## 3. Estrutura de pastas

| Pasta / arquivo | Conteúdo |
|---|---|
| `app/` | Páginas e rotas. `page.tsx` = site; `agenda/` = calendário público; `entrar/`, `primeiro-acesso/`, `esqueci-senha/`, `redefinir-senha/`, `auth/*` = login; `app/filho/*` e `app/admin/*` = área restrita; `api/health`, `api/metrics`, `api/cron/[tarefa]` |
| `components/` | Moldura do app (`AppShell`), calendário, avisos, formulários reutilizáveis |
| `lib/` | Supabase (`supabase/`), sessão e permissões (`sessao.ts`), validação (`validacao.ts`), arquivos (`arquivos.ts`), datas, métricas |
| `supabase/migrations/` | Banco: `…001` tabelas · `…002` RLS · `…003` regras de negócio · `…004` arquivos e automação |
| `supabase/seed.sql` | Dados **fictícios** de desenvolvimento (contas demo) |
| `supabase/tests/` | Testes pgTAP de permissões; `ci/preparar-banco.sql` só para a esteira |
| `tests/unit`, `tests/e2e` | Vitest e Playwright |
| `infra/agendador` | Rotinas automáticas |
| `infra/monitoramento` | Prometheus, alertas, Blackbox, Grafana (fonte e painel) |
| `infra/terraform/local` · `producao` | Receitas Terraform |
| `infra/ci/smoke.mjs` | Teste de fumaça do ambiente de revisão |
| `scripts/` | `configurar-ambiente.ps1` (ambiente) · `integrar-na-esteira.ps1` (GitLab) |
| `referencia/` | Protótipo e vídeo originais (**dados reais — fora do Git**) |

## 4. Portas (todas só em 127.0.0.1)

| Serviço | Endereço |
|---|---|
| Portal em desenvolvimento (`npm run dev`) | http://127.0.0.1:3000 |
| Portal no Docker | http://127.0.0.1:3020 |
| Supabase API | http://127.0.0.1:55421 |
| Supabase Postgres | 127.0.0.1:55422 |
| Supabase Studio (ver o banco) | http://127.0.0.1:55423 |
| Caixa de e-mails de teste (Mailpit) | http://127.0.0.1:55424 |
| Prometheus | http://127.0.0.1:9096 |
| Grafana | http://127.0.0.1:3006 (usuário `admin`, senha `GRAFANA_ADMIN_PASSWORD` do `.env`) |
| GitLab (esteira) | http://localhost:8929 |
| SonarQube | http://localhost:9000 |

## 5. Variáveis de ambiente

Geradas por `scripts/configurar-ambiente.ps1`: **`.env.local`** (desenvolvimento) e **`.env`** (Docker).
Nunca vão para o Git (`.gitignore`). Modelo comentado em `.env.example`.

| Variável | Pública? | Para quê |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | sim | Endereço do Supabase visto pelo navegador |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sim | Chave pública (só enxerga o que a RLS libera) |
| `NEXT_PUBLIC_SITE_URL` | sim | Endereço do portal (links dos e-mails, retorno do Google) |
| `NEXT_PUBLIC_ORG_SLUG` | sim | Qual casa o site mostra (`omos-ode`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **segredo** | Rotinas automáticas (ignora RLS) |
| `SUPABASE_INTERNAL_URL` | — | Só no Docker (definida no `docker-compose.yml`) |
| `CRON_SECRET` | **segredo** | Protege `/api/cron/*` |
| `METRICS_TOKEN` | **segredo** | Protege `/api/metrics` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | segredo | Login com Google (ver `GUIA-LOGIN-GOOGLE.md`) |
| `GRAFANA_ADMIN_PASSWORD` | **segredo** | Senha do Grafana |

### Trocar segredos
1. Apague a linha do segredo em `.env.local` **e** em `.env`.
2. Rode `scripts\configurar-ambiente.ps1` (gera um novo valor aleatório).
3. `docker compose up -d` (recria os containers com o valor novo).

## 6. Como rodar

### Primeira vez (um comando)
```powershell
cd C:\Users\Victor\Documents\portal
npm ci
powershell -ExecutionPolicy Bypass -File scripts\configurar-ambiente.ps1   # sobe o Supabase e gera os .env
```

### Desenvolvimento
```powershell
npm run dev            # http://127.0.0.1:3000
```

### Docker completo (portal + agendador + monitoramento)
```powershell
docker compose up -d --build     # http://127.0.0.1:3020 ; Grafana 3006 ; Prometheus 9096
docker compose ps                # todos "Up" e o web "healthy"
docker compose logs web --tail 50
```

### Contas de demonstração (somente local, dados fictícios)
| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin@exemplo.test` | `Axe2026demo` |
| Filho (Grupo 1) | `filho1@exemplo.test` | `Axe2026demo` |

### Zerar o banco local (volta aos dados de exemplo)
```powershell
npx supabase db reset
```

## 7. Banco de dados

### Tabelas principais
`organizacoes`, `grupos`, `membros` (cadastro + papel filho/admin + status), `fichas` (Cadastro Geral e
de filho), `locais`, `rodadas`, `rodada_locais`, `escolhas_limpeza`, `eventos` (toques), `funcoes` +
`funcao_responsaveis`, `mensalidades`, `festas` + `contribuicoes_festa`, `comprovantes`,
`caixa_lancamentos`, `areas_restritas` + `area_restrita_pessoas`, `midia` (galeria), `site_config`,
`consentimentos`, `log_auditoria`.

### Matriz de permissões (garantida pela RLS)

| Recurso | Visitante | Filho | Admin |
|---|---|---|---|
| Site, agenda pública de toques, galeria | ler | ler | editar |
| Próprio cadastro e ficha | — | **ler** | editar todos |
| Colegas do grupo (só nomes) | — | ler | gerenciar |
| Rodízio do grupo / locais | — | ler | gerenciar (marca conclusão) |
| **Dia da limpeza na rodada do grupo** | — | **escolher/trocar o próprio** (até 1 mês antes) | definir/alterar qualquer um, mudar prazo |
| Funções e toques (calendários) | — | ler | cadastrar |
| **Comprovante de mensalidade** | — | **enviar o próprio** | confirmar/recusar |
| **Comprovante de festa** | — | **enviar o próprio** | confirmar/recusar |
| Aniversariantes (nome + dia/mês) | — | ler | gerenciar |
| Caixa, áreas restritas, auditoria | — | — | ler/gerenciar |

### Funções do banco (regras de negócio)
| Função | Quem | O que faz |
|---|---|---|
| `vincular_meu_cadastro()` | logado | Liga a conta (Google ou e-mail **confirmado**) ao cadastro com o mesmo e-mail |
| `registrar_consentimento(versao)` | filho/admin | Aceite do termo (LGPD) |
| `escolher_dia_limpeza(rodada, dia)` | filho | Só rodada do **seu** grupo, dia dentro da semana, **até o prazo** (início − 1 mês) |
| `enviar_comprovante(tipo, ref, caminho, data)` | filho | Confere dono da cobrança, pasta do arquivo, arquivo existente; coloca **em análise** |
| `decidir_pagamento(tipo, id, decisão, motivo)` | admin | Confirma / recusa (motivo obrigatório) / desfaz; libera o comprovante para remoção |
| `gerar_mensalidades(mês)` | admin / rotina | Lança a mensalidade do mês para cada filho ativo (idempotente) |
| `gerar_rodizio(início, qtd, intervalo)` | admin | Cria rodadas quinzenais alternando os grupos |
| `limpezas_por_filho(ano)` / `minhas_limpezas_no_ano(ano)` | admin / filho | Meta de 5 limpezas por ano |
| `colegas_do_grupo()`, `escolhas_da_rodada()`, `aniversariantes()` | logado | Leituras com dados mínimos |

Gatilhos: ficha criada junto com o cadastro; título com "Oro" ⇒ presença obrigatória; festa nova ⇒
contribuição lançada para todos os filhos; só admin altera papel/status/grupo (defesa extra).

### Mudanças no banco (processo)
1. Crie um arquivo **novo** em `supabase/migrations/` (`AAAAMMDDHHMMSS_descricao.sql`). Nunca edite uma migration já aplicada.
2. Toda tabela nova: `org_id`, RLS ligada, policies explícitas e **nenhuma escrita direta do filho**.
3. `npx supabase db reset` → `npm run db:types` → `npm run db:test`.

## 8. Arquivos (Storage)

| Bucket | Acesso | Regras |
|---|---|---|
| `comprovantes` | **privado** | PDF/imagem, até 10 MB, pasta `<casa>/<filho>/<tipo>/<cobrança>/`; filho só envia na própria pasta; admin abre por link temporário de 2 min |
| `galeria` | público | JPG/PNG/WEBP até 5 MB; só admin publica |

Validação em 3 camadas: extensão, tipo declarado **e assinatura real do arquivo** (primeiros bytes), no
servidor; o bucket recusa outros tipos/tamanhos; a função do banco confere o dono e a pasta.

## 9. Automação

| Rotina | Quando | Onde |
|---|---|---|
| Apagar comprovantes já analisados (privacidade) | a cada 15 min | agendador → `POST /api/cron/limpar-comprovantes` |
| Lançar mensalidades do mês | a cada 6 h (idempotente) + dia 1º às 03:05 (pg_cron) | agendador → `POST /api/cron/gerar-mensalidades` e `cron.schedule` no banco |
| Ambiente de desenvolvimento | sob demanda | `scripts/configurar-ambiente.ps1` |
| Integração na esteira | sob demanda | `scripts/integrar-na-esteira.ps1` |
| Pipeline completo | a cada `git push` | `.gitlab-ci.yml` |

As rotas `/api/cron/*` exigem `Authorization: Bearer <CRON_SECRET>` (comparação em tempo constante).

## 10. Monitoramento

- **Grafana → pasta "Portal Família Àṣẹ"**: site no ar, banco, comprovantes apagados, rotinas com erro,
  tempo de resposta, memória e event loop.
- **Alertas (Prometheus → Alerts)**: `PortalForaDoAr` (crítica), `BancoIndisponivel` (crítica),
  `RotinaAutomaticaFalhando` (alta), `RespostaLenta` (média), `MemoriaAltaPortal` (média). Cada alerta traz
  "o que fazer".
- **Sondas (Blackbox)**: `/`, `/api/health`, `/agenda` e o Auth do Supabase.
- **Health check**: `GET /api/health` → `{"status":"ok","banco":"up"}` (usado pelo Docker e pela esteira).

## 11. Esteira DevSecOps (GitLab CI)

| Etapa | Ferramenta | Bloqueia quando |
|---|---|---|
| segredos | Gitleaks (histórico completo) | qualquer segredo |
| sast | Semgrep (TypeScript, Next.js, React, OWASP Top 10, SQL injection, secrets) | achado ERROR (alto/crítico) |
| sca | Trivy fs (dependências, Dockerfile/compose/Terraform, segredos) + SBOM CycloneDX; npm audit | HIGH/CRITICAL |
| testes | lint, tipos, Vitest (cobertura), build; **pgTAP de RLS** num Postgres descartável | qualquer falha |
| qualidade | SonarQube (Quality Gate "Crítico e Alto") | issue bloqueadora/alta |
| build | Docker (imagem única por commit) | falha de build |
| scan-imagem | Trivy image | HIGH/CRITICAL |
| review | sobe o portal do zero + teste de fumaça (7 verificações) | qualquer falha |
| dast | OWASP ZAP baseline | alerta Alto |
| limpeza | remove ambiente e imagem | — |

Médio, baixo e informativo **são registrados** (log e relatórios) e não bloqueiam.

Rodar: `powershell -ExecutionPolicy Bypass -File scripts\integrar-na-esteira.ps1` →
http://localhost:8929/root/portal-ase/-/pipelines. A esteira usa o Supabase local para o ambiente de revisão
(o Supabase precisa estar ligado).

## 12. Testes

| Tipo | Comando | O que cobre |
|---|---|---|
| Unitários | `npm test` / `npm run test:cov` | datas e fuso, validação de arquivos (assinatura), formulários |
| Banco (RLS) | `npm run db:test` | 24 verificações da matriz de permissões |
| Ponta a ponta | `npm run test:e2e` (portal rodando em :3000) | site, login, filho escolhe dia e envia comprovante, arquivo falso recusado, admin confirma, caixa, calendário |
| Fumaça | `node infra/ci/smoke.mjs` (`BASE=...`) | saúde, páginas, proteção das rotas, cabeçalhos |

Com `E2E_TELAS=docs/telas` o Playwright salva as capturas usadas na apresentação.

## 13. Infraestrutura como código (Terraform)

- `infra/terraform/local`: recria o ambiente Docker (rede, imagem, portal, agendador, monitoramento).
  `terraform init && terraform plan -var-file=local.tfvars` → **9 recursos** (validado). Para aplicar, pare o
  compose antes (mesmas portas).
- `infra/terraform/producao`: projeto Supabase na nuvem (região São Paulo) + configurações de login.
  **Validado, não aplicado** — exige autorização (pode gerar custo). Token via `SUPABASE_ACCESS_TOKEN`.

Rodar sem instalar o Terraform:
```powershell
docker run --rm -v "${PWD}\infra\terraform\local:/w" -w /w hashicorp/terraform:1.13 validate
```

## 14. Segurança (resumo)

- RLS em todas as tabelas; filho sem nenhuma policy de escrita; funções com `search_path` fixo e checagem de permissão.
- Vínculo de conta só com e-mail **confirmado** (impede tomar o cadastro de outra pessoa).
- Senhas: mínimo 8, letras e números; troca de senha exige login recente.
- Cabeçalhos: CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP e CORP; sem `X-Powered-By`.
- Imagem Docker sem npm/yarn/corepack (Trivy: 0 vulnerabilidades altas/críticas).
- OWASP ZAP: 0 alto; médios/baixos avaliados um a um em `REGISTRO-DE-ERROS.md` (seção "Resultado do OWASP ZAP").
- Links só `https://`; HTML escapado pelo React (sem `innerHTML`); redirecionamentos só para caminhos internos.
- Containers: usuário sem privilégio, sistema de arquivos só leitura, `cap_drop: ALL`, `no-new-privileges`, limites de memória.
- Comprovantes privados e **apagados** após a análise; auditoria somente leitura.
- Minimização (LGPD): aniversário só dia/mês; sem dados bancários/cartão/Pix; termo de consentimento versionado.

## 15. Publicação em produção (quando autorizado)

1. Criar o Supabase na nuvem (painel ou `infra/terraform/producao`).
2. `npx supabase link --project-ref <ref>` → `npx supabase db push` (aplica as migrations; **sem** o seed).
3. Configurar Auth (Site URL, Redirect URLs, Google — `GUIA-LOGIN-GOOGLE.md`), SMTP próprio para os e-mails.
4. Hospedar o portal: imagem Docker (`Dockerfile`) num servidor com HTTPS (nginx/Caddy) ou Vercel, com as
   variáveis da seção 5 (valores de produção).
5. Agendar as rotinas (`infra/agendador/rotinas.sh` ou cron do provedor) e o monitoramento.
6. Cadastrar o primeiro administrador direto no banco (SQL Editor):
   `insert into membros (org_id, email, nome, papel) values ('<org>', '<email>', '<nome>', 'admin');`
7. Revisão de segurança/LGPD antes de dados reais; backup automático do banco ligado.

## 16. Rotina do administrador

- Cadastrar filhos (e-mail é a chave do acesso) e grupos.
- Gerar as rodadas do ano (Rodízio → Gerar novas rodadas) e acompanhar a meta de 5 limpezas.
- Cadastrar funções (com responsáveis) e toques nos calendários.
- Analisar comprovantes (Início mostra quantos estão pendentes) e lançar entradas/saídas no caixa.
- Publicar fotos e vídeos das festas e ajustar a aparência do site.
