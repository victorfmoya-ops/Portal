-- =====================================================================
-- 0001 · Estrutura do portal (tabelas)
-- Regras: toda tabela tem org_id; textos com limite de tamanho; nada de
-- dado bancário/Pix/cartão/senha; aniversário só dia/mês (minimização).
-- =====================================================================
create extension if not exists citext with schema extensions;

-- Casa de santo (preparado para mais de uma casa no futuro)
create table public.organizacoes (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  nome        text not null check (char_length(nome) between 2 and 160),
  criado_em   timestamptz not null default now()
);

create table public.grupos (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references public.organizacoes on delete cascade,
  numero    int  not null check (numero between 1 and 50),
  nome      text check (char_length(nome) <= 60),
  unique (org_id, numero)
);

-- Filhos e administradores. O acesso só existe para quem o admin cadastrou.
create table public.membros (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizacoes on delete cascade,
  user_id          uuid unique references auth.users on delete set null,
  email            extensions.citext not null check (char_length(email) between 5 and 254),
  nome             text not null check (char_length(nome) between 2 and 120),
  papel            text not null default 'filho' check (papel in ('filho', 'admin')),
  grupo_id         uuid references public.grupos on delete set null,
  status           text not null default 'ativo' check (status in ('ativo', 'bloqueado')),
  aniversario_dia  smallint check (aniversario_dia between 1 and 31),
  aniversario_mes  smallint check (aniversario_mes between 1 and 12),
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),
  unique (org_id, email)
);
create index membros_grupo_idx on public.membros (grupo_id);

-- Ficha (Cadastro Geral + Cadastro de filho). Só o admin edita.
create table public.fichas (
  membro_id            uuid primary key references public.membros on delete cascade,
  org_id               uuid not null references public.organizacoes on delete cascade,
  data_cadastro        date,
  endereco             text check (char_length(endereco) <= 200),
  whatsapp             text check (char_length(whatsapp) <= 30),
  telefone_emergencia  text check (char_length(telefone_emergencia) <= 30),
  zelador              text check (char_length(zelador) <= 120),
  orisa                text check (char_length(orisa) <= 80),
  ere                  text check (char_length(ere) <= 80),
  iniciado             boolean not null default false,
  dt_iniciacao         date,
  dt_1ano              date,
  dt_3anos             date,
  dt_5anos             date,
  dt_7anos             date,
  atualizado_em        timestamptz not null default now()
);

-- Locais da limpeza do barracão
create table public.locais (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references public.organizacoes on delete cascade,
  nome      text not null check (char_length(nome) between 2 and 80),
  ordem     int  not null default 0,
  restrito  boolean not null default false,
  ativo     boolean not null default true
);

-- Rodízio quinzenal: cada rodada é uma semana (segunda a domingo) de um grupo
create table public.rodadas (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizacoes on delete cascade,
  numero         int  not null check (numero > 0),
  grupo_id       uuid not null references public.grupos on delete restrict,
  inicio         date not null check (extract(isodow from inicio) = 1),
  fim            date not null,
  -- o filho escolhe o dia até 1 mês antes do início da rodada
  prazo_escolha  date not null,
  check (fim = inicio + 6),
  check (prazo_escolha <= inicio),
  unique (org_id, inicio)
);
create index rodadas_grupo_idx on public.rodadas (grupo_id, inicio);

create table public.rodada_locais (
  rodada_id      uuid not null references public.rodadas on delete cascade,
  local_id       uuid not null references public.locais on delete cascade,
  org_id         uuid not null references public.organizacoes on delete cascade,
  concluido_em   timestamptz,
  concluido_por  uuid references public.membros on delete set null,
  primary key (rodada_id, local_id)
);

-- Dia escolhido por cada filho dentro da rodada do seu grupo (1 por rodada)
create table public.escolhas_limpeza (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizacoes on delete cascade,
  rodada_id     uuid not null references public.rodadas on delete cascade,
  membro_id     uuid not null references public.membros on delete cascade,
  dia           date not null,
  escolhido_em  timestamptz not null default now(),
  unique (rodada_id, membro_id)
);
create index escolhas_membro_idx on public.escolhas_limpeza (membro_id, dia);

-- Calendário de toques (agenda pública)
create table public.eventos (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizacoes on delete cascade,
  titulo      text not null check (char_length(titulo) between 2 and 120),
  data        date not null,
  hora        time,
  observacao  text check (char_length(observacao) <= 300),
  publico     boolean not null default true,
  criado_em   timestamptz not null default now()
);
create index eventos_data_idx on public.eventos (org_id, data);

-- Calendário de funções / obrigações da casa
create table public.funcoes (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizacoes on delete cascade,
  titulo       text not null check (char_length(titulo) between 2 and 120),
  data         date not null,
  hora         time,
  referencia   text check (char_length(referencia) <= 200),
  obrigatorio  boolean not null default false,
  criado_em    timestamptz not null default now()
);
create index funcoes_data_idx on public.funcoes (org_id, data);

-- Quem vai fazer cada função (opcional: vazio = função de todos)
create table public.funcao_responsaveis (
  funcao_id  uuid not null references public.funcoes on delete cascade,
  membro_id  uuid not null references public.membros on delete cascade,
  org_id     uuid not null references public.organizacoes on delete cascade,
  primary key (funcao_id, membro_id)
);

-- Mensalidades (pagamento é externo; o portal só registra e o admin confirma)
create table public.mensalidades (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizacoes on delete cascade,
  membro_id        uuid not null references public.membros on delete cascade,
  competencia      date not null check (extract(day from competencia) = 1),
  valor            numeric(10,2) not null check (valor >= 0),
  status           text not null default 'aberta' check (status in ('aberta', 'pendente', 'confirmado', 'rejeitado')),
  data_pagamento   date,
  motivo_rejeicao  text check (char_length(motivo_rejeicao) <= 300),
  decidido_por     uuid references public.membros on delete set null,
  decidido_em      timestamptz,
  criado_em        timestamptz not null default now(),
  unique (membro_id, competencia)
);

create table public.festas (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizacoes on delete cascade,
  nome       text not null check (char_length(nome) between 2 and 120),
  data       date not null,
  valor      numeric(10,2) not null check (valor >= 0),
  criado_em  timestamptz not null default now()
);

create table public.contribuicoes_festa (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizacoes on delete cascade,
  festa_id         uuid not null references public.festas on delete cascade,
  membro_id        uuid not null references public.membros on delete cascade,
  valor            numeric(10,2) not null check (valor >= 0),
  status           text not null default 'aberta' check (status in ('aberta', 'pendente', 'confirmado', 'rejeitado')),
  data_pagamento   date,
  motivo_rejeicao  text check (char_length(motivo_rejeicao) <= 300),
  decidido_por     uuid references public.membros on delete set null,
  decidido_em      timestamptz,
  unique (festa_id, membro_id)
);

-- Comprovantes (arquivo no bucket privado; apagados depois da confirmação)
create table public.comprovantes (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizacoes on delete cascade,
  membro_id      uuid not null references public.membros on delete cascade,
  tipo           text not null check (tipo in ('mensalidade', 'festa')),
  referencia_id  uuid not null,
  storage_path   text not null unique check (char_length(storage_path) <= 300),
  mime           text not null check (mime in ('application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic')),
  tamanho        int  not null check (tamanho between 1 and 10485760),
  enviado_em     timestamptz not null default now(),
  -- preenchido quando o arquivo pode ser apagado (pagamento decidido ou comprovante substituído)
  remover_em     timestamptz
);
create index comprovantes_ref_idx on public.comprovantes (tipo, referencia_id);

-- Caixa da casa (controle financeiro do terreiro)
create table public.caixa_lancamentos (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizacoes on delete cascade,
  tipo        text not null check (tipo in ('receita', 'despesa')),
  descricao   text not null check (char_length(descricao) between 2 and 160),
  categoria   text check (char_length(categoria) <= 60),
  valor       numeric(12,2) not null check (valor > 0),
  data        date not null default current_date,
  criado_por  uuid references public.membros on delete set null,
  criado_em   timestamptz not null default now()
);
create index caixa_data_idx on public.caixa_lancamentos (org_id, data);

-- Áreas restritas (ex.: Casa dos Exus) — fora do rodízio dos grupos
create table public.areas_restritas (
  id      uuid primary key default gen_random_uuid(),
  org_id  uuid not null references public.organizacoes on delete cascade,
  nome    text not null check (char_length(nome) between 2 and 120)
);

create table public.area_restrita_pessoas (
  area_id    uuid not null references public.areas_restritas on delete cascade,
  membro_id  uuid not null references public.membros on delete cascade,
  org_id     uuid not null references public.organizacoes on delete cascade,
  papel      text not null check (papel in ('responsavel', 'apoio', 'nao_incluir')),
  primary key (area_id, membro_id)
);

-- Galeria do site (fotos no bucket público "galeria"; vídeos só por link https)
create table public.midia (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizacoes on delete cascade,
  tipo          text not null check (tipo in ('foto', 'video')),
  titulo        text check (char_length(titulo) <= 120),
  storage_path  text check (char_length(storage_path) <= 300),
  url           text check (url ~ '^https://[^\s<>"'']+$' and char_length(url) <= 500),
  publicado     boolean not null default true,
  criado_em     timestamptz not null default now(),
  check ((tipo = 'foto' and storage_path is not null) or (tipo = 'video' and url is not null))
);

-- Aparência do site (editável pelo admin, lida por visitantes)
create table public.site_config (
  org_id             uuid primary key references public.organizacoes on delete cascade,
  hero_titulo        text not null default 'fé, axé e tradição' check (char_length(hero_titulo) <= 80),
  hero_subtitulo     text not null default '' check (char_length(hero_subtitulo) <= 160),
  sobre              text not null default '' check (char_length(sobre) <= 2000),
  cor                text not null default '#1f66c2' check (cor ~ '^#[0-9a-fA-F]{6}$'),
  loja_url           text check (loja_url ~ '^https://[^\s<>"'']+$'),
  whatsapp           text check (whatsapp ~ '^[0-9]{10,15}$'),
  endereco           text check (char_length(endereco) <= 200),
  valor_mensalidade  numeric(10,2) not null default 60 check (valor_mensalidade >= 0),
  -- meta de limpezas por filho por ano
  meta_limpezas_ano  int not null default 5 check (meta_limpezas_ano between 0 and 52),
  atualizado_em      timestamptz not null default now()
);

-- Termo de consentimento (LGPD) aceito por cada filho
create table public.consentimentos (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizacoes on delete cascade,
  membro_id  uuid not null references public.membros on delete cascade,
  versao     text not null check (char_length(versao) <= 20),
  aceito_em  timestamptz not null default now(),
  unique (membro_id, versao)
);

-- Auditoria (quem fez o quê). Só funções do banco gravam aqui.
create table public.log_auditoria (
  id         bigint generated always as identity primary key,
  org_id     uuid references public.organizacoes on delete cascade,
  membro_id  uuid references public.membros on delete set null,
  acao       text not null check (char_length(acao) <= 60),
  alvo       text check (char_length(alvo) <= 120),
  detalhes   jsonb not null default '{}'::jsonb,
  criado_em  timestamptz not null default now()
);
create index log_auditoria_org_idx on public.log_auditoria (org_id, criado_em desc);
