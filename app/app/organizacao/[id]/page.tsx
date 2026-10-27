import Link from 'next/link';
import { notFound } from 'next/navigation';
import { alternarCompra, alternarTarefa, aplicarRateio, excluirCompra, excluirTarefa, salvarCompra, salvarTarefa } from '../../equipes/acoes';
import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { calcularRateio, totalCompras } from '@/lib/arrecadacao';
import { brl, diaSemana, diasAte, fmt } from '@/lib/datas';
import { exigirMembro } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

/** Organização de uma festa: tarefas de cada equipe e a arrecadação (compras ÷ filhos). */
export default async function Organizacao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, membro } = await exigirMembro();
  const admin = membro.papel === 'admin';
  const [{ data: festa }, { data: visao }, { data: tarefas }, { data: compras }, { data: filhos }, { data: arrecada }] = await Promise.all([
    supabase.from('festas').select('id, nome, data, valor').eq('id', id).maybeSingle(),
    supabase.rpc('equipes_visao', { p_festa: id }),
    supabase.from('festa_tarefas').select('id, equipe_id, descricao, feito').eq('festa_id', id).order('criado_em'),
    supabase.from('festa_compras').select('id, item, quantidade, valor_unitario, comprado').eq('festa_id', id).order('criado_em'),
    supabase.rpc('filhos_ativos'),
    supabase.rpc('pode_arrecadar'),
  ]);
  if (!festa) notFound();

  const voltar = `/app/organizacao/${id}`;
  const listaCompras = compras ?? [];
  const total = totalCompras(listaCompras);
  const comprado = totalCompras(listaCompras.filter((c) => c.comprado));
  const nFilhos = filhos ?? 0;
  const exato = calcularRateio(total, nFilhos, false);
  const arredondado = calcularRateio(total, nFilhos, true);
  const faltam = diasAte(festa.data);
  const equipes = visao ?? [];

  return (
    <AppShell titulo="Organização da festa" papel={membro.papel} voltar="/app/equipes" ativo="/app/equipes">
      <div className="card">
        <span className="pill now">{faltam > 1 ? `faltam ${faltam} dias` : faltam === 1 ? 'é amanhã' : faltam === 0 ? 'é hoje' : 'já passou'}</span>
        <h2 style={{ margin: '10px 0 2px', fontSize: 24, fontFamily: 'var(--font-tit)' }}>🎉 {festa.nome}</h2>
        <div className="muted">
          {fmt(festa.data)} ({diaSemana(festa.data)}) · contribuição atual: <b>{Number(festa.valor) > 0 ? `${brl(festa.valor)} por filho` : 'não calculada'}</b>
        </div>
      </div>

      <div className="card">
        <h3>💰 Arrecadação · lista de compras</h3>
        {listaCompras.length ? (
          listaCompras.map((c) => (
            <div key={c.id} className="local">
              {arrecada ? (
                <form action={alternarCompra}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="voltar" value={voltar} />
                  <button className={`check${c.comprado ? ' done' : ''}`} type="submit" aria-label={c.comprado ? 'Marcar como não comprado' : 'Marcar como comprado'}>
                    {c.comprado ? '✓' : ''}
                  </button>
                </form>
              ) : (
                <span className={`check${c.comprado ? ' done' : ''}`} aria-hidden>
                  {c.comprado ? '✓' : ''}
                </span>
              )}
              <span style={{ flex: 1, minWidth: 0 }}>
                <b style={{ textDecoration: c.comprado ? 'line-through' : undefined }}>{c.item}</b>
                <br />
                <span className="muted">
                  {Number(c.quantidade).toLocaleString('pt-BR')} × {brl(c.valor_unitario)} = <b>{brl(Number(c.quantidade) * Number(c.valor_unitario))}</b>
                </span>
              </span>
              {arrecada ? (
                <form action={excluirCompra}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="voltar" value={voltar} />
                  <BotaoEnviar className="btn ghost small" confirmar={`Excluir "${c.item}"?`}>
                    ✕
                  </BotaoEnviar>
                </form>
              ) : null}
            </div>
          ))
        ) : (
          <div className="muted">Nenhum item na lista de compras ainda.</div>
        )}

        {arrecada ? (
          <details>
            <summary>+ Adicionar item</summary>
            <form action={salvarCompra} style={{ marginTop: 10 }}>
              <input type="hidden" name="festa_id" value={id} />
              <input type="hidden" name="voltar" value={voltar} />
              <label className="f">
                <span>Item</span>
                <input name="item" maxLength={120} required placeholder="Ex.: Flores para o barracão" />
              </label>
              <div className="two">
                <label className="f">
                  <span>Quantidade</span>
                  <input name="quantidade" type="number" min="0.01" step="0.01" defaultValue="1" required />
                </label>
                <label className="f">
                  <span>Valor unitário (R$)</span>
                  <input name="valor_unitario" type="number" min="0" step="0.01" required inputMode="decimal" />
                </label>
              </div>
              <BotaoEnviar>Adicionar à lista</BotaoEnviar>
            </form>
          </details>
        ) : null}
      </div>

      <div className="card">
        <h3>🧮 Cálculo da contribuição</h3>
        <div className="item row between">
          <span>Total das compras</span>
          <b>{brl(total)}</b>
        </div>
        <div className="item row between">
          <span>Já comprado</span>
          <span>
            {brl(comprado)} <span className="muted">· falta {brl(total - comprado)}</span>
          </span>
        </div>
        <div className="item row between">
          <span>Filhos ativos que dividem</span>
          <b>{nFilhos}</b>
        </div>
        <div className="item row between">
          <span>Valor exato por filho</span>
          <span>{brl(exato)}</span>
        </div>
        <div className="item row between">
          <span>Arredondado para cima</span>
          <b style={{ color: 'var(--gold-2)', fontSize: 18 }}>{brl(arredondado)}</b>
        </div>
        {arrecada ? (
          <form action={aplicarRateio} style={{ marginTop: 10 }}>
            <input type="hidden" name="festa_id" value={id} />
            <input type="hidden" name="voltar" value={voltar} />
            <label className="inline">
              <input type="checkbox" name="arredondar" defaultChecked /> Arredondar para reais inteiros (a sobra fica no caixa da festa)
            </label>
            <BotaoEnviar className="btn green" confirmar="Definir este valor como a contribuição de cada filho nesta festa?">
              Definir a contribuição de cada filho
            </BotaoEnviar>
            <div className="note">
              Cria a cobrança da festa para todos os filhos ativos e atualiza quem ainda não pagou. Quem já pagou não é alterado.
            </div>
          </form>
        ) : (
          <div className="note">Quem define o valor é o coordenador da equipe de arrecadação.</div>
        )}
      </div>

      <h3 style={{ margin: '18px 4px 10px', fontFamily: 'var(--font-tit)' }}>📋 Tarefas de cada equipe</h3>
      {equipes.length ? (
        equipes.map((e) => {
          const lista = (tarefas ?? []).filter((t) => t.equipe_id === e.id);
          const coordena = admin || e.coordenador_id === membro.id;
          const marca = coordena || membro.equipe_id === e.id;
          const pct = e.tarefas ? Math.round((e.feitas / e.tarefas) * 100) : 0;
          return (
            <div key={e.id} className="card">
              <div className="row between">
                <h3 style={{ margin: 0 }}>
                  {e.arrecadacao ? '💰 ' : ''}
                  {e.nome}
                </h3>
                <span className="muted">
                  {e.feitas}/{e.tarefas}
                </span>
              </div>
              <div className="muted">Coordenação: {e.coordenador_nome ?? 'a definir'}</div>
              <div className="progresso">
                <div style={{ width: `${pct}%` }} />
              </div>
              <div style={{ marginTop: 8 }}>
                {lista.length ? (
                  lista.map((t) => (
                    <div key={t.id} className="local">
                      {marca ? (
                        <form action={alternarTarefa}>
                          <input type="hidden" name="id" value={t.id} />
                          <input type="hidden" name="voltar" value={voltar} />
                          <button className={`check${t.feito ? ' done' : ''}`} type="submit" aria-label={t.feito ? 'Desmarcar' : 'Marcar como feita'}>
                            {t.feito ? '✓' : ''}
                          </button>
                        </form>
                      ) : (
                        <span className={`check${t.feito ? ' done' : ''}`} aria-hidden>
                          {t.feito ? '✓' : ''}
                        </span>
                      )}
                      <span style={{ flex: 1, textDecoration: t.feito ? 'line-through' : undefined, opacity: t.feito ? 0.7 : 1 }}>{t.descricao}</span>
                      {coordena ? (
                        <form action={excluirTarefa}>
                          <input type="hidden" name="id" value={t.id} />
                          <input type="hidden" name="voltar" value={voltar} />
                          <BotaoEnviar className="btn ghost small" confirmar="Excluir esta tarefa?">
                            ✕
                          </BotaoEnviar>
                        </form>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="muted">Nenhuma tarefa para esta festa.</div>
                )}
              </div>
              {coordena ? (
                <form action={salvarTarefa} className="actions" style={{ flexWrap: 'nowrap' }}>
                  <input type="hidden" name="festa_id" value={id} />
                  <input type="hidden" name="equipe_id" value={e.id} />
                  <input type="hidden" name="voltar" value={voltar} />
                  <input name="descricao" maxLength={200} required placeholder="Nova tarefa…" aria-label={`Nova tarefa para ${e.nome}`} />
                  <BotaoEnviar className="btn small">+</BotaoEnviar>
                </form>
              ) : null}
            </div>
          );
        })
      ) : (
        <div className="card">
          <div className="muted">
            Nenhuma equipe criada. <Link href="/app/equipes">Criar equipes</Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
