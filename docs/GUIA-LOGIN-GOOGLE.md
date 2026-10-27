# Guia — Ligar o "Entrar com Google" no portal

> Para quem **não é programador**. Cada passo diz onde clicar e o que copiar.
> Conferido em **27/10/2026**. Os painéis do Google e do Supabase mudam de nome com
> frequência: se algo estiver diferente, procure o item com nome parecido.

## 1. O que é e quanto custa

- **Login com Google é gratuito.** Não precisa cartão de crédito nem "licença de desenvolvedor".
  (Os famosos US$ 25 são da Play Store, que **não** usamos — o portal é um site/PWA.)
- O Google só **prova quem a pessoa é** (o e-mail). **Quem decide se ela entra é a casa**: só entra
  quem o administrador cadastrou em **Filhos (cadastro)**.
- O que pode ter custo de verdade: **domínio** (ex.: `.com.br`) e **hospedagem**. O plano gratuito do
  Supabase atende o começo — confira os limites atuais em supabase.com/pricing.

## 2. Antes de começar

- Use de preferência uma **conta Google da casa** (não a pessoal), com **verificação em duas etapas** ligada.
- Tenha em mãos o endereço do portal (ex.: `https://portal.seudominio.com.br`). No computador de testes é
  `http://127.0.0.1:3000`.

## 3. Criar o projeto no Google Cloud

1. Acesse **https://console.cloud.google.com** e entre com a conta da casa.
2. No topo, clique no seletor de projetos → **Novo projeto** → nome `familia-ase-login` → **Criar**.

## 4. Tela de consentimento (o que aparece para o filho)

1. Menu ☰ → **APIs e serviços** → **Tela de consentimento OAuth** (ou **Google Auth Platform → Branding**).
2. Tipo de usuário: **Externo** → **Criar**.
3. Preencha: **Nome do app** = `Família Àṣẹ Omos Odé`; **E-mail de suporte**; **logo** (o brasão);
   **Domínio autorizado** = o domínio do portal; **links** da Política de Privacidade e dos Termos (páginas do site).
4. **Escopos**: somente `openid`, `email` e `profile`. **Não** adicione Gmail, Drive ou Contatos.

### Teste × Produção (importante)
- Em **Teste**, só entram os e-mails da lista **Usuários de teste** (até 100) e o acesso expira de vez em quando.
- Para todos os filhos entrarem, clique em **Publicar app (Produção)**. Com só os escopos básicos o Google
  normalmente não exige revisão demorada; pode aparecer o aviso "Google não verificou este app" até a
  verificação — o filho pode clicar em **Avançado → Continuar**.
- ⚠️ "Usuários de teste" do Google **não** é a lista de quem pode entrar no portal. Essa lista é o cadastro de filhos.

## 5. Criar a credencial (Client ID)

1. **APIs e serviços** → **Credenciais** → **Criar credenciais** → **ID do cliente OAuth**.
2. Tipo: **Aplicativo da Web**. Nome: `portal-familia-ase`.
3. **URIs de redirecionamento autorizados** — cole **exatamente**:
   - Produção: `https://<SEU-PROJETO>.supabase.co/auth/v1/callback`
   - Testes no PC: `http://127.0.0.1:55421/auth/v1/callback`
4. **Criar** → copie o **ID do cliente** e a **Chave secreta do cliente**.
   - 🔒 A chave secreta **nunca** vai para o código, WhatsApp ou e-mail. Ela só é colada no Supabase (produção)
     ou no arquivo `.env.local` do PC de testes.

## 6. Ligar no Supabase

**Produção (supabase.com):**
1. Projeto → **Authentication** → **Sign In / Providers** → **Google** → **Enable**.
2. Cole o **Client ID** e o **Client Secret** → **Save**.
3. **Authentication → URL Configuration**: **Site URL** = endereço do portal;
   **Redirect URLs** = `https://portal.seudominio.com.br/**`.
4. Deixe **Confirm email** ligado (protege o vínculo das contas de e-mail/senha).

**PC de testes (Supabase local):**
1. No arquivo `.env.local` da pasta do portal preencha `GOOGLE_CLIENT_ID=` e `GOOGLE_CLIENT_SECRET=`.
2. Em `supabase/config.toml`, na seção `[auth.external.google]`, troque `enabled = false` para `enabled = true`.
3. Rode `npx supabase stop` e depois `npx supabase start`.

## 7. Testar

1. Abra o portal → **Área restrita** → **Entrar com Google**.
2. Com um e-mail **cadastrado** em Filhos: entra → aceita o termo → vê a área do filho.
3. Com um e-mail **não cadastrado**: aparece "Seu acesso ainda não foi liberado". Isso é o esperado.
4. Teste também no celular.

## 8. Liberar os filhos (rotina do administrador)

1. **Área restrita → Administração → Filhos (cadastro) → + Novo cadastro**.
2. Informe nome, **o e-mail Google do filho**, grupo e salve.
3. Pronto: no primeiro login com esse e-mail o acesso libera sozinho (não importa se ele tentou entrar antes
   de ser cadastrado — o portal religa a conta).
4. Para **bloquear**: abra a ficha → Situação = **Bloqueado**.

## 9. Mensagem pronta para os filhos (WhatsApp da casa)

> Axé! 🙏 O portal da Família Àṣẹ Omos Odé já está no ar: **<endereço do portal>**
> 1. Toque em **Área restrita** → **Entrar com Google** (use o **mesmo e-mail** que você passou para a administração).
>    Não tem Google? Use **Primeiro acesso** e crie uma senha com esse e-mail.
> 2. Para instalar no celular: no Chrome, menu ⋮ → **Adicionar à tela inicial**; no iPhone (Safari), **Compartilhar → Adicionar à Tela de Início**.
> 3. Lá você **escolhe o dia da sua limpeza** (até 1 mês antes da semana do seu grupo), **envia o comprovante da mensalidade
>    e das festas** e acompanha o **calendário de funções e toques**.

## 10. Problemas comuns

| O que aparece | O que fazer |
|---|---|
| `redirect_uri_mismatch` | A URI do passo 5.3 tem que ser **idêntica** (https, sem barra no fim). |
| "Este app não concluiu a verificação" | Normal até a verificação do Google; clique em Avançado → Continuar. Publique o app (passo 4). |
| Filho não consegue entrar (app em Teste) | Publique o app em Produção ou inclua o e-mail em Usuários de teste. |
| Entra no Google mas vê "acesso não liberado" | O e-mail usado é diferente do cadastrado, ou o cadastro está bloqueado. Corrija a ficha. |
| "Login com Google ainda não está configurado" | O provedor Google está desligado no Supabase (passo 6). |
| Não fica logado no celular | Verifique se o celular não bloqueia cookies e se o endereço é sempre o mesmo (com ou sem `www`). |

## 11. Segurança da conta de administrador

- Ligue a **verificação em duas etapas** em todas as contas Google com acesso ao Google Cloud e ao Supabase.
- Poucas pessoas com acesso ao painel do Supabase.
- Se a **chave secreta** vazar: Google Cloud → Credenciais → o cliente OAuth → **Redefinir chave secreta** →
  cole a nova no Supabase. A antiga para de funcionar.
