-- =====================================================================
-- DADOS 100% FICTÍCIOS (@exemplo.test) — SOMENTE PARA OS TESTES AUTOMÁTICOS
-- (esteira, pgTAP e Playwright). Roda DEPOIS do supabase/seed.sql.
-- Nunca carregue este arquivo no banco de produção.
--   admin@exemplo.test  /  Axe2026demo   (administrador)
--   filho1@exemplo.test /  Axe2026demo   (filho, Grupo 1)
-- Local: docker exec -i supabase_db_portal-ase psql -U postgres -d postgres < infra/ci/dados-de-teste.sql
-- =====================================================================
do $$
declare
  v_org uuid := (select id from public.organizacoes where slug = 'omos-ode');
  v_admin_user uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_filho_user uuid := 'aaaaaaaa-0000-0000-0000-000000000002';
  v_grupos uuid[];
  v_func uuid;
begin
  select array_agg(id order by numero) into v_grupos from public.grupos where org_id = v_org;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, email_change, email_change_token_new, recovery_token)
  values
    ('00000000-0000-0000-0000-000000000000', v_admin_user, 'authenticated', 'authenticated', 'admin@exemplo.test',
     extensions.crypt('Axe2026demo', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_filho_user, 'authenticated', 'authenticated', 'filho1@exemplo.test',
     extensions.crypt('Axe2026demo', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values
    (gen_random_uuid(), v_admin_user, v_admin_user::text,
     jsonb_build_object('sub', v_admin_user::text, 'email', 'admin@exemplo.test', 'email_verified', true), 'email', now(), now(), now()),
    (gen_random_uuid(), v_filho_user, v_filho_user::text,
     jsonb_build_object('sub', v_filho_user::text, 'email', 'filho1@exemplo.test', 'email_verified', true), 'email', now(), now(), now());

  insert into public.membros (org_id, user_id, email, nome, papel, grupo_id) values
    (v_org, v_admin_user, 'admin@exemplo.test', 'Administração (exemplo)', 'admin', null),
    (v_org, v_filho_user, 'filho1@exemplo.test', 'Ana Ribeiro (exemplo)', 'filho', v_grupos[1]);

  insert into public.membros (org_id, email, nome, grupo_id, aniversario_dia, aniversario_mes) values
    (v_org, 'filho2@exemplo.test',  'Bruno Lima (exemplo)',      v_grupos[1], 12, 5),
    (v_org, 'filho3@exemplo.test',  'Carla Souza (exemplo)',     v_grupos[1], 3, 11),
    (v_org, 'filho4@exemplo.test',  'Diego Alves (exemplo)',     v_grupos[2], 21, 1),
    (v_org, 'filho5@exemplo.test',  'Elisa Rocha (exemplo)',     v_grupos[2], null, null),
    (v_org, 'filho6@exemplo.test',  'Fábio Nunes (exemplo)',     v_grupos[3], 9, 8),
    (v_org, 'filho7@exemplo.test',  'Gabriela Dias (exemplo)',   v_grupos[3], null, null),
    (v_org, 'filho8@exemplo.test',  'Heitor Costa (exemplo)',    v_grupos[4], 30, 10),
    (v_org, 'filho9@exemplo.test',  'Iara Martins (exemplo)',    v_grupos[4], null, null),
    (v_org, 'filho10@exemplo.test', 'João Pereira (exemplo)',    v_grupos[5], 17, 12),
    (v_org, 'filho11@exemplo.test', 'Kátia Gomes (exemplo)',     v_grupos[5], null, null);

  update public.fichas set zelador = 'Zelador(a) da casa (exemplo)', orisa = 'Ogum', iniciado = true,
         dt_iniciacao = date '2015-03-20', dt_1ano = date '2016-03-20', dt_3anos = date '2018-03-20',
         endereco = 'Rua Fictícia, 100 — Centro', whatsapp = '11900000000'
   where membro_id = (select id from public.membros where email = 'filho1@exemplo.test');

  insert into public.funcoes (org_id, titulo, data, hora, referencia)
  values (v_org, 'Preparação do barracão (exemplo)', date '2026-11-12', '19:00', 'Antes do Toque de Exu (14/11)')
  returning id into v_func;
  insert into public.funcao_responsaveis (funcao_id, membro_id, org_id)
  select v_func, id, v_org from public.membros where email in ('filho1@exemplo.test', 'filho4@exemplo.test');

  -- contribuição dos filhos fictícios na festa que já existe no seed
  insert into public.contribuicoes_festa (org_id, festa_id, membro_id, valor)
  select v_org, f.id, m.id, f.valor
    from public.festas f, public.membros m
   where f.org_id = v_org and m.org_id = v_org and m.papel = 'filho' and m.status = 'ativo'
  on conflict do nothing;

  insert into public.caixa_lancamentos (org_id, tipo, descricao, categoria, valor, data) values
    (v_org, 'receita', 'Mensalidades recebidas', 'Mensalidades', 450, date '2026-10-05'),
    (v_org, 'receita', 'Doação de filho', 'Doações', 200, date '2026-10-08'),
    (v_org, 'despesa', 'Conta de luz', 'Contas da casa', 230.50, date '2026-10-10'),
    (v_org, 'despesa', 'Materiais de limpeza', 'Limpeza', 120, date '2026-10-12'),
    (v_org, 'despesa', 'Obrigação / axé', 'Obrigações', 300, date '2026-10-14');

  insert into public.area_restrita_pessoas (area_id, membro_id, org_id, papel)
  select a.id, m.id, v_org, case when m.email = 'filho6@exemplo.test' then 'responsavel' else 'apoio' end
    from public.areas_restritas a, public.membros m
   where a.org_id = v_org and m.email in ('filho6@exemplo.test', 'filho8@exemplo.test');

  insert into public.midia (org_id, tipo, titulo, url) values
    (v_org, 'video', 'Vídeo da festa (exemplo)', 'https://www.youtube.com/');
end $$;

select public.gerar_mensalidades(date '2026-09-01');
select public.gerar_mensalidades(date '2026-10-01');
update public.mensalidades set status = 'confirmado', data_pagamento = date '2026-09-10', decidido_em = now()
 where competencia = date '2026-09-01';
