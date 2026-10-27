-- =====================================================================
-- 0005 · Espaço de aprendizado
-- Cantigas, rezas, regras da casa e fundamentos, publicados por quem
-- ensina (pai/mãe de santo, ogã, ebomi) e pela administração.
-- Todos os membros ativos leem; ninguém grava direto na tabela:
-- as gravações passam por salvar_licao / excluir_licao.
-- =====================================================================

-- Cargo na casa (opcional; quem tem cargo de ensino pode publicar lições)
alter table public.membros add column cargo text
  check (cargo in ('pai_de_santo', 'mae_de_santo', 'oga', 'ekedi', 'ebomi'));

create table public.licoes (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizacoes on delete cascade,
  categoria     text not null check (categoria in ('cantigas', 'rezas', 'regras', 'fundamentos', 'orixas', 'outros')),
  titulo        text not null check (char_length(titulo) between 3 and 140),
  conteudo      text not null check (char_length(conteudo) between 1 and 20000),
  midia_url     text check (midia_url ~ '^https://' and char_length(midia_url) <= 500),
  autor_id      uuid references public.membros on delete set null,
  autor_nome    text not null,
  autor_cargo   text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index licoes_org_cat_idx on public.licoes (org_id, categoria, criado_em desc);

alter table public.licoes enable row level security;
create policy licoes_ler on public.licoes for select to authenticated using (org_id = public.minha_org());
revoke insert, update, delete on public.licoes from anon;

-- Quem pode publicar: administrador ou membro ativo com cargo de ensino
create or replace function public.pode_ensinar() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.membros
                  where user_id = auth.uid() and status = 'ativo'
                    and (papel = 'admin' or cargo in ('pai_de_santo', 'mae_de_santo', 'oga', 'ebomi')))
$$;

-- ✍️ Cria (p_id nulo) ou edita uma lição. Quem não é admin só edita as próprias.
create or replace function public.salvar_licao(
  p_id uuid, p_categoria text, p_titulo text, p_conteudo text, p_midia_url text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  eu public.membros%rowtype;
  v_id uuid;
begin
  select * into eu from public.membros where user_id = auth.uid() and status = 'ativo' limit 1;
  if not found or not public.pode_ensinar() then
    raise exception 'Somente pais/mães de santo, ogãs, ebomis e a administração publicam no espaço de aprendizado'
      using errcode = '42501';
  end if;

  if p_id is null then
    insert into public.licoes (org_id, categoria, titulo, conteudo, midia_url, autor_id, autor_nome, autor_cargo)
    values (eu.org_id, p_categoria, trim(p_titulo), p_conteudo, nullif(trim(p_midia_url), ''), eu.id, eu.nome, eu.cargo)
    returning id into v_id;
    perform public.auditar('aprendizado.publicou', 'licao:' || v_id, jsonb_build_object('titulo', p_titulo));
  else
    update public.licoes
       set categoria = p_categoria, titulo = trim(p_titulo), conteudo = p_conteudo,
           midia_url = nullif(trim(p_midia_url), ''), atualizado_em = now()
     where id = p_id and org_id = eu.org_id and (eu.papel = 'admin' or autor_id = eu.id)
    returning id into v_id;
    if v_id is null then raise exception 'Você só pode editar as suas próprias lições' using errcode = '42501'; end if;
    perform public.auditar('aprendizado.editou', 'licao:' || v_id, jsonb_build_object('titulo', p_titulo));
  end if;
  return v_id;
end $$;

-- ✍️ Exclui uma lição (o autor ou o administrador)
create or replace function public.excluir_licao(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  eu public.membros%rowtype;
  v_titulo text;
begin
  select * into eu from public.membros where user_id = auth.uid() and status = 'ativo' limit 1;
  if not found or not public.pode_ensinar() then raise exception 'Acesso negado' using errcode = '42501'; end if;
  delete from public.licoes
   where id = p_id and org_id = eu.org_id and (eu.papel = 'admin' or autor_id = eu.id)
  returning titulo into v_titulo;
  if v_titulo is null then raise exception 'Você só pode excluir as suas próprias lições' using errcode = '42501'; end if;
  perform public.auditar('aprendizado.excluiu', 'licao:' || p_id, jsonb_build_object('titulo', v_titulo));
end $$;

do $$
declare f text;
begin
  foreach f in array array['pode_ensinar()', 'salvar_licao(uuid, text, text, text, text)', 'excluir_licao(uuid)']
  loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated, service_role', f);
  end loop;
end $$;
