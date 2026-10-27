import { notFound } from 'next/navigation';
import { z } from 'zod';
import { alterarPrazo, definirDiaFilho } from '../../acoes';
import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { LocaisRodada } from '@/components/LocaisRodada';
import { diaSemana, diasDaRodada, fmt } from '@/lib/datas';
import { exigirAdmin } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

export default async function DetalheRodada({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await exigirAdmin();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const { data: r } = await supabase
    .from('rodadas')
    .select('id, numero, inicio, fim, prazo_escolha, grupo_id, grupo:grupos(numero), rodada_locais(local_id, concluido_em, local:locais(nome, restrito, ordem))')
    .eq('id', id.data)
    .maybeSingle();
  if (!r) notFound();
  const [{ data: filhos }, { data: escolhas }] = await Promise.all([
    supabase.from('membros').select('id, nome').eq('grupo_id', r.grupo_id).eq('status', 'ativo').order('nome'),
    supabase.from('escolhas_limpeza').select('membro_id, dia').eq('rodada_id', r.id),
  ]);
  const dia = new Map((escolhas ?? []).map((e) => [e.membro_id, e.dia]));
  const voltar = `/app/admin/rodizio/${r.id}`;

  return (
    <AppShell titulo="Administração" papel="admin" voltar="/app/admin/rodizio" ativo="/app/admin/rodizio">
      <div className="card">
        <h3>
          🧹 Rodada {r.numero} — Grupo {r.grupo?.numero}
        </h3>
        <div className="muted">
          {fmt(r.inicio)} a {fmt(r.fim)} (seg a dom)
        </div>
        <h3 style={{ marginTop: 12 }}>Locais</h3>
        <LocaisRodada rodadaId={r.id} locais={r.rodada_locais} voltar={voltar} />
      </div>

      <div className="card">
        <h3>👥 Dia de cada filho</h3>
        {(filhos ?? []).map((f) => (
          <form action={definirDiaFilho} className="item" key={f.id}>
            <input type="hidden" name="rodada" value={r.id} />
            <input type="hidden" name="membro" value={f.id} />
            <div className="t">{f.nome}</div>
            <div className="actions" style={{ marginTop: 4 }}>
              <select name="dia" defaultValue={dia.get(f.id) ?? ''} style={{ flex: 1 }} aria-label={`Dia de ${f.nome}`}>
                <option value="">— a definir —</option>
                {diasDaRodada(r.inicio).map((d) => (
                  <option key={d} value={d}>
                    {diaSemana(d)} — {fmt(d)}
                  </option>
                ))}
              </select>
              <BotaoEnviar className="btn sec small">Salvar</BotaoEnviar>
            </div>
          </form>
        ))}
        {!filhos?.length ? <div className="muted">Nenhum filho neste grupo.</div> : null}
        <div className="note">A administração pode definir ou trocar o dia mesmo depois do prazo dos filhos.</div>
      </div>

      <div className="card">
        <h3>⏰ Prazo para os filhos escolherem</h3>
        <form action={alterarPrazo} className="actions">
          <input type="hidden" name="rodada" value={r.id} />
          <input type="date" name="prazo" defaultValue={r.prazo_escolha} max={r.inicio} required style={{ flex: 1 }} />
          <BotaoEnviar className="btn small">Alterar</BotaoEnviar>
        </form>
        <div className="note">Padrão da casa: 1 mês antes do início da semana.</div>
      </div>
    </AppShell>
  );
}
