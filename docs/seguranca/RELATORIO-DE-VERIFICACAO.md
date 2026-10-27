# Relatório de verificação de segurança e do sistema — 27/10/2026

Verificação completa antes de publicar o portal (branch `versao-2`). Ferramentas nas **mesmas versões da esteira**
(`.gitlab-ci.yml`), rodadas no ambiente local, mais testes manuais de ataque.

## Resultado geral: aprovado — 0 achado alto ou crítico

| # | Verificação | Ferramenta | Resultado |
|---|---|---|---|
| 1 | Segredos no histórico do git | Gitleaks 8.30.1 | **0 vazamentos** |
| 2 | Análise do código (SAST: TypeScript, Next.js, React, OWASP Top 10, SQL injection, segredos) | Semgrep 1.182.1 | **0 achados** |
| 3 | Bibliotecas vulneráveis | npm audit | **0 vulnerabilidades** |
| 4 | Dependências, configurações (Dockerfile, compose, Terraform) e segredos | Trivy 0.76.1 (fs) | **0 vulnerabilidades, 0 configurações erradas** ¹ |
| 5 | Imagem Docker do portal | Trivy 0.76.1 (image) | **0 vulnerabilidades** |
| 6 | Infraestrutura como código | `terraform fmt` + `validate` 1.13 | **válido** |
| 7 | Tipos e padrão de código | TypeScript + ESLint | **0 erros** |
| 8 | Testes unitários | Vitest | **30/30** |
| 9 | Permissões do banco (RLS e funções) | pgTAP | **37/37** |
| 10 | Ponta a ponta no navegador (filho e admin) | Playwright | **4/4** |
| 11 | Teste de fumaça (saúde, páginas, proteção, cabeçalhos) | `infra/ci/smoke.mjs` | **7/7** (Docker e pacote FTP) |
| 12 | Teste de invasão automático (DAST) | OWASP ZAP 2.17.0 baseline | **0 alto**, 3 médios, 1 baixo, 4 informativos ² |
| 13 | Ataques manuais à API do banco (visitante e filho) | script com a chave pública | **31/31 bloqueados** |
| 14 | Ataques manuais ao portal (filho logado, CSRF, redirecionamento, tokens) | script no navegador | **12/12 bloqueados** |
| 15 | Captcha “Não sou um robô” | chaves de teste do Google | **5 cenários ok** |
| 16 | Pacote FTP | `scripts/gerar-pacote-ftp.ps1` + `node server.js` | **funcionando**, sem segredos e sem binários de Windows |

¹ O Trivy apontou 4 “segredos” médios em `.env` e `.env.local` (chaves do Supabase **local**). Esses arquivos
são ignorados pelo git, não vão para a esteira e o script do pacote FTP garante que não entram no pacote.

² Mesmos alertas já analisados em `REGISTRO-DE-ERROS.md` (“Resultado do OWASP ZAP”): *Anti-CSRF tokens* é
falso positivo (o item 14 provou que formulário de outro site é recusado); *CSP unsafe-inline* é risco aceito
(Next.js sem *nonce*); *COEP* ausente é aceito (bloquearia as fotos da galeria). Relatório: `zap-report.html`.

## Ataques manuais (itens 13 e 14)

**Visitante só com a chave pública** (a que vai para o navegador) — todos bloqueados: ler cadastros, fichas,
caixa, mensalidades, comprovantes, lições, equipes, compras, tarefas, auditoria, consentimentos e áreas restritas;
executar `salvar_licao`, `aplicar_rateio`, `filhos_ativos`, `pessoas_da_equipe`, `gerar_mensalidades`,
`decidir_pagamento`; gravar evento; listar comprovantes no armazenamento.

**Filho logado** — todos bloqueados: ver outros cadastros, virar admin, gravar no caixa, fazer rateio, publicar
lição sem cargo, confirmar pagamento, ver mensalidade/auditoria de outros, enviar arquivo na pasta de outra pessoa,
publicar foto na galeria; abrir `/app/admin`, `/financeiro`, `/filhos`, `/auditoria` e o link de comprovante do admin.

**Portal** — formulário enviado de outro site (CSRF) recusado; `/auth/confirm?next=//site-de-fora` não sai do
portal; rotinas e métricas recusam token errado; páginas da área restrita com `Cache-Control: no-store`;
página inexistente sem detalhes técnicos.

## Captcha (item 15)

| Cenário | Esperado | Resultado |
|---|---|---|
| Caixinha aparece, pessoa não marca | formulário não envia | ok — “Marque a caixinha” |
| Marca a caixinha | entra | ok |
| Chave secreta errada no servidor | servidor recusa | ok — Google: `invalid-input-response` |
| Robô envia o formulário direto ao servidor, sem caixinha | servidor recusa | ok — “caixinha não marcada” |
| Captcha desligado (sem chaves) | login normal | ok |

0 erros de CSP nos cenários finais. **Situação:** pronto, mas **desligado** até as chaves reais
(google.com/recaptcha/admin, tipo “Caixa de seleção v2”) serem colocadas nas variáveis.

## Problemas encontrados e corrigidos nesta verificação

| Problema | Risco | Correção |
|---|---|---|
| Cookie de sessão legível por scripts da página | médio (roubo de sessão se houvesse XSS) | cookie **HttpOnly** (e **Secure** em HTTPS) |
| “Entrar com Google” no Docker levava o navegador para o endereço interno `host.docker.internal` | quebra do login Google local | `paraUrlPublica()` no login e no link do comprovante |
| `.env.producao` não estava no `.gitignore` | alto (chaves de produção iriam para o git) | `.env.producao*` e `dist/` ignorados |
| Pacote levaria o binário de Windows do `sharp` para o servidor Linux | quebra de rota em produção | otimizador de imagens desligado (o portal usa `<img>`); script recusa binário nativo |
| CSP sem a conexão que o reCAPTCHA usa (`/recaptcha/…/clr`) | captcha com nota pior / erros no console | `connect-src` só em `https://www.google.com/recaptcha/` |
| Captcha dava erro se a pessoa clicasse antes do script do Google carregar | login falhando | formulário espera o script |
| Guia de publicação com exemplo `Bearer SEU_CRON_SECRET` (Gitleaks bloquearia a esteira) e segredo à mostra na lista de Cron Jobs | baixo | cron lê o segredo de `~/.portal_cron_secret` (permissão 600) |

## Limites conhecidos (não são falhas, mas é bom saber)

- O captcha protege o **formulário do portal**. O login direto na API do Supabase (endereço público) fica protegido
  pelo **limite de tentativas do Supabase Auth**; captcha também ali só com hCaptcha/Turnstile.
- `server.js` do pacote guarda o caminho da pasta onde foi compilado (anotação do Next.js; não é servido ao público).
- A esteira GitLab não foi executada nesta rodada: as mesmas ferramentas foram rodadas localmente nas mesmas versões.
