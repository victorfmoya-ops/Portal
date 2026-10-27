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
