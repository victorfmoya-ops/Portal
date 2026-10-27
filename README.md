# Portal Família Àṣẹ Omos Odé

Site público + área restrita (filhos e administração) do **Centro Cultural Família Àṣẹ Omos Odé**.
Next.js 16 · Supabase (Postgres + RLS, Auth, Storage) · Docker · GitLab CI (DevSecOps) · Prometheus/Grafana · Terraform.

## Começar (Windows)
```powershell
npm ci
powershell -ExecutionPolicy Bypass -File scripts\configurar-ambiente.ps1   # Supabase local + .env
npm run dev                                                               # http://127.0.0.1:3000
docker compose up -d --build                                              # portal :3020, Grafana :3006
```
O banco começa só com os dados reais da casa (sem pessoas). Crie seu acesso de administrador com
`powershell -ExecutionPolicy Bypass -File scripts\criar-admin.ps1 -Email voce@exemplo.com -Nome "Seu nome"`.
Os testes automáticos usam dados fictícios à parte: `infra/ci/dados-de-teste.sql`.

## Verificações
```powershell
npm run lint; npm run typecheck; npm test; npm run build
npm run db:test          # 24 testes de permissão (RLS)
npm run test:e2e         # ponta a ponta (com o portal rodando em :3000)
```

## Documentos
| Documento | Para quê |
|---|---|
| [docs/APRESENTACAO-CLIENTE.md](docs/APRESENTACAO-CLIENTE.md) · [PDF](docs/APRESENTACAO-CLIENTE.pdf) | Apresentar o portal para a casa |
| [docs/CONFIGURACOES-E-PROCESSOS.md](docs/CONFIGURACOES-E-PROCESSOS.md) | Arquitetura, configurações, banco, esteira, monitoramento, Terraform, publicação |
| [docs/REGISTRO-DE-ERROS.md](docs/REGISTRO-DE-ERROS.md) | Todos os erros encontrados e como foram resolvidos |
| [docs/GUIA-LOGIN-GOOGLE.md](docs/GUIA-LOGIN-GOOGLE.md) | Ligar o "Entrar com Google" (passo a passo) |
| [docs/HISTORICO.md](docs/HISTORICO.md) | O que foi feito, decisões e próximos passos |

**Nunca coloque dados reais de pessoas no repositório.** O protótipo original e o vídeo (com nomes reais)
ficam em `referencia/`, fora do Git.
