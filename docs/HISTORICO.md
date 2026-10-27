# Histórico do projeto — Portal Família Àṣẹ Omos Odé

> **Para retomar em outro dia:** leia este arquivo primeiro.
> Última atualização: **27/10/2026**.

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

## Estado atual
| Item | Situação |
|---|---|
| Site público (hero, FÉ, Orixás, toques, festas, búzios, local) + calendário de toques | ✅ pronto |
| Login Google/e-mail, primeiro acesso, esqueci a senha, termo de consentimento, acesso negado | ✅ pronto (Google depende da configuração — `GUIA-LOGIN-GOOGLE.md`) |
| Área do filho (início, escala, calendário, mensalidade, festas, grupo, meus dados) | ✅ pronto |
| Administração (rodízio, financeiro, festas, calendário de funções/toques, filhos, grupos, galeria, site, áreas restritas, auditoria) | ✅ pronto |
| Banco: 4 migrations, RLS em todas as tabelas, funções de negócio, Storage | ✅ pronto |
| Testes: unitários, 24 pgTAP (RLS), 4 E2E Playwright, fumaça | ✅ passando |
| Docker (portal + agendador + Prometheus + Blackbox + Grafana) | ✅ rodando em 127.0.0.1 |
| Esteira GitLab (Gitleaks, Semgrep, Trivy, npm audit, testes, SonarQube, build, Trivy imagem, review, ZAP) | ✅ pipeline #6 aprovado nas 12 etapas (http://localhost:8929/root/portal-ase/-/pipelines) |
| Automação de privacidade (apagar comprovante analisado) testada de ponta a ponta | ✅ |
| Terraform local (validado + plan: 9 recursos) e produção (validado, **não aplicado**) | ✅ |
| Documentos: apresentação (MD + PDF), configurações e processos, registro de erros, guia do Google | ✅ |

## Próximos passos
1. Casa revisar telas e textos (história completa, fotos e vídeos das festas).
2. Definir domínio e hospedagem → seguir "Publicação em produção" em `CONFIGURACOES-E-PROCESSOS.md`.
3. Configurar o Google (guia) e o SMTP próprio para os e-mails.
4. Cadastrar filhos e grupos (pelo painel) e gerar as rodadas do ano.
5. Pendências para decidir: pedido de exclusão de dados pelo próprio filho (LGPD); mais de um tipo de admin
   (financeiro × zelador); MFA obrigatório para administradores; limite de filhos por dia de limpeza.
6. Revisão de segurança/LGPD antes de dados reais.
