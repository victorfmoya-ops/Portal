-- =====================================================================
-- 0003 · Regras de negócio (funções chamadas pelo portal)
-- Todas: SECURITY DEFINER + search_path fixo + checagem de permissão.
-- =====================================================================

-- ---------- Vínculo da conta (Google ou e-mail/senha) com o cadastro ----------
-- Só liga se o e-mail estiver CONFIRMADO e houver membro ativo sem vínculo.
-- Chamado no retorno do login: a ordem (cadastrar antes/depois do 1º login) não importa.
create or replace function public.vincular_meu_cadastro() returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_email text; v_confirmado timestamptz; v_id uuid;
begin
  if auth.uid() is null then return null; end if;
  select id into v_id from public.membros where user_id = auth.uid();
  if v_id is not null then return v_id; end if;

  select email, email_confirmed_at into v_email, v_confirmado from auth.users where id = auth.uid();
  if v_email is null or v_confirmado is null then return null; end if;

  update public.membros set user_id = auth.uid()
   where id = (select id from public.membros
                where email = v_email::extensions.citext and user_id is null and status = 'ativo'
                order by criado_em limit 1)
  returning id into v_id;

  if v_id is not null then
    insert into public.log_auditoria (org_id, membro_id, acao, alvo)
    select org_id, id, 'conta.vinculada', 'membro:' || id from public.membros where id = v_id;
  end if;
  return v_id;
end $$;

-- ---------- Termo de consentimento ----------
create or replace function public.registrar_consentimento(p_versao text) returns void
language plpgsql security definer set search_path = public as $$
declare v_membro uuid := public.membro_atual_id();
begin
  if v_membro is null then raise exception 'Acesso negado' using errcode = '42501'; end if;
  if p_versao is null or char_length(p_versao) > 20 then raise exception 'Versão inválida'; end if;
  insert into public.consentimentos (org_id, membro_id, versao)
  values (public.minha_org(), v_membro, p_versao) on conflict (membro_id, versao) do nothing;
  perform public.auditar('consentimento.aceito', 'termo:' || p_versao);
end $$;

-- ---------- ✍️ Gravação 3 do filho: escolher o dia da limpeza ----------
create or replace function public.escolher_dia_limpeza(p_rodada uuid, p_dia date) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_membro uuid := public.membro_atual_id();
  r public.rodadas%rowtype;
begin
  if v_membro is null then raise exception 'Acesso negado' using errcode = '42501'; end if;
  select * into r from public.rodadas where id = p_rodada;
  if not found or r.org_id <> public.minha_org() or r.grupo_id is distinct from public.meu_grupo() then
    raise exception 'Esta rodada não é do seu grupo' using errcode = '42501';
  end if;
  if p_dia is null or p_dia < r.inicio or p_dia > r.fim then
    raise exception 'Escolha um dia entre % e %', to_char(r.inicio, 'DD/MM'), to_char(r.fim, 'DD/MM') using errcode = '22023';
  end if;
  if current_date > r.prazo_escolha then
    raise exception 'O prazo para escolher o dia desta rodada terminou em % (1 mês antes). Fale com o administrador.',
      to_char(r.prazo_escolha, 'DD/MM/YYYY') using errcode = '22023';
  end if;

  insert into public.escolhas_limpeza (org_id, rodada_id, membro_id, dia)
  values (r.org_id, r.id, v_membro, p_dia)
  on conflict (rodada_id, membro_id) do update set dia = excluded.dia, escolhido_em = now();

  perform public.auditar('limpeza.dia_escolhido', 'rodada:' || r.numero, jsonb_build_object('dia', p_dia));
end $$;

-- ---------- ✍️ Gravações 1 e 2 do filho: enviar comprovante ----------
-- O arquivo já foi enviado ao bucket privado "comprovantes" na pasta
-- <org>/<membro>/<tipo>/<referencia>/ ; aqui só registramos e colocamos em análise.
create or replace function public.enviar_comprovante(
  p_tipo text, p_referencia uuid, p_storage_path text, p_data_pagamento date
) returns void
language plpgsql security definer set search_path = public, storage as $$
declare
  v_membro uuid := public.membro_atual_id();
  v_org uuid := public.minha_org();
  v_dono uuid; v_status text; v_mime text; v_tamanho int; v_prefixo text;
begin
  if v_membro is null then raise exception 'Acesso negado' using errcode = '42501'; end if;
  if p_tipo not in ('mensalidade', 'festa') then raise exception 'Tipo inválido' using errcode = '22023'; end if;

  if p_tipo = 'mensalidade' then
    select membro_id, status into v_dono, v_status from public.mensalidades where id = p_referencia and org_id = v_org;
  else
    select membro_id, status into v_dono, v_status from public.contribuicoes_festa where id = p_referencia and org_id = v_org;
  end if;
  if v_dono is null or v_dono <> v_membro then
    raise exception 'Esta cobrança não é sua' using errcode = '42501';
  end if;
  if v_status not in ('aberta', 'rejeitado') then
    raise exception 'Esta cobrança já está em análise ou confirmada' using errcode = '22023';
  end if;
  if p_data_pagamento is null or p_data_pagamento > current_date or p_data_pagamento < current_date - 400 then
    raise exception 'Data de pagamento inválida' using errcode = '22023';
  end if;

  v_prefixo := v_org || '/' || v_membro || '/' || p_tipo || '/' || p_referencia || '/';
  if p_storage_path is null or left(p_storage_path, char_length(v_prefixo)) <> v_prefixo
     or p_storage_path ~ '\.\.' then
    raise exception 'Caminho do arquivo inválido' using errcode = '22023';
  end if;

  -- o arquivo precisa existir no bucket e ter sido enviado por este usuário
  select o.metadata->>'mimetype', (o.metadata->>'size')::int into v_mime, v_tamanho
    from storage.objects o
   where o.bucket_id = 'comprovantes' and o.name = p_storage_path and o.owner_id = auth.uid()::text;
  if v_mime is null then raise exception 'Arquivo não encontrado' using errcode = '22023'; end if;

  -- comprovantes anteriores da mesma cobrança (rejeitados) ficam liberados para remoção
  update public.comprovantes set remover_em = now()
   where tipo = p_tipo and referencia_id = p_referencia and remover_em is null;

  insert into public.comprovantes (org_id, membro_id, tipo, referencia_id, storage_path, mime, tamanho)
  values (v_org, v_membro, p_tipo, p_referencia, p_storage_path, v_mime, v_tamanho);

  if p_tipo = 'mensalidade' then
    update public.mensalidades set status = 'pendente', data_pagamento = p_data_pagamento, motivo_rejeicao = null
     where id = p_referencia;
  else
    update public.contribuicoes_festa set status = 'pendente', data_pagamento = p_data_pagamento, motivo_rejeicao = null
     where id = p_referencia;
  end if;

  perform public.auditar('comprovante.enviado', p_tipo || ':' || p_referencia);
end $$;

-- ---------- Admin: confirmar / rejeitar / desfazer pagamento ----------
create or replace function public.decidir_pagamento(
  p_tipo text, p_id uuid, p_decisao text, p_motivo text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_admin uuid := public.membro_atual_id();
begin
  if p_tipo not in ('mensalidade', 'festa') then raise exception 'Tipo inválido' using errcode = '22023'; end if;
  if p_decisao not in ('confirmado', 'rejeitado', 'aberta') then raise exception 'Decisão inválida' using errcode = '22023'; end if;
  if p_decisao = 'rejeitado' and coalesce(btrim(p_motivo), '') = '' then
    raise exception 'Informe o motivo da rejeição' using errcode = '22023';
  end if;

  if p_tipo = 'mensalidade' then
    select org_id into v_org from public.mensalidades where id = p_id;
  else
    select org_id into v_org from public.contribuicoes_festa where id = p_id;
  end if;
  if v_org is null or not public.eh_admin_da(v_org) then
    raise exception 'Somente o administrador decide pagamentos' using errcode = '42501';
  end if;

  if p_tipo = 'mensalidade' then
    update public.mensalidades
       set status = p_decisao,
           motivo_rejeicao = case when p_decisao = 'rejeitado' then left(p_motivo, 300) end,
           decidido_por = case when p_decisao = 'aberta' then null else v_admin end,
           decidido_em = case when p_decisao = 'aberta' then null else now() end,
           data_pagamento = case when p_decisao = 'confirmado' then coalesce(data_pagamento, current_date)
                                 when p_decisao = 'aberta' then null else data_pagamento end
     where id = p_id;
  else
    update public.contribuicoes_festa
       set status = p_decisao,
           motivo_rejeicao = case when p_decisao = 'rejeitado' then left(p_motivo, 300) end,
           decidido_por = case when p_decisao = 'aberta' then null else v_admin end,
           decidido_em = case when p_decisao = 'aberta' then null else now() end,
           data_pagamento = case when p_decisao = 'confirmado' then coalesce(data_pagamento, current_date)
                                 when p_decisao = 'aberta' then null else data_pagamento end
     where id = p_id;
  end if;

  -- decidido = o comprovante não é mais necessário (privacidade: é apagado pela rotina)
  if p_decisao in ('confirmado', 'rejeitado') then
    update public.comprovantes set remover_em = now()
     where tipo = p_tipo and referencia_id = p_id and remover_em is null;
  end if;

  perform public.auditar('pagamento.' || p_decisao, p_tipo || ':' || p_id,
                         case when p_motivo is not null then jsonb_build_object('motivo', left(p_motivo, 300)) else '{}'::jsonb end);
end $$;

-- ---------- Mensalidades do mês (admin ou rotina automática) ----------
create or replace function public.gerar_mensalidades(p_competencia date default null) returns int
language plpgsql security definer set search_path = public as $$
declare v_comp date := date_trunc('month', coalesce(p_competencia, current_date))::date; v_qtd int;
begin
  if auth.uid() is not null and not public.eh_admin() then
    raise exception 'Somente o administrador' using errcode = '42501';
  end if;
  insert into public.mensalidades (org_id, membro_id, competencia, valor)
  select m.org_id, m.id, v_comp, coalesce(s.valor_mensalidade, 60)
    from public.membros m
    left join public.site_config s on s.org_id = m.org_id
   where m.status = 'ativo' and m.papel = 'filho'
     and (auth.uid() is null or m.org_id = public.minha_org())
  on conflict (membro_id, competencia) do nothing;
  get diagnostics v_qtd = row_count;
  return v_qtd;
end $$;

-- ---------- Rodízio quinzenal (admin) ----------
-- Cria rodadas a cada p_intervalo semanas, alternando os grupos em ordem.
-- Com 5 grupos e 26 rodadas/ano cada grupo (e cada filho) faz pelo menos 5 limpezas no ano.
create or replace function public.gerar_rodizio(p_inicio date, p_quantidade int default 26, p_intervalo int default 2)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := public.minha_org();
  v_grupos uuid[]; v_n int; v_idx int := 0; v_num int; v_criadas int := 0; v_inicio date; v_id uuid; i int;
  v_ultimo uuid;
begin
  if not public.eh_admin() then raise exception 'Somente o administrador' using errcode = '42501'; end if;
  if extract(isodow from p_inicio) <> 1 then raise exception 'A rodada começa numa segunda-feira' using errcode = '22023'; end if;
  if p_quantidade not between 1 and 60 or p_intervalo not between 1 and 4 then
    raise exception 'Parâmetros inválidos' using errcode = '22023';
  end if;

  select array_agg(id order by numero) into v_grupos from public.grupos where org_id = v_org;
  v_n := coalesce(array_length(v_grupos, 1), 0);
  if v_n = 0 then raise exception 'Cadastre os grupos antes' using errcode = '22023'; end if;

  -- continua do grupo seguinte ao da última rodada existente
  select grupo_id into v_ultimo from public.rodadas where org_id = v_org order by inicio desc limit 1;
  if v_ultimo is not null then v_idx := array_position(v_grupos, v_ultimo); end if;  -- 1-based → próximo
  select coalesce(max(numero), 0) into v_num from public.rodadas where org_id = v_org;

  for i in 0 .. p_quantidade - 1 loop
    v_inicio := p_inicio + (i * p_intervalo * 7);
    insert into public.rodadas (org_id, numero, grupo_id, inicio, fim, prazo_escolha)
    values (v_org, v_num + 1, v_grupos[(v_idx % v_n) + 1], v_inicio, v_inicio + 6, (v_inicio - interval '1 month')::date)
    on conflict (org_id, inicio) do nothing
    returning id into v_id;
    if v_id is not null then
      insert into public.rodada_locais (rodada_id, local_id, org_id)
      select v_id, l.id, v_org from public.locais l where l.org_id = v_org and l.ativo;
      v_num := v_num + 1; v_idx := v_idx + 1; v_criadas := v_criadas + 1;
    end if;
    v_id := null;
  end loop;

  perform public.auditar('rodizio.gerado', 'rodadas', jsonb_build_object('criadas', v_criadas, 'inicio', p_inicio));
  return v_criadas;
end $$;

-- ---------- Leituras com dados mínimos ----------
-- Colegas do meu grupo: só o nome (sem contatos)
create or replace function public.colegas_do_grupo()
returns table (nome text, sou_eu boolean)
language sql stable security definer set search_path = public as $$
  select m.nome, m.id = public.membro_atual_id()
    from public.membros m
   where m.grupo_id = public.meu_grupo() and m.status = 'ativo' and public.meu_grupo() is not null
   order by m.nome
$$;

-- Dias já escolhidos pelos colegas na rodada (para combinar a limpeza)
create or replace function public.escolhas_da_rodada(p_rodada uuid)
returns table (nome text, dia date)
language sql stable security definer set search_path = public as $$
  select m.nome, e.dia
    from public.escolhas_limpeza e
    join public.membros m on m.id = e.membro_id
    join public.rodadas r on r.id = e.rodada_id
   where e.rodada_id = p_rodada
     and (r.grupo_id = public.meu_grupo() or public.eh_admin_da(r.org_id))
   order by e.dia, m.nome
$$;

-- Aniversariantes da casa (nome + dia/mês)
create or replace function public.aniversariantes()
returns table (nome text, dia smallint, mes smallint)
language sql stable security definer set search_path = public as $$
  select m.nome, m.aniversario_dia, m.aniversario_mes
    from public.membros m
   where m.org_id = public.minha_org() and m.status = 'ativo'
     and m.aniversario_dia is not null and m.aniversario_mes is not null
   order by m.aniversario_mes, m.aniversario_dia
$$;

-- Limpezas feitas/agendadas no ano (meta: 5 por filho)
create or replace function public.minhas_limpezas_no_ano(p_ano int default null)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.escolhas_limpeza
   where membro_id = public.membro_atual_id()
     and extract(year from dia) = coalesce(p_ano, extract(year from current_date)::int)
$$;

create or replace function public.limpezas_por_filho(p_ano int default null)
returns table (membro_id uuid, nome text, grupo int, total int, meta int)
language sql stable security definer set search_path = public as $$
  select m.id, m.nome, g.numero,
         (select count(*)::int from public.escolhas_limpeza e
           where e.membro_id = m.id and extract(year from e.dia) = coalesce(p_ano, extract(year from current_date)::int)),
         coalesce(s.meta_limpezas_ano, 5)
    from public.membros m
    left join public.grupos g on g.id = m.grupo_id
    left join public.site_config s on s.org_id = m.org_id
   where m.org_id = public.minha_org() and public.eh_admin() and m.status = 'ativo' and m.papel = 'filho'
   order by g.numero nulls last, m.nome
$$;

-- Visitante (anon) não chama nenhuma destas funções; só usuários logados.
-- (No Postgres o EXECUTE vem liberado para PUBLIC por padrão: por isso o revoke de public.)
do $$
declare f text;
begin
  foreach f in array array[
    'vincular_meu_cadastro()', 'registrar_consentimento(text)', 'escolher_dia_limpeza(uuid, date)',
    'enviar_comprovante(text, uuid, text, date)', 'decidir_pagamento(text, uuid, text, text)',
    'gerar_mensalidades(date)', 'gerar_rodizio(date, int, int)', 'colegas_do_grupo()',
    'escolhas_da_rodada(uuid)', 'aniversariantes()', 'minhas_limpezas_no_ano(int)', 'limpezas_por_filho(int)',
    'membro_atual_id()', 'minha_org()', 'meu_grupo()', 'eh_admin()', 'eh_admin_da(uuid)']
  loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated, service_role', f);
  end loop;
end $$;
