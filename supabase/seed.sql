-- =====================================================================
-- SEED — SOMENTE OS DADOS REAIS DA CASA (sem pessoas, sem valores de exemplo)
-- Organização, site, grupos, locais da limpeza, rodízio e agenda da casa.
-- Os filhos e administradores são cadastrados pelo painel
-- (o 1º admin local: scripts\criar-admin.ps1).
-- Dados fictícios para os testes automáticos: infra/ci/dados-de-teste.sql
-- =====================================================================
do $$
declare
  v_org uuid := '11111111-1111-1111-1111-111111111111';
  v_grupos uuid[];
  v_inicio date := date '2026-09-07';
  v_rod uuid; i int;
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

  -- Calendário de funções / obrigações
  insert into public.funcoes (org_id, titulo, data, hora, referencia) values
    (v_org, 'Oro para os santos da casa', date '2026-10-15', '18:00', 'Preparação do Ipetê da Oxum (17/10)');

  -- Festa da casa
  insert into public.festas (org_id, nome, data, valor) values (v_org, 'Ipetê da Oxum', date '2026-10-17', 70);

  -- Equipe de arrecadação das festas (o coordenador e as demais equipes são definidos pelo painel)
  insert into public.equipes (org_id, nome, descricao, arrecadacao)
  values (v_org, 'Arrecadação', 'Lista de compras das festas e cálculo da contribuição de cada filho', true);

  -- Áreas restritas (as pessoas são escolhidas pelo painel)
  insert into public.areas_restritas (org_id, nome) values (v_org, 'Casa dos Exus / Orixá do tempo e rua');
end $$;
