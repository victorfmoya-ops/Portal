import { AppShell } from '@/components/AppShell';
import { Calendario, marcar, type Marcacao } from '@/components/Calendario';
import { diaSemana, fmt, hora, limitesDoMes, mesValido } from '@/lib/datas';
import { exigirFilho } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

/** Calendário do filho: funções da casa, toques e o dia da minha limpeza. */
export default async function CalendarioFilho({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { supabase, membro } = await exigirFilho();
  const mes = mesValido((await searchParams).mes);
  const { de, ate } = limitesDoMes(mes);

  const [funcoes, toques, limpezas, resp] = await Promise.all([
    supabase.from('funcoes').select('id, titulo, data, hora, referencia, obrigatorio').gte('data', de).lte('data', ate).order('data'),
    supabase.from('eventos').select('id, titulo, data, hora, observacao').gte('data', de).lte('data', ate).order('data'),
    supabase.from('escolhas_limpeza').select('dia').eq('membro_id', membro.id).gte('dia', de).lte('dia', ate),
    supabase.from('funcao_responsaveis').select('funcao_id').eq('membro_id', membro.id),
  ]);
  const meus = new Set((resp.data ?? []).map((r) => r.funcao_id));
  const itens: { data: string; tipo: Marcacao }[] = [
    ...(toques.data ?? []).map((t) => ({ data: t.data, tipo: 'toque' as const })),
    ...(funcoes.data ?? []).map((f) => ({ data: f.data, tipo: (f.obrigatorio ? 'obrig' : 'funcao') as Marcacao })),
    ...(limpezas.data ?? []).map((l) => ({ data: l.dia, tipo: 'limpeza' as const })),
  ];

  return (
    <AppShell titulo="Área do filho" papel="filho" voltar="/app/filho" ativo="/app/filho/calendario">
      <div className="card">
        <h3>📅 Calendário da casa</h3>
        <Calendario mes={mes} caminho="/app/filho/calendario" marcacoes={marcar(itens)} legenda={['toque', 'funcao', 'obrig', 'limpeza']} />
      </div>

      <div className="card">
        <h3>🔔 Funções do mês</h3>
        {funcoes.data?.length ? (
          funcoes.data.map((f) => (
            <div className="item" key={f.id}>
              <div className="t">{f.titulo}</div>
              <div className="s">
                {fmt(f.data)} ({diaSemana(f.data)}){f.hora ? ` às ${hora(f.hora)}` : ''}
                {f.referencia ? ` · ${f.referencia}` : ''}
              </div>
              <div className="chips">
                {f.obrigatorio ? <span className="pill no">Presença obrigatória</span> : null}
                {meus.has(f.id) ? <span className="pill gold">⭐ Você está escalado(a)</span> : null}
              </div>
            </div>
          ))
        ) : (
          <div className="muted">Nenhuma função neste mês.</div>
        )}
      </div>

      <div className="card">
        <h3>🥁 Toques do mês</h3>
        {toques.data?.length ? (
          toques.data.map((t) => (
            <div className="item" key={t.id}>
              <div className="t">{t.titulo}</div>
              <div className="s">
                {fmt(t.data)} ({diaSemana(t.data)}){t.hora ? ` · ${hora(t.hora)}` : ''}
                {t.observacao ? ` · ${t.observacao}` : ''}
              </div>
            </div>
          ))
        ) : (
          <div className="muted">Nenhum toque neste mês.</div>
        )}
      </div>
    </AppShell>
  );
}
