-- =====================================================================
-- 0002 · Funções de apoio, gatilhos e RLS (segurança por linha)
-- Regra principal: o FILHO não grava direto em nenhuma tabela. As três
-- gravações permitidas (comprovante de mensalidade, comprovante de festa
-- e escolha do dia da limpeza) passam por funções (migration 0003).
-- =====================================================================

-- ---------- Funções de apoio (rodam com o dono; não vazam dados) ----------
create or replace function public.membro_atual_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.membros where user_id = auth.uid() and status = 'ativo' limit 1
$$;

create or replace function public.minha_org() returns uuid
language sql stable security definer set search_path = public as $$
  select org_id from public.membros where user_id = auth.uid() and status = 'ativo' limit 1
$$;

create or replace function public.meu_grupo() returns uuid
language sql stable security definer set search_path = public as $$
  select grupo_id from public.membros where user_id = auth.uid() and status = 'ativo' limit 1
$$;

create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.membros
                  where user_id = auth.uid() and status = 'ativo' and papel = 'admin')
$$;

-- Admin da organização informada (usar sempre junto com org_id; evita admin de outra casa)
create or replace function public.eh_admin_da(p_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.membros
                  where user_id = auth.uid() and status = 'ativo' and papel = 'admin' and org_id = p_org)
$$;

create or replace function public.auditar(p_acao text, p_alvo text, p_detalhes jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.log_auditoria (org_id, membro_id, acao, alvo, detalhes)
  values (public.minha_org(), public.membro_atual_id(), p_acao, p_alvo, coalesce(p_detalhes, '{}'::jsonb));
end $$;

revoke execute on function public.auditar(text, text, jsonb) from public, anon, authenticated;

-- ---------- Gatilhos ----------
create or replace function public.tg_atualizado_em() returns trigger
language plpgsql set search_path = public as $$
begin new.atualizado_em := now(); return new; end $$;

create trigger membros_atualizado before update on public.membros
  for each row execute function public.tg_atualizado_em();
create trigger fichas_atualizado before update on public.fichas
  for each row execute function public.tg_atualizado_em();
create trigger site_config_atualizado before update on public.site_config
  for each row execute function public.tg_atualizado_em();

-- Defesa extra: só admin (ou o próprio banco/serviço) muda papel, status, grupo, e-mail e vínculo
create or replace function public.tg_protege_membro() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.eh_admin_da(old.org_id) then
    return new;
  end if;
  raise exception 'Somente o administrador pode alterar cadastros' using errcode = '42501';
end $$;
create trigger membros_protege before update on public.membros
  for each row execute function public.tg_protege_membro();

-- Todo filho novo ganha a ficha vazia
create or replace function public.tg_membro_ficha() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.fichas (membro_id, org_id, data_cadastro)
  values (new.id, new.org_id, current_date) on conflict do nothing;
  return new;
end $$;
create trigger membros_ficha after insert on public.membros
  for each row execute function public.tg_membro_ficha();

-- Todo "Oro" tem presença obrigatória de todos os filhos
create or replace function public.tg_funcao_oro() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.titulo ~* '(^|[^[:alpha:]])oro([^[:alpha:]]|$)' then new.obrigatorio := true; end if;
  return new;
end $$;
create trigger funcoes_oro before insert or update on public.funcoes
  for each row execute function public.tg_funcao_oro();

-- Festa nova: cria a contribuição de cada filho ativo com o valor da festa
create or replace function public.tg_festa_contribuicoes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.contribuicoes_festa (org_id, festa_id, membro_id, valor)
  select new.org_id, new.id, m.id, new.valor
    from public.membros m
   where m.org_id = new.org_id and m.status = 'ativo' and m.papel = 'filho'
  on conflict do nothing;
  return new;
end $$;
create trigger festas_contribuicoes after insert on public.festas
  for each row execute function public.tg_festa_contribuicoes();

-- ---------- RLS ----------
alter table public.organizacoes        enable row level security;
alter table public.grupos              enable row level security;
alter table public.membros             enable row level security;
alter table public.fichas              enable row level security;
alter table public.locais              enable row level security;
alter table public.rodadas             enable row level security;
alter table public.rodada_locais       enable row level security;
alter table public.escolhas_limpeza    enable row level security;
alter table public.eventos             enable row level security;
alter table public.funcoes             enable row level security;
alter table public.funcao_responsaveis enable row level security;
alter table public.mensalidades        enable row level security;
alter table public.festas              enable row level security;
alter table public.contribuicoes_festa enable row level security;
alter table public.comprovantes        enable row level security;
alter table public.caixa_lancamentos   enable row level security;
alter table public.areas_restritas     enable row level security;
alter table public.area_restrita_pessoas enable row level security;
alter table public.midia               enable row level security;
alter table public.site_config         enable row level security;
alter table public.consentimentos      enable row level security;
alter table public.log_auditoria       enable row level security;

-- Público (visitante sem login): nome da casa, agenda pública, galeria e aparência
create policy org_leitura_publica on public.organizacoes for select to anon, authenticated using (true);
create policy eventos_publicos on public.eventos for select to anon using (publico);
create policy midia_publica on public.midia for select to anon using (publicado);
create policy site_publico on public.site_config for select to anon, authenticated using (true);

-- Leitura para membros da casa
create policy grupos_ler on public.grupos for select to authenticated using (org_id = public.minha_org());
create policy locais_ler on public.locais for select to authenticated using (org_id = public.minha_org());
create policy eventos_ler on public.eventos for select to authenticated using (org_id = public.minha_org());
create policy funcoes_ler on public.funcoes for select to authenticated using (org_id = public.minha_org());
create policy funcao_resp_ler on public.funcao_responsaveis for select to authenticated using (org_id = public.minha_org());
create policy festas_ler on public.festas for select to authenticated using (org_id = public.minha_org());
create policy midia_ler on public.midia for select to authenticated using (org_id = public.minha_org() or publicado);

-- Filho vê só o que é dele; admin vê tudo da casa
create policy membros_ler on public.membros for select to authenticated
  using (id = public.membro_atual_id() or public.eh_admin_da(org_id));
create policy fichas_ler on public.fichas for select to authenticated
  using (membro_id = public.membro_atual_id() or public.eh_admin_da(org_id));
create policy rodadas_ler on public.rodadas for select to authenticated
  using (public.eh_admin_da(org_id) or (org_id = public.minha_org() and grupo_id = public.meu_grupo()));
create policy rodada_locais_ler on public.rodada_locais for select to authenticated
  using (public.eh_admin_da(org_id) or exists (
    select 1 from public.rodadas r where r.id = rodada_id and r.grupo_id = public.meu_grupo()));
create policy escolhas_ler on public.escolhas_limpeza for select to authenticated
  using (membro_id = public.membro_atual_id() or public.eh_admin_da(org_id));
create policy mensalidades_ler on public.mensalidades for select to authenticated
  using (membro_id = public.membro_atual_id() or public.eh_admin_da(org_id));
create policy contrib_ler on public.contribuicoes_festa for select to authenticated
  using (membro_id = public.membro_atual_id() or public.eh_admin_da(org_id));
create policy comprovantes_ler on public.comprovantes for select to authenticated
  using (membro_id = public.membro_atual_id() or public.eh_admin_da(org_id));
create policy consent_ler on public.consentimentos for select to authenticated
  using (membro_id = public.membro_atual_id() or public.eh_admin_da(org_id));

-- Somente admin
create policy caixa_admin on public.caixa_lancamentos for select to authenticated using (public.eh_admin_da(org_id));
create policy areas_admin on public.areas_restritas for select to authenticated using (public.eh_admin_da(org_id));
create policy area_pessoas_admin on public.area_restrita_pessoas for select to authenticated using (public.eh_admin_da(org_id));
create policy auditoria_admin on public.log_auditoria for select to authenticated using (public.eh_admin_da(org_id));

-- Escrita: só administrador da mesma casa (o filho NÃO tem nenhuma policy de escrita)
do $$
declare t text;
begin
  foreach t in array array['grupos','membros','fichas','locais','rodadas','rodada_locais','escolhas_limpeza',
                           'eventos','funcoes','funcao_responsaveis','mensalidades','festas','contribuicoes_festa',
                           'caixa_lancamentos','areas_restritas','area_restrita_pessoas','midia','site_config']
  loop
    execute format('create policy %I on public.%I for insert to authenticated with check (public.eh_admin_da(org_id))', t || '_admin_ins', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.eh_admin_da(org_id)) with check (public.eh_admin_da(org_id))', t || '_admin_upd', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.eh_admin_da(org_id))', t || '_admin_del', t);
  end loop;
end $$;

-- Comprovantes: admin pode apagar (a gravação é só pela função enviar_comprovante)
create policy comprovantes_admin_del on public.comprovantes for delete to authenticated using (public.eh_admin_da(org_id));

-- Visitante não acessa nada além das policies públicas acima
revoke all on public.log_auditoria from anon;
revoke insert, update, delete on all tables in schema public from anon;
