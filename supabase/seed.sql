-- =====================================================================
-- SEED DE DESENVOLVIMENTO — DADOS 100% FICTÍCIOS (@exemplo.test)
-- Nunca coloque nomes, e-mails ou telefones reais aqui.
-- Contas de demonstração (somente no ambiente local):
--   admin@exemplo.test  /  Axe2026demo   (administrador)
--   filho1@exemplo.test /  Axe2026demo   (filho, Grupo 1)
-- =====================================================================
do $$
declare
  v_org uuid := '11111111-1111-1111-1111-111111111111';
  v_admin_user uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_filho_user uuid := 'aaaaaaaa-0000-0000-0000-000000000002';
  v_grupos uuid[];
  v_inicio date := date '2026-09-07';
  v_rod uuid; i int;
  v_festa uuid; v_func uuid;
begin
  insert into public.organizacoes (id, slug, nome)
  values (v_org, 'omos-ode', 'Centro Cultural Família Àṣẹ Omos Odé');

  insert into public.site_config (org_id, hero_titulo, hero_subtitulo, sobre, whatsapp, endereco)
  values (v_org, 'fé, axé e tradição', 'Centro Cultural Família Àṣẹ Omos Odé · desde 1980',
    'Fundado em 25 de abril de 1980, o Centro Cultural Família Àṣẹ Omos Odé é uma casa de axé dedicada a Odé/Oxóssi, Oxum e Obaluaê (Azauani). São 45 anos de história, acolhimento e respeito à ancestralidade — um espaço de fé, comunidade e tradição.',
    '5511976831500', 'Rua Cascata Alegre, 23 — Vila Espanhola, São Paulo — SP');

  insert into public.grupos (org_id, numero, nome)
  select v_org, n, 'Grupo ' || n from generate_series(1, 5) n;
  select array_agg(id order by numero) into v_grupos from public.grupos where org_id = v_org;

  insert into public.locais (org_id, nome, ordem, restrito) values
    (v_org, 'Limpeza geral', 1, false), (v_org, 'Banheiros', 2, false), (v_org, 'Cozinha', 3, false),
    (v_org, 'Salão / Quintal', 4, false), (v_org, 'Casa dos Exus / Orixá do tempo e rua', 5, true);

  -- Contas de login de demonstração (e-mail já confirmado)
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

  -- Rodízio quinzenal: 26 rodadas a partir de 07/09/2026, grupos 1→5 em ordem
  for i in 0 .. 25 loop
    insert into public.rodadas (org_id, numero, grupo_id, inicio, fim, prazo_escolha)
    values (v_org, i + 1, v_grupos[(i % 5) + 1], v_inicio + i * 14, v_inicio + i * 14 + 6,
            (v_inicio + i * 14 - interval '1 month')::date)
    returning id into v_rod;
    insert into public.rodada_locais (rodada_id, local_id, org_id)
    select v_rod, id, v_org from public.locais where org_id = v_org;
  end loop;

  -- Calendário de toques (agenda pública)
  insert into public.eventos (org_id, titulo, data, observacao, publico) values
    (v_org, 'Ipetê da Oxum', date '2026-10-17', 'Aberto à comunidade', true),
    (v_org, 'Toque de Exu', date '2026-11-14', null, true);

  -- Calendário de funções
  insert into public.funcoes (org_id, titulo, data, hora, referencia) values
    (v_org, 'Oro para os santos da casa', date '2026-10-15', '18:00', 'Preparação do Ipetê da Oxum (17/10)');
  insert into public.funcoes (org_id, titulo, data, hora, referencia)
  values (v_org, 'Preparação do barracão (exemplo)', date '2026-11-12', '19:00', 'Antes do Toque de Exu (14/11)')
  returning id into v_func;
  insert into public.funcao_responsaveis (funcao_id, membro_id, org_id)
  select v_func, id, v_org from public.membros where email in ('filho1@exemplo.test', 'filho4@exemplo.test');

  -- Festa (cria a contribuição de cada filho automaticamente)
  insert into public.festas (org_id, nome, data, valor) values (v_org, 'Ipetê da Oxum', date '2026-10-17', 70)
  returning id into v_festa;

  -- Caixa da casa (valores de exemplo)
  insert into public.caixa_lancamentos (org_id, tipo, descricao, categoria, valor, data) values
    (v_org, 'receita', 'Mensalidades recebidas', 'Mensalidades', 450, date '2026-10-05'),
    (v_org, 'receita', 'Doação de filho', 'Doações', 200, date '2026-10-08'),
    (v_org, 'despesa', 'Conta de luz', 'Contas da casa', 230.50, date '2026-10-10'),
    (v_org, 'despesa', 'Materiais de limpeza', 'Limpeza', 120, date '2026-10-12'),
    (v_org, 'despesa', 'Obrigação / axé', 'Obrigações', 300, date '2026-10-14');

  -- Áreas restritas
  insert into public.areas_restritas (org_id, nome) values (v_org, 'Casa dos Exus / Orixá do tempo e rua');
  insert into public.area_restrita_pessoas (area_id, membro_id, org_id, papel)
  select a.id, m.id, v_org, case when m.email = 'filho6@exemplo.test' then 'responsavel' else 'apoio' end
    from public.areas_restritas a, public.membros m
   where a.org_id = v_org and m.email in ('filho6@exemplo.test', 'filho8@exemplo.test');

  -- Galeria: vídeo de exemplo (fotos são enviadas pelo painel)
  insert into public.midia (org_id, tipo, titulo, url) values
    (v_org, 'video', 'Vídeo da festa (exemplo)', 'https://www.youtube.com/');
end $$;

-- Mensalidades de setembro e outubro/2026 (algumas já confirmadas, para o painel ter dados)
select public.gerar_mensalidades(date '2026-09-01');
select public.gerar_mensalidades(date '2026-10-01');
update public.mensalidades set status = 'confirmado', data_pagamento = date '2026-09-10', decidido_em = now()
 where competencia = date '2026-09-01';
