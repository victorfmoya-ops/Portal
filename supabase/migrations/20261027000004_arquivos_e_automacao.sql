-- =====================================================================
-- 0004 · Arquivos (Storage) e automações agendadas
-- comprovantes: PRIVADO, só PDF/imagem, até 10 MB, pasta por filho.
-- galeria: PÚBLICO (fotos das festas no site), só imagem, até 5 MB.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('comprovantes', 'comprovantes', false, 10485760,
   array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic']),
  ('galeria', 'galeria', true, 5242880,
   array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Pasta do comprovante: <org>/<membro>/<tipo>/<referencia>/<arquivo>
create policy comprovante_envio_proprio on storage.objects for insert to authenticated
  with check (
    bucket_id = 'comprovantes'
    and (storage.foldername(name))[1] = public.minha_org()::text
    and (storage.foldername(name))[2] = public.membro_atual_id()::text
    and (storage.foldername(name))[3] in ('mensalidade', 'festa')
  );

create policy comprovante_leitura on storage.objects for select to authenticated
  using (
    bucket_id = 'comprovantes'
    and (
      (storage.foldername(name))[2] = public.membro_atual_id()::text
      or public.eh_admin_da(((storage.foldername(name))[1])::uuid)
    )
  );

create policy comprovante_admin_apaga on storage.objects for delete to authenticated
  using (bucket_id = 'comprovantes' and public.eh_admin_da(((storage.foldername(name))[1])::uuid));

-- Galeria: só admin publica/apaga (pasta = org)
create policy galeria_admin_envia on storage.objects for insert to authenticated
  with check (bucket_id = 'galeria' and public.eh_admin_da(((storage.foldername(name))[1])::uuid));
create policy galeria_admin_apaga on storage.objects for delete to authenticated
  using (bucket_id = 'galeria' and public.eh_admin_da(((storage.foldername(name))[1])::uuid));

-- ---------- Automação: mensalidades criadas sozinhas todo dia 1º ----------
-- (pg_cron vem no Supabase. Se não estiver disponível, a rotina do portal
--  /api/cron/gerar-mensalidades faz o mesmo — a função é idempotente.)
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('gerar-mensalidades', '5 3 1 * *', 'select public.gerar_mensalidades()');
  end if;
exception when others then
  raise notice 'pg_cron indisponível: %', sqlerrm;
end $$;
