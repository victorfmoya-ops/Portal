import Link from 'next/link';
import { excluirLancamento, gerarMensalidades, salvarLancamento } from '../acoes';
import { AcoesPagamento } from '@/components/AcoesPagamento';
import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { StatusPagamento } from '@/components/Status';
import { brl, fmt, hojeISO, limitesDoMes, mesAnterior, mesSeguinte, mesValido, nomeMes } from '@/lib/datas';
import { exigirAdmin } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

export default async function Financeiro({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { supabase } = await exigirAdmin();
  const mes = mesValido((await searchParams).mes);
  const { de, ate } = limitesDoMes(mes);
  const voltar = `/app/admin/financeiro?mes=${mes}`;

  const [todos, doMes, mens, cfg] = await Promise.all([
    supabase.from('caixa_lancamentos').select('tipo, valor').limit(10000),
    supabase.from('caixa_lancamentos').select('id, tipo, descricao, categoria, valor, data').gte('data', de).lte('data', ate).order('data', { ascending: false }),
    supabase
      .from('mensalidades')
      .select('id, status, valor, data_pagamento, membro:membros!mensalidades_membro_id_fkey(nome)')
      .eq('competencia', `${mes}-01`)
      .order('status'),
    supabase.from('site_config').select('valor_mensalidade').maybeSingle(),
  ]);
  const soma = (lista: { tipo: string; valor: number }[] | null, tipo: string) =>
    (lista ?? []).filter((l) => l.tipo === tipo).reduce((s, l) => s + Number(l.valor), 0);
  const saldoGeral = soma(todos.data, 'receita') - soma(todos.data, 'despesa');
  const receitasMes = soma(doMes.data, 'receita');
  const despesasMes = soma(doMes.data, 'despesa');

  const lista = [...(mens.data ?? [])].sort((a, b) => (a.membro?.nome ?? '').localeCompare(b.membro?.nome ?? ''));
  const pendentesIds = lista.filter((m) => m.status === 'pendente').map((m) => m.id);
  const { data: comps } = pendentesIds.length
    ? await supabase.from('comprovantes').select('id, referencia_id').eq('tipo', 'mensalidade').in('referencia_id', pendentesIds).is('remover_em', null)
    : { data: [] as { id: string; referencia_id: string }[] };
  const compPor = new Map((comps ?? []).map((c) => [c.referencia_id, c.id]));
  const conta = (s: string) => lista.filter((m) => m.status === s).length;
  const recebido = lista.filter((m) => m.status === 'confirmado').reduce((s, m) => s + Number(m.valor), 0);

  return (
    <AppShell titulo="Administração" papel="admin" voltar="/app/admin" ativo="/app/admin/financeiro">
      <div className="card">
        <div className="cal-nav">
          <Link href={`/app/admin/financeiro?mes=${mesAnterior(mes)}`} aria-label="Mês anterior">
            ‹
          </Link>
          <strong>{nomeMes(mes)}</strong>
          <Link href={`/app/admin/financeiro?mes=${mesSeguinte(mes)}`} aria-label="Próximo mês">
            ›
          </Link>
        </div>
      </div>

      <div className="card">
        <h3>💰 Caixa da casa</h3>
        <div className="item">
          <div className="row between">
            <span>Saldo atual (geral)</span>
            <b style={{ color: saldoGeral >= 0 ? 'var(--green)' : 'var(--red)' }}>{brl(saldoGeral)}</b>
          </div>
        </div>
        <div className="item">
          <div className="row between">
            <span>Receitas do mês</span>
            <b>{brl(receitasMes)}</b>
          </div>
        </div>
        <div className="item">
          <div className="row between">
            <span>Despesas do mês</span>
            <b>{brl(despesasMes)}</b>
          </div>
        </div>
        <div className="item">
          <div className="row between">
            <span>Resultado do mês</span>
            <b style={{ color: receitasMes - despesasMes >= 0 ? 'var(--green)' : 'var(--red)' }}>{brl(receitasMes - despesasMes)}</b>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Lançamentos de {nomeMes(mes)}</h3>
        {doMes.data?.length ? (
          doMes.data.map((c) => (
            <div className="item" key={c.id}>
              <div className="row between">
                <div>
                  <div className="t">
                    {c.tipo === 'receita' ? '🟢' : '🔴'} {c.descricao}
                  </div>
                  <div className="s">
                    {fmt(c.data)}
                    {c.categoria ? ` · ${c.categoria}` : ''}
                  </div>
                </div>
                <div className="row">
                  <b>{brl(c.valor)}</b>
                  <form action={excluirLancamento}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="voltar" value={voltar} />
                    <BotaoEnviar className="btn ghost small" confirmar="Excluir este lançamento?">
                      ✕
                    </BotaoEnviar>
                  </form>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="muted">Nenhum lançamento neste mês.</div>
        )}
        <details>
          <summary>+ Novo lançamento</summary>
          <form action={salvarLancamento} style={{ marginTop: 10 }}>
            <input type="hidden" name="voltar" value={voltar} />
            <div className="two">
              <label className="f">
                <span>Tipo</span>
                <select name="tipo" defaultValue="despesa">
                  <option value="receita">Receita (entrada)</option>
                  <option value="despesa">Despesa (saída)</option>
                </select>
              </label>
              <label className="f">
                <span>Valor (R$)</span>
                <input name="valor" type="number" step="0.01" min="0.01" required />
              </label>
            </div>
            <label className="f">
              <span>Descrição</span>
              <input name="descricao" maxLength={160} required placeholder="Ex.: Conta de luz" />
            </label>
            <div className="two">
              <label className="f">
                <span>Categoria</span>
                <input name="categoria" maxLength={60} list="categorias" placeholder="Ex.: Contas da casa" />
              </label>
              <label className="f">
                <span>Data</span>
                <input name="data" type="date" defaultValue={mes === hojeISO().slice(0, 7) ? hojeISO() : de} required />
              </label>
            </div>
            <datalist id="categorias">
              {['Mensalidades', 'Festas', 'Doações', 'Contas da casa', 'Limpeza', 'Obrigações', 'Manutenção', 'Outros'].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <BotaoEnviar>Salvar lançamento</BotaoEnviar>
          </form>
        </details>
      </div>

      <div className="card">
        <h3>
          Mensalidades · {brl(cfg.data?.valor_mensalidade ?? 60)}/filho ({lista.length})
        </h3>
        <div className="chips" style={{ marginBottom: 8 }}>
          <span className="pill ok">em dia: {conta('confirmado')}</span>
          <span className="pill wait">em análise: {conta('pendente')}</span>
          <span className="pill no">a pagar: {conta('aberta') + conta('rejeitado')}</span>
          <span className="pill gold">recebido: {brl(recebido)}</span>
        </div>
        {lista.map((m) => (
          <div className="item" key={m.id}>
            <div className="row between" style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="t">{m.membro?.nome}</div>
                <div className="s">
                  <StatusPagamento status={m.status} />
                  {m.data_pagamento ? ` · ${fmt(m.data_pagamento)}` : ''}
                </div>
              </div>
              <AcoesPagamento tipo="mensalidade" id={m.id} status={m.status} comprovanteId={compPor.get(m.id)} voltar={voltar} />
            </div>
          </div>
        ))}
        {!lista.length ? <div className="muted">Mensalidades deste mês ainda não foram lançadas.</div> : null}
        <form action={gerarMensalidades} className="actions">
          <input type="hidden" name="competencia" value={mes} />
          <BotaoEnviar className="btn sec small">Lançar mensalidades de {nomeMes(mes)}</BotaoEnviar>
        </form>
        <div className="note">
          O comprovante enviado pelo filho fica <b>em análise</b> até você confirmar. Nada é marcado como pago automaticamente. As mensalidades
          do mês são lançadas sozinhas todo dia 1º.
        </div>
      </div>

      <Link className="btn sec" href="/app/admin/festas">
        🎉 Festas (contribuições)
      </Link>
    </AppShell>
  );
}
