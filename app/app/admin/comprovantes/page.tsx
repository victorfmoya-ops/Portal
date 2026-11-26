import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { StatusPagamento } from '@/components/Status';
import { brl, fmt, hojeISO, mesAnterior, mesSeguinte, mesValido, nomeMes } from '@/lib/datas';
import { exigirAdmin } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

/**
 * Comprovantes enviados pelos filhos, por mês de envio (só o administrador vê).
 * Aparecem só os do que foi contribuído (em análise ou confirmado): recusados e
 * substituídos são apagados logo. Cada um fica guardado até 6 meses após o envio.
 */
export default async function ComprovantesAdmin({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { supabase } = await exigirAdmin();
  const mes = mesValido((await searchParams).mes);
  const agora = new Date().toISOString();

  const { data: comps } = await supabase
    .from('comprovantes')
    .select('id, tipo, referencia_id, enviado_em, remover_em, membro:membros!comprovantes_membro_id_fkey(nome)')
    .gte('enviado_em', `${mes}-01T00:00:00-03:00`)
    .lt('enviado_em', `${mesSeguinte(mes)}-01T00:00:00-03:00`)
    .gt('remover_em', agora)
    .order('enviado_em', { ascending: false })
    .limit(1000);

  const lista = comps ?? [];
  const idsMens = lista.filter((c) => c.tipo === 'mensalidade').map((c) => c.referencia_id);
  const idsFesta = lista.filter((c) => c.tipo === 'festa').map((c) => c.referencia_id);
  const [mens, contrib] = await Promise.all([
    idsMens.length
      ? supabase.from('mensalidades').select('id, competencia, valor, status').in('id', idsMens)
      : Promise.resolve({ data: [] as { id: string; competencia: string; valor: number; status: string }[] }),
    idsFesta.length
      ? supabase.from('contribuicoes_festa').select('id, valor, status, festa:festas!contribuicoes_festa_festa_id_fkey(nome)').in('id', idsFesta)
      : Promise.resolve({ data: [] as { id: string; valor: number; status: string; festa: { nome: string } | null }[] }),
  ]);
  const cobranca = new Map<string, { descricao: string; valor: number; status: string }>();
  for (const m of mens.data ?? []) {
    cobranca.set(m.id, { descricao: `Mensalidade de ${nomeMes(m.competencia.slice(0, 7))}`, valor: Number(m.valor), status: m.status });
  }
  for (const c of contrib.data ?? []) {
    cobranca.set(c.id, { descricao: `Festa: ${c.festa?.nome ?? '—'}`, valor: Number(c.valor), status: c.status });
  }

  // só o que foi contribuído (em análise ou confirmado)
  const contribuidos = lista.filter((c) => {
    const s = cobranca.get(c.referencia_id)?.status;
    return s === 'pendente' || s === 'confirmado';
  });

  const porFilho = new Map<string, typeof contribuidos>();
  for (const c of contribuidos) {
    const nome = c.membro?.nome ?? '—';
    porFilho.set(nome, [...(porFilho.get(nome) ?? []), c]);
  }
  const filhos = [...porFilho.keys()].sort((a, b) => a.localeCompare(b));

  return (
    <AppShell titulo="Administração" papel="admin" voltar="/app/admin" ativo="/app/admin/financeiro">
      <div className="card">
        <div className="cal-nav">
          <Link href={`/app/admin/comprovantes?mes=${mesAnterior(mes)}`} aria-label="Mês anterior">
            ‹
          </Link>
          <strong>{nomeMes(mes)}</strong>
          <Link href={`/app/admin/comprovantes?mes=${mesSeguinte(mes)}`} aria-label="Próximo mês">
            ›
          </Link>
        </div>
      </div>

      <div className="card">
        <h3>📎 Comprovantes enviados no mês</h3>
        <div className="muted">
          {contribuidos.length} comprovante(s) de {filhos.length} filho(s)
        </div>
      </div>

      {filhos.map((nome) => (
        <div className="card" key={nome}>
          <h3>🧑🏾 {nome}</h3>
          {(porFilho.get(nome) ?? []).map((c) => {
            const info = cobranca.get(c.referencia_id);
            return (
              <div className="item" key={c.id}>
                <div className="row between">
                  <div>
                    <b>{info?.descricao ?? (c.tipo === 'festa' ? 'Festa' : 'Mensalidade')}</b>
                    <div className="muted">
                      Enviado em {fmt(hojeISO(new Date(c.enviado_em)))} · {info ? brl(info.valor) : '—'} · guardado até {fmt(hojeISO(new Date(c.remover_em)))}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    {info ? <StatusPagamento status={info.status} /> : null}
                    <a className="btn ghost small" href={`/app/admin/comprovante/${c.id}`} target="_blank" rel="noopener noreferrer">
                      📎 Ver
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {!filhos.length ? (
        <div className="card">
          <div className="muted">Nenhum comprovante enviado em {nomeMes(mes)}.</div>
        </div>
      ) : null}

      <div className="note">
        Só a administração vê os comprovantes — o filho envia, mas não consegue abrir depois. Aparecem aqui só os do que foi contribuído (em
        análise ou confirmado). Cada comprovante fica guardado por até <b>6 meses</b> após o envio e depois é apagado sozinho; recusados são
        apagados logo.
      </div>
    </AppShell>
  );
}
