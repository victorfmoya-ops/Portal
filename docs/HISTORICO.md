# Histórico do projeto — Portal Família Àṣẹ Omos Odé

> **Para retomar em outro dia:** leia este arquivo primeiro.
> Última atualização: **27/10/2026 (versão 2)**.

## O que é
Site público + área restrita (PWA) da casa de santo. Visual fiel ao protótipo do vídeo
`referencia/Esboço Portal.mp4` (site = `referencia/index.html`, app = `referencia/app.html`).

## Decisões do responsável (27/10/2026)
- **Recomeçar do zero** (a versão anterior foi apagada por não ficar igual ao vídeo; os containers dela foram só parados).
- **Login:** Google **e** e-mail/senha (com confirmação de e-mail; vínculo só com e-mail confirmado).
- **Limpeza:** o filho escolhe o dia até **1 mês antes** da semana do grupo; meta de **5 limpezas por ano** por filho.
- **Dados reais:** não serão colocados no projeto; os filhos são cadastrados pela administração no sistema.
- **Esteira:** GitLab local (laboratório em `C:\Darkflow\devsecops`), com processo DevSecOps completo.
- **Novos pedidos:** controle financeiro do terreiro, calendário de funções (cada função com seu dia) e calendário de toques.
- Regra do filho (do prompt de continuidade): só grava **comprovante de mensalidade**, **comprovante de festa** e **dia da limpeza**; "Meus dados" é somente leitura.

## Sessão 27/10/2026 (tarde) — versão 2
- **Sem dados fictícios** no banco nem no `seed.sql` (só dados reais da casa). Dados de teste foram para
  `infra/ci/dados-de-teste.sql` (só esteira/testes). Admins locais: Walter Moya e Victor Moya (criados com
  `scripts/criar-admin.ps1`; o e-mail do Victor é provisório `victor.moya@exemplo.test`).
- **Visual novo** (tema escuro tecnológico) no site e no app; **calendário mensal** de verdade (toques, funções,
  obrigações, limpeza) com filtros e detalhes do dia.
- **Espaço de aprendizado** (`/app/aprender`, migration 005): publicam admin e cargos pai/mãe de santo, ogã, ebomi.
- **Equipes e arrecadação** (`/app/equipes`, `/app/organizacao/<festa>`, migration 006): função fixa de cada filho,
  coordenador por equipe, tarefas por festa, lista de compras e rateio (total ÷ filhos ativos, para cima).
  Decisão em aberto: admins (papel *admin*) não entram na divisão — confirmar com a casa.
- **Botão Sair** no topo de todas as telas; campo de arquivo em português (`components/CampoArquivo.tsx`).
- Apresentação v2 refeita (MD + PDF + 18 capturas novas em `docs/telas`, geradas com dados fictícios temporários
  que foram apagados em seguida).

## Estado atual
| Item | Situação |
|---|---|
| Site público (hero, FÉ, toques, festas, búzios, local) + calendário de toques | ✅ pronto |
| Login Google/e-mail, primeiro acesso, esqueci a senha, termo de consentimento, acesso negado | ✅ pronto (Google depende da configuração — `GUIA-LOGIN-GOOGLE.md`) |
| Área do filho (início, escala, calendário, mensalidade, festas, grupo, meus dados) | ✅ pronto |
| Administração (rodízio, financeiro, festas, calendário de funções/toques, filhos, grupos, galeria, site, áreas restritas, auditoria) | ✅ pronto |
| Banco: 6 migrations, RLS em todas as tabelas, funções de negócio, Storage | ✅ pronto |
| Testes: 24 unitários, 37 pgTAP (RLS), fumaça (7) | ✅ passando · **E2E Playwright ajustado mas não executado nesta versão** |
| Docker (portal + agendador + Prometheus + Blackbox + Grafana) | ✅ rodando em 127.0.0.1 |
| Esteira GitLab (Gitleaks, Semgrep, Trivy, npm audit, testes, SonarQube, build, Trivy imagem, review, ZAP) | ✅ pipeline #6 aprovado (versão 1) · **versão 2 ainda não passou pela esteira** |
| Automação de privacidade (apagar comprovante analisado) testada de ponta a ponta | ✅ |
| Terraform local (validado + plan: 9 recursos) e produção (validado, **não aplicado**) | ✅ |
| Documentos: apresentação v2 (MD + PDF), configurações e processos, registro de erros, guia do Google | ✅ |
| Guia de bolso DevSecOps/Terraform e documento da esteira (PDF) | ⏳ **pendente** — estilo pronto em `docs/apresentacao/estilo.css` |

## Próximos passos
0. **Retomar a sessão da versão 2:** (a) gerar o guia de bolso DevSecOps + Terraform e o documento da esteira
   (MD + PDF, mesmo estilo da apresentação); (b) rodar o E2E com dados de teste num banco descartável;
   (c) passar a versão 2 pela esteira (`scripts/integrar-na-esteira.ps1`); (d) trocar o e-mail provisório do Victor.
1. Casa revisar telas e textos (história completa, fotos e vídeos das festas).
2. Definir domínio e hospedagem → seguir "Publicação em produção" em `CONFIGURACOES-E-PROCESSOS.md`.
3. Configurar o Google (guia) e o SMTP próprio para os e-mails.
4. Cadastrar filhos e grupos (pelo painel) e gerar as rodadas do ano.
5. Pendências para decidir: pedido de exclusão de dados pelo próprio filho (LGPD); mais de um tipo de admin
   (financeiro × zelador); MFA obrigatório para administradores; limite de filhos por dia de limpeza.
6. Revisão de segurança/LGPD antes de dados reais.
