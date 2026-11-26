-- =====================================================================
-- 0007 · Comprovantes: SÓ O ADMINISTRADOR vê e eles ficam guardados 6 MESES
-- Regra de negócio (pedido da casa, 26/11/2026):
--  * o filho ENVIA o comprovante (mensalidade ou ajuda em festa), mas não
--    consegue mais abrir nem listar comprovantes, nem os dele;
--  * só o administrador da casa vê o que cada filho enviou, organizado por mês;
--  * cada comprovante do que foi contribuído (em análise ou confirmado) fica guardado
--    por até 6 meses a contar do envio e depois é apagado pela rotina automática;
--  * comprovante recusado ou substituído por um novo não é contribuição: é apagado logo.
-- =====================================================================

-- ---------- Prazo de guarda: 6 meses a partir do envio ----------
alter table public.comprovantes alter column remover_em set default (now() + interval '6 months');

-- comprovantes que ainda estão guardados passam a seguir o prazo novo
update public.comprovantes
   set remover_em = enviado_em + interval '6 months'
 where remover_em is null;

alter table public.comprovantes alter column remover_em set not null;
create index if not exists comprovantes_envio_idx on public.comprovantes (org_id, enviado_em desc);
create index if not exists comprovantes_remover_idx on public.comprovantes (remover_em);

comment on column public.comprovantes.remover_em is
  'Quando o arquivo é apagado: envio + 6 meses; agora, se recusado ou substituído.';

-- ---------- Leitura: somente administrador (tabela e arquivo) ----------
drop policy if exists comprovantes_ler on public.comprovantes;
create policy comprovantes_ler on public.comprovantes for select to authenticated
  using (public.eh_admin_da(org_id));

drop policy if exists comprovante_leitura on storage.objects;
create policy comprovante_leitura on storage.objects for select to authenticated
  using (bucket_id = 'comprovantes' and public.eh_admin_da(((storage.foldername(name))[1])::uuid));

-- ---------- Envio pelo filho (mesmas regras de antes + prazo de guarda) ----------
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

  select o.metadata->>'mimetype', (o.metadata->>'size')::int into v_mime, v_tamanho
    from storage.objects o
   where o.bucket_id = 'comprovantes' and o.name = p_storage_path and o.owner_id = auth.uid()::text;
  if v_mime is null then raise exception 'Arquivo não encontrado' using errcode = '22023'; end if;

  -- comprovante anterior da mesma cobrança (recusado) foi substituído: apaga logo
  update public.comprovantes set remover_em = now()
   where tipo = p_tipo and referencia_id = p_referencia and remover_em > now();

  insert into public.comprovantes (org_id, membro_id, tipo, referencia_id, storage_path, mime, tamanho, remover_em)
  values (v_org, v_membro, p_tipo, p_referencia, p_storage_path, v_mime, v_tamanho, now() + interval '6 months');

  if p_tipo = 'mensalidade' then
    update public.mensalidades set status = 'pendente', data_pagamento = p_data_pagamento, motivo_rejeicao = null
     where id = p_referencia;
  else
    update public.contribuicoes_festa set status = 'pendente', data_pagamento = p_data_pagamento, motivo_rejeicao = null
     where id = p_referencia;
  end if;

  perform public.auditar('comprovante.enviado', p_tipo || ':' || p_referencia);
end $$;

-- ---------- Admin decide: confirmado guarda 6 meses; recusado apaga logo ----------
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

  -- recusado não é contribuição: o comprovante é apagado pela rotina na próxima passada
  if p_decisao = 'rejeitado' then
    update public.comprovantes set remover_em = now()
     where tipo = p_tipo and referencia_id = p_id and remover_em > now();
  end if;

  perform public.auditar('pagamento.' || p_decisao, p_tipo || ':' || p_id,
                         case when p_motivo is not null then jsonb_build_object('motivo', left(p_motivo, 300)) else '{}'::jsonb end);
end $$;

-- as permissões de execução das funções continuam as mesmas da 0003
-- (create or replace mantém os grants existentes)
