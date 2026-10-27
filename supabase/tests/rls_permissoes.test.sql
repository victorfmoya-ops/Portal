-- =====================================================================
-- Testes de segurança (pgTAP): matriz de permissões do portal.
-- Regra: o FILHO só grava 3 coisas (comprovante de mensalidade, comprovante
-- de festa e dia da limpeza) e só por funções; nunca direto nas tabelas.
-- Rodar: npx supabase test db   (usa os dados fictícios do seed)
-- =====================================================================
begin;
select plan(24);

-- ---------- Visitante (anon) ----------
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select is((select count(*)::int from public.membros), 0, 'visitante não vê nenhum filho');
select ok((select count(*) from public.eventos) >= 1, 'visitante vê a agenda pública de toques');
select is((select count(*)::int from public.caixa_lancamentos), 0, 'visitante não vê o caixa');
select throws_ok($$ select public.escolher_dia_limpeza(gen_random_uuid(), current_date) $$, '42501', null, 'visitante não chama funções do portal');

-- ---------- Filho (Ana, Grupo 1) ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated"}';

select is((select count(*)::int from public.membros), 1, 'filho vê só o próprio cadastro');
select is((select count(*)::int from public.caixa_lancamentos), 0, 'filho não vê o caixa da casa');
select is((select count(*)::int from public.areas_restritas), 0, 'filho não vê áreas restritas');
select is((select count(*)::int from public.log_auditoria), 0, 'filho não vê a auditoria');
select ok((select bool_and(g.numero = 1) from public.rodadas r join public.grupos g on g.id = r.grupo_id), 'filho vê só rodadas do seu grupo');
select is((select count(*)::int from public.mensalidades where membro_id <> public.membro_atual_id()), 0, 'filho não vê mensalidade dos outros');

-- escrita direta: bloqueada (RLS)
select throws_ok($$ insert into public.mensalidades (org_id, membro_id, competencia, valor)
                    values ('11111111-1111-1111-1111-111111111111', public.membro_atual_id(), date '2030-01-01', 0) $$,
                 '42501', null, 'filho não cria mensalidade direto');
update public.mensalidades set status = 'confirmado' where membro_id = public.membro_atual_id();
select is((select count(*)::int from public.mensalidades where membro_id = public.membro_atual_id() and status = 'confirmado' and competencia = date '2026-10-01'), 0,
          'filho não marca a própria mensalidade como paga');
update public.membros set papel = 'admin' where id = public.membro_atual_id();
select is((select papel from public.membros where id = public.membro_atual_id()), 'filho', 'filho não vira admin');
update public.fichas set orisa = 'alterado' where membro_id = public.membro_atual_id();
select isnt((select orisa from public.fichas where membro_id = public.membro_atual_id()), 'alterado', 'filho não edita a ficha (somente leitura)');
select throws_ok($$ insert into public.escolhas_limpeza (org_id, rodada_id, membro_id, dia)
                    select org_id, id, public.membro_atual_id(), inicio from public.rodadas limit 1 $$,
                 '42501', null, 'filho não grava escolha de dia direto na tabela');

-- ✍️ escolher o dia: só no próprio grupo, dentro da semana e antes do prazo (1 mês antes)
select lives_ok($$ select public.escolher_dia_limpeza(
                     (select id from public.rodadas where inicio = date '2027-01-25'), date '2027-01-30') $$,
                'filho escolhe o dia numa rodada do seu grupo dentro do prazo');
select is((select dia from public.escolhas_limpeza where membro_id = public.membro_atual_id()), date '2027-01-30', 'escolha gravada');
select throws_ok($$ select public.escolher_dia_limpeza(
                      (select id from public.rodadas where inicio = date '2027-01-25'), date '2027-02-05') $$,
                 '22023', null, 'dia fora da semana da rodada é recusado');
select throws_ok($$ select public.escolher_dia_limpeza(
                      (select id from public.rodadas where inicio = date '2026-11-16'), date '2026-11-20') $$,
                 '22023', null, 'depois do prazo (1 mês antes) o filho não escolhe mais');

-- ✍️ comprovante: só para cobrança própria
select throws_ok($$ select public.enviar_comprovante('mensalidade',
                      (select id from public.mensalidades limit 1), 'caminho/falso.pdf', current_date) $$,
                 '22023', null, 'comprovante exige arquivo no caminho certo do próprio filho');

-- ---------- Outro filho tentando a rodada do Grupo 1 ----------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000099","role":"authenticated"}', true);
select is(public.membro_atual_id(), null, 'usuário sem cadastro não tem acesso');

-- ---------- Admin ----------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', true);
select ok((select count(*) from public.membros) >= 12, 'admin vê todos os cadastros');
select lives_ok($$ select public.decidir_pagamento('mensalidade',
                     (select id from public.mensalidades where status = 'aberta' limit 1), 'confirmado') $$,
                'admin confirma pagamento');
select throws_ok($$ select public.decidir_pagamento('mensalidade',
                      (select id from public.mensalidades where status = 'aberta' limit 1), 'rejeitado', '') $$,
                 '22023', null, 'recusa exige motivo');

select * from finish();
rollback;
