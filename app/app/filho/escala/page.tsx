import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { StatusRodada } from '@/components/Status';
import { rodadasDoMeuGrupo } from '@/lib/consultas';
import { diaSemana, diasDaRodada, fmt } from '@/lib/datas';
import { exigirFilho } from '@/lib/sessao';
import { escolherDia } from '../acoes';

export const dynamic = 'force-dynamic';

export default async function Escala() {
  const { supabase, membro } = await exigirFilho();
  const rodadas = await rodadasDoMeuGrupo(supabase, membro.id, 6);
  const colegas = await Promise.all(rodadas.map((r) => supabase.rpc('escolhas_da_rodada', { p_rodada: r.id })));
  const [{ data: feitas }, { data: cfg }] = await Promise.all([
    supabase.rpc('minhas_limpezas_no_ano', {}),
    supabase.from('site_config').select('meta_limpezas_ano').eq('org_id', membro.org_id).maybeSingle(),
  ]);
  const meta = cfg?.meta_limpezas_ano ?? 5;

  return (
    <AppShell titulo="Área do filho" papel="filho" voltar="/app/filho" ativo="/app/filho/escala">
      <div className="card">
        <h3>🧹 Minha escala de limpeza</h3>
        <div className="row between">
          <span className="muted">Limpezas no ano (meta {meta})</span>
          <b>{`${feitas ?? 0}/${meta}`}</b>
        </div>
        <div className="progresso" aria-hidden>
          <div style={{ width: `${Math.min(100, meta ? ((feitas ?? 0) / meta) * 100 : 100)}%` }} />
        </div>
        <div className="note">
          Escolha o dia em que você vai fazer a limpeza na semana do seu grupo. O prazo é <b>1 mês antes</b> do início da semana. Depois
          disso, só a administração muda.
        </div>
      </div>

      {rodadas.length === 0 ? <div className="card muted">Sem escala futura para o seu grupo.</div> : null}

      {rodadas.map((r, idx) => (
        <div className="card" key={r.id}>
          <div className="row between">
            <div>
              <div className="t" style={{ fontWeight: 700 }}>
                Rodada {r.numero} — semana {fmt(r.inicio)} a {fmt(r.fim)}
              </div>
              <div className="muted">
                Dia escolhido: <b>{r.meuDia ? `${fmt(r.meuDia)} (${diaSemana(r.meuDia)})` : 'a definir'}</b>
              </div>
            </div>
            <StatusRodada feitos={r.feitos} total={r.locais.length} passou={false} />
          </div>

          {r.podeEscolher ? (
            <form action={escolherDia} className="actions">
              <input type="hidden" name="rodada" value={r.id} />
              <select name="dia" defaultValue={r.meuDia ?? ''} required aria-label="Dia da limpeza" style={{ flex: 1 }}>
                <option value="" disabled>
                  Escolha o dia…
                </option>
                {diasDaRodada(r.inicio).map((d) => (
                  <option key={d} value={d}>
                    {diaSemana(d)} — {fmt(d)}
                  </option>
                ))}
              </select>
              <BotaoEnviar className="btn small">{r.meuDia ? 'Trocar dia' : 'Escolher o dia'}</BotaoEnviar>
            </form>
          ) : (
            <div className="note">Prazo encerrado em {fmt(r.prazo_escolha)}. Para mudar, fale com a administração.</div>
          )}
          <div className="muted" style={{ marginTop: 6 }}>
            Prazo para escolher: até {fmt(r.prazo_escolha)}
          </div>

          <h3 style={{ marginTop: 12 }}>Locais a limpar</h3>
          {r.locais.map((l, i) => (
            <div className="local" key={i}>
              <span className={`check${l.concluido_em ? ' done' : ''}`} aria-label={l.concluido_em ? 'concluído' : 'pendente'}>
                {l.concluido_em ? '✓' : ''}
              </span>
              <span style={{ flex: 1 }}>
                {l.local?.nome} {l.local?.restrito ? <span className="pill gold">restrito</span> : null}
              </span>
            </div>
          ))}

          {colegas[idx].data?.length ? (
            <details>
              <summary>Quem do grupo já escolheu ({colegas[idx].data.length})</summary>
              {colegas[idx].data.map((c, i) => (
                <div className="item" key={i}>
                  <div className="s">
                    {c.nome}: <b>{`${diaSemana(c.dia)} (${fmt(c.dia)})`}</b>
                  </div>
                </div>
              ))}
            </details>
          ) : null}
          <div className="note">
            A <b>Casa dos Exus</b> é área restrita — limpa por responsáveis específicos. A conclusão dos locais é marcada pela administração.
          </div>
        </div>
      ))}
    </AppShell>
  );
}
