import { excluirFesta, salvarFesta } from '../acoes';
import { AcoesPagamento } from '@/components/AcoesPagamento';
import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { StatusPagamento } from '@/components/Status';
import { brl, fmt, hojeISO } from '@/lib/datas';
import { exigirAdmin } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

export default async function FestasAdmin() {
  const { supabase } = await exigirAdmin();
  const { data: festas } = await supabase
    .from('festas')
    .select('id, nome, data, valor, contribuicoes_festa(id, status, valor, membro:membros!contribuicoes_festa_membro_id_fkey(nome))')
    .order('data', { ascending: false })
    .limit(20);
  const pendentes = (festas ?? []).flatMap((f) => f.contribuicoes_festa.filter((c) => c.status === 'pendente' || c.status === 'confirmado').map((c) => c.id));
  const { data: comps } = pendentes.length
    ? await supabase.from('comprovantes').select('id, referencia_id').eq('tipo', 'festa').in('referencia_id', pendentes).gt('remover_em', new Date().toISOString())
    : { data: [] as { id: string; referencia_id: string }[] };
  const compPor = new Map((comps ?? []).map((c) => [c.referencia_id, c.id]));

  return (
    <AppShell titulo="Administração" papel="admin" voltar="/app/admin" ativo="/app/admin/financeiro">
      <details className="card">
        <summary style={{ fontSize: 15 }}>+ Nova festa</summary>
        <form action={salvarFesta} style={{ marginTop: 10 }}>
          <label className="f">
            <span>Nome da festa</span>
            <input name="nome" maxLength={120} required placeholder="Ex.: Festa de Xangô" />
          </label>
          <div className="two">
            <label className="f">
              <span>Data</span>
              <input name="data" type="date" defaultValue={hojeISO()} required />
            </label>
            <label className="f">
              <span>Valor por filho (R$)</span>
              <input name="valor" type="number" step="0.01" min="0" defaultValue={70} required />
            </label>
          </div>
          <BotaoEnviar>Criar festa</BotaoEnviar>
          <div className="note">Ao criar, a contribuição é lançada para todos os filhos ativos.</div>
        </form>
      </details>

      {(festas ?? []).map((f) => {
        const lista = [...f.contribuicoes_festa].sort((a, b) => (a.membro?.nome ?? '').localeCompare(b.membro?.nome ?? ''));
        const n = (s: string) => lista.filter((c) => c.status === s).length;
        return (
          <div className="card" key={f.id}>
            <h3>
              🎉 {f.nome} — {brl(f.valor)}/filho
            </h3>
            <div className="s muted">{fmt(f.data)}</div>
            <div className="chips" style={{ margin: '8px 0' }}>
              <span className="pill ok">pagos: {n('confirmado')}</span>
              <span className="pill wait">análise: {n('pendente')}</span>
              <span className="pill no">a pagar: {n('aberta') + n('rejeitado')}</span>
            </div>
            {lista.map((c) => (
              <div className="item" key={c.id}>
                <div className="row between" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div className="t">{c.membro?.nome}</div>
                    <div className="s">
                      <StatusPagamento status={c.status} />
                    </div>
                  </div>
                  <AcoesPagamento tipo="festa" id={c.id} status={c.status} comprovanteId={compPor.get(c.id)} voltar="/app/admin/festas" />
                </div>
              </div>
            ))}
            <form action={excluirFesta} className="actions">
              <input type="hidden" name="id" value={f.id} />
              <BotaoEnviar className="btn ghost small" confirmar={`Excluir a festa "${f.nome}" e todas as contribuições?`}>
                Excluir festa
              </BotaoEnviar>
            </form>
          </div>
        );
      })}
      {!festas?.length ? <div className="card muted">Nenhuma festa cadastrada.</div> : null}
    </AppShell>
  );
}
