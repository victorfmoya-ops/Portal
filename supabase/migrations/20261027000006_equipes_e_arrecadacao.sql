-- =====================================================================
-- 0006 · Equipes (a função fixa de cada filho na casa), organização das
-- festas e arrecadação.
--   · cada membro pertence a uma equipe; cada equipe tem um coordenador
--   · coordenadores e admin veem o panorama de todas as equipes
--   · por festa, cada equipe tem tarefas (o que já foi feito)
--   · a equipe de ARRECADAÇÃO monta a lista de compras da festa e faz o
--     rateio: total ÷ filhos ativos = valor de cada filho
-- Gravações de tarefas, compras e rateio só pelas funções abaixo.
-- =====================================================================

create table public.equipes (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizacoes on delete cascade,
  nome            text not null check (char_length(nome) between 2 and 60),
  descricao       text check (char_length(descricao) <= 300),
  coordenador_id  uuid references public.membros on delete set null,
  arrecadacao     boolean not null default false,
  criado_em       timestamptz not null default now(),
  unique (org_id, nome)
);
-- só uma equipe de arrecadação por casa
create unique index equipes_uma_arrecadacao on public.equipes (org_id) where arrecadacao;

alter table public.membros add column equipe_id uuid references public.equipes on delete set null;
create index membros_equipe_idx on public.membros (equipe_id);

create table public.festa_tarefas (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizacoes on delete cascade,
  festa_id   uuid not null references public.festas on delete cascade,
  equipe_id  uuid not null references public.equipes on delete cascade,
  descricao  text not null check (char_length(descricao) between 2 and 200),
  feito      boolean not null default false,
  feito_em   timestamptz,
  criado_em  timestamptz not null default now()
);
create index festa_tarefas_idx on public.festa_tarefas (festa_id, equipe_id);

create table public.festa_compras (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizacoes on delete cascade,
  festa_id        uuid not null references public.festas on delete cascade,
  item            text not null check (char_length(item) between 2 and 120),
  quantidade      numeric(10,2) not null default 1 check (quantidade > 0 and quantidade <= 100000),
  valor_unitario  numeric(10,2) not null check (valor_unitario >= 0 and valor_unitario <= 1000000),
  comprado        boolean not null default false,
  criado_em       timestamptz not null default now()
);
create index festa_compras_idx on public.festa_compras (festa_id);

-- ---------- RLS ----------
alter table public.equipes       enable row level security;
alter table public.festa_tarefas enable row level security;
alter table public.festa_compras enable row level security;

create policy equipes_ler on public.equipes for select to authenticated using (org_id = public.minha_org());
create policy equipes_admin_ins on public.equipes for insert to authenticated with check (public.eh_admin_da(org_id));
create policy equipes_admin_upd on public.equipes for update to authenticated using (public.eh_admin_da(org_id)) with check (public.eh_admin_da(org_id));
create policy equipes_admin_del on public.equipes for delete to authenticated using (public.eh_admin_da(org_id));
create policy festa_tarefas_ler on public.festa_tarefas for select to authenticated using (org_id = public.minha_org());
create policy festa_compras_ler on public.festa_compras for select to authenticated using (org_id = public.minha_org());
revoke insert, update, delete on public.equipes, public.festa_tarefas, public.festa_compras from anon;

-- ---------- Funções de apoio ----------
create or replace function public.eh_coordenador() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.equipes e join public.membros m on m.id = e.coordenador_id
                  where m.user_id = auth.uid() and m.status = 'ativo')
$$;

create or replace function public.eh_coordenador_da(p_equipe uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.equipes e join public.membros m on m.id = e.coordenador_id
                  where e.id = p_equipe and m.user_id = auth.uid() and m.status = 'ativo')
$$;

create or replace function public.eh_coordenador_arrecadacao() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.equipes e join public.membros m on m.id = e.coordenador_id
                  where e.arrecadacao and m.user_id = auth.uid() and m.status = 'ativo')
$$;

-- Quantos filhos ativos dividem a arrecadação
create or replace function public.filhos_ativos() returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.membros
   where org_id = public.minha_org() and status = 'ativo' and papel = 'filho'
$$;

-- Panorama das equipes (nome do coordenador, tamanho e andamento das tarefas da festa)
create or replace function public.equipes_visao(p_festa uuid default null)
returns table (id uuid, nome text, descricao text, arrecadacao boolean, coordenador_id uuid,
               coordenador_nome text, membros int, tarefas int, feitas int)
language sql stable security definer set search_path = public as $$
  select e.id, e.nome, e.descricao, e.arrecadacao, e.coordenador_id, c.nome,
         (select count(*)::int from public.membros m where m.equipe_id = e.id and m.status = 'ativo'),
         (select count(*)::int from public.festa_tarefas t where t.equipe_id = e.id and t.festa_id = p_festa),
         (select count(*)::int from public.festa_tarefas t where t.equipe_id = e.id and t.festa_id = p_festa and t.feito)
    from public.equipes e
    left join public.membros c on c.id = e.coordenador_id
   where e.org_id = public.minha_org()
   order by e.arrecadacao desc, e.nome
$$;

-- Quem está na equipe: admin e coordenadores veem todas; os demais, só a própria
create or replace function public.pessoas_da_equipe(p_equipe uuid)
returns table (id uuid, nome text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.eh_admin() or public.eh_coordenador()
          or exists (select 1 from public.membros where user_id = auth.uid() and status = 'ativo' and equipe_id = p_equipe)) then
    raise exception 'Você só vê as pessoas da sua equipe' using errcode = '42501';
  end if;
  return query
    select m.id, m.nome from public.membros m join public.equipes e on e.id = m.equipe_id
     where e.id = p_equipe and e.org_id = public.minha_org() and m.status = 'ativo'
     order by m.nome;
end $$;

-- ---------- ✍️ Tarefas da festa (coordenador da equipe ou admin) ----------
create or replace function public.salvar_tarefa(p_festa uuid, p_equipe uuid, p_descricao text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_org uuid := public.minha_org();
begin
  if not (public.eh_admin_da(v_org) or public.eh_coordenador_da(p_equipe)) then
    raise exception 'Somente o coordenador da equipe cria tarefas' using errcode = '42501';
  end if;
  if not exists (select 1 from public.festas where id = p_festa and org_id = v_org)
     or not exists (select 1 from public.equipes where id = p_equipe and org_id = v_org) then
    raise exception 'Festa ou equipe inválida' using errcode = '22023';
  end if;
  insert into public.festa_tarefas (org_id, festa_id, equipe_id, descricao)
  values (v_org, p_festa, p_equipe, trim(p_descricao)) returning id into v_id;
  return v_id;
end $$;

-- Marcar/desmarcar: quem é da equipe, o coordenador ou o admin
create or replace function public.alternar_tarefa(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare t public.festa_tarefas%rowtype;
begin
  select * into t from public.festa_tarefas where id = p_id and org_id = public.minha_org();
  if not found then raise exception 'Tarefa não encontrada' using errcode = '22023'; end if;
  if not (public.eh_admin_da(t.org_id) or public.eh_coordenador_da(t.equipe_id)
          or exists (select 1 from public.membros where user_id = auth.uid() and status = 'ativo' and equipe_id = t.equipe_id)) then
    raise exception 'Somente quem é da equipe marca esta tarefa' using errcode = '42501';
  end if;
  update public.festa_tarefas set feito = not feito, feito_em = case when feito then null else now() end where id = p_id;
end $$;

create or replace function public.excluir_tarefa(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare t public.festa_tarefas%rowtype;
begin
  select * into t from public.festa_tarefas where id = p_id and org_id = public.minha_org();
  if not found then raise exception 'Tarefa não encontrada' using errcode = '22023'; end if;
  if not (public.eh_admin_da(t.org_id) or public.eh_coordenador_da(t.equipe_id)) then
    raise exception 'Somente o coordenador da equipe exclui tarefas' using errcode = '42501';
  end if;
  delete from public.festa_tarefas where id = p_id;
end $$;

-- ---------- ✍️ Compras e rateio (coordenador da arrecadação ou admin) ----------
create or replace function public.pode_arrecadar() returns boolean
language sql stable security definer set search_path = public as $$
  select public.eh_admin() or public.eh_coordenador_arrecadacao()
$$;

create or replace function public.salvar_compra(p_festa uuid, p_item text, p_quantidade numeric, p_valor_unitario numeric) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_org uuid := public.minha_org();
begin
  if not public.pode_arrecadar() then
    raise exception 'Somente o coordenador da arrecadação monta a lista de compras' using errcode = '42501';
  end if;
  if not exists (select 1 from public.festas where id = p_festa and org_id = v_org) then
    raise exception 'Festa inválida' using errcode = '22023';
  end if;
  insert into public.festa_compras (org_id, festa_id, item, quantidade, valor_unitario)
  values (v_org, p_festa, trim(p_item), p_quantidade, p_valor_unitario) returning id into v_id;
  return v_id;
end $$;

create or replace function public.alternar_compra(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.pode_arrecadar() then raise exception 'Acesso negado' using errcode = '42501'; end if;
  update public.festa_compras set comprado = not comprado where id = p_id and org_id = public.minha_org();
end $$;

create or replace function public.excluir_compra(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.pode_arrecadar() then raise exception 'Acesso negado' using errcode = '42501'; end if;
  delete from public.festa_compras where id = p_id and org_id = public.minha_org();
end $$;

-- Rateio: total das compras ÷ filhos ativos. Atualiza o valor da festa, cria a
-- contribuição de quem ainda não tinha e corrige as que ainda não foram pagas.
create or replace function public.aplicar_rateio(p_festa uuid, p_arredondar boolean default true) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := public.minha_org();
  f public.festas%rowtype;
  v_total numeric; v_filhos int; v_valor numeric; v_atualizadas int; v_ja_pagas int;
begin
  if not public.pode_arrecadar() then
    raise exception 'Somente o coordenador da arrecadação faz o rateio' using errcode = '42501';
  end if;
  select * into f from public.festas where id = p_festa and org_id = v_org;
  if not found then raise exception 'Festa inválida' using errcode = '22023'; end if;
  select coalesce(sum(quantidade * valor_unitario), 0) into v_total from public.festa_compras where festa_id = p_festa;
  if v_total <= 0 then raise exception 'Cadastre a lista de compras antes de calcular' using errcode = '22023'; end if;
  v_filhos := public.filhos_ativos();
  if v_filhos = 0 then raise exception 'Não há filhos ativos cadastrados para dividir' using errcode = '22023'; end if;
  v_valor := case when p_arredondar then ceil(v_total / v_filhos) else ceil(v_total * 100 / v_filhos) / 100 end;

  update public.festas set valor = v_valor where id = p_festa;
  insert into public.contribuicoes_festa (org_id, festa_id, membro_id, valor)
  select v_org, p_festa, m.id, v_valor from public.membros m
   where m.org_id = v_org and m.status = 'ativo' and m.papel = 'filho'
  on conflict do nothing;
  update public.contribuicoes_festa set valor = v_valor
   where festa_id = p_festa and status in ('aberta', 'rejeitado') and valor <> v_valor;
  get diagnostics v_atualizadas = row_count;
  select count(*) into v_ja_pagas from public.contribuicoes_festa
   where festa_id = p_festa and status in ('pendente', 'confirmado') and valor <> v_valor;

  perform public.auditar('festa.rateio', 'festa:' || f.nome,
    jsonb_build_object('total', v_total, 'filhos', v_filhos, 'valor', v_valor));
  return jsonb_build_object('total', v_total, 'filhos', v_filhos, 'valor', v_valor,
                            'atualizadas', v_atualizadas, 'ja_pagas', v_ja_pagas);
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'eh_coordenador()', 'eh_coordenador_da(uuid)', 'eh_coordenador_arrecadacao()', 'filhos_ativos()',
    'equipes_visao(uuid)', 'pessoas_da_equipe(uuid)', 'salvar_tarefa(uuid, uuid, text)', 'alternar_tarefa(uuid)',
    'excluir_tarefa(uuid)', 'pode_arrecadar()', 'salvar_compra(uuid, text, numeric, numeric)', 'alternar_compra(uuid)',
    'excluir_compra(uuid)', 'aplicar_rateio(uuid, boolean)']
  loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated, service_role', f);
  end loop;
end $$;
