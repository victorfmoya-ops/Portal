-- =====================================================================
-- Testes de segurança (pgTAP): matriz de permissões do portal.
-- Regra: o FILHO só grava 3 coisas (comprovante de mensalidade, comprovante
-- de festa e dia da limpeza) e só por funções; nunca direto nas tabelas.
-- Rodar: carregue antes infra/ci/dados-de-teste.sql (dados fictícios) e depois npx supabase test db
-- =====================================================================
begin;
select plan(39);

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
select is((select count(*)::int from public.comprovantes), 0, 'filho não vê comprovantes, nem os próprios (só o admin)');
select is((select count(*)::int from storage.objects where bucket_id = 'comprovantes'), 0, 'filho não abre arquivos de comprovante');

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

-- 📖 espaço de aprendizado: filho lê, mas sem cargo de ensino não publica
select lives_ok($$ select count(*) from public.licoes $$, 'filho lê o espaço de aprendizado');
select throws_ok($$ select public.salvar_licao(null, 'cantigas', 'Cantiga', 'letra') $$,
                 '42501', null, 'filho sem cargo de ensino não publica lição');
select throws_ok($$ insert into public.licoes (org_id, categoria, titulo, conteudo, autor_nome)
                    values (public.minha_org(), 'regras', 'Regra', 'texto', 'eu') $$,
                 '42501', null, 'ninguém grava lição direto na tabela');

-- 🤝 equipes e arrecadação: filho comum não monta compras, não faz rateio nem cria tarefa
select throws_ok($$ select public.salvar_compra((select id from public.festas limit 1), 'Flores', 1, 10) $$,
                 '42501', null, 'filho sem coordenação não monta a lista de compras');
select throws_ok($$ select public.aplicar_rateio((select id from public.festas limit 1)) $$,
                 '42501', null, 'filho sem coordenação não define a contribuição');
select throws_ok($$ select public.salvar_tarefa((select id from public.festas limit 1), (select id from public.equipes limit 1), 'Tarefa') $$,
                 '42501', null, 'filho sem coordenação não cria tarefa');

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

select lives_ok($$ select public.salvar_licao(null, 'cantigas', 'Cantiga de Oxóssi', 'letra') $$, 'admin publica lição');

-- admin monta a compra e faz o rateio: total ÷ filhos ativos, para cima
select lives_ok($$ select public.salvar_compra((select id from public.festas where nome = 'Ipetê da Oxum'), 'Flores', 3, 100.50) $$,
                'admin adiciona item à lista de compras');
select is((public.aplicar_rateio((select id from public.festas where nome = 'Ipetê da Oxum')) ->> 'valor')::numeric,
          ceil(301.50 / public.filhos_ativos()), 'rateio divide o total pelos filhos ativos, arredondando para cima');
select is((select count(*)::int from public.contribuicoes_festa c join public.festas f on f.id = c.festa_id
            where f.nome = 'Ipetê da Oxum' and c.status = 'aberta' and c.valor <> f.valor), 0,
          'contribuições em aberto recebem o novo valor');
select lives_ok($$ select public.salvar_tarefa((select id from public.festas limit 1), (select id from public.equipes limit 1), 'Comprar flores') $$,
                'admin cria tarefa para a equipe');

-- filho que coordena a arrecadação monta compras e define a contribuição
update public.equipes set coordenador_id = (select id from public.membros where email = 'filho1@exemplo.test') where arrecadacao;
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated"}', true);
select lives_ok($$ select public.salvar_compra((select id from public.festas limit 1), 'Velas', 10, 4) $$,
                'coordenador(a) da arrecadação monta a lista de compras');
select lives_ok($$ select public.aplicar_rateio((select id from public.festas limit 1), false) $$,
                'coordenador(a) da arrecadação define a contribuição');

select * from finish();
rollback;
