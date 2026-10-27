import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { LocaisRodada } from '@/components/LocaisRodada';
import { fmt, hojeISO } from '@/lib/datas';
import { exigirAdmin } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

export default async function InicioAdmin() {
  const { supabase, membro } = await exigirAdmin();
  const hoje = hojeISO();
  const ano = hoje.slice(0, 4);

  const [org, rodadasAno, foco, pendMens, pendFesta, metas] = await Promise.all([
    supabase.from('organizacoes').select('nome').eq('id', membro.org_id).single(),
    supabase.from('rodadas').select('id, rodada_locais(concluido_em)').gte('inicio', `${ano}-01-01`).lte('inicio', `${ano}-12-31`),
    supabase
      .from('rodadas')
      .select('id, numero, inicio, fim, grupo:grupos(numero), rodada_locais(local_id, concluido_em, local:locais(nome, restrito, ordem))')
      .gte('fim', hoje)
      .order('inicio')
      .limit(1)
      .maybeSingle(),
    supabase.from('mensalidades').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
    supabase.from('contribuicoes_festa').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
    supabase.rpc('limpezas_por_filho', {}),
  ]);

  const total = rodadasAno.data?.length ?? 0;
  const concluidas = (rodadasAno.data ?? []).filter((r) => r.rodada_locais.length && r.rodada_locais.every((l) => l.concluido_em)).length;
  const pendentes = (pendMens.count ?? 0) + (pendFesta.count ?? 0);
  const abaixoMeta = (metas.data ?? []).filter((m) => m.total < m.meta).length;
  const r = foco.data;
  const emAndamento = r ? r.inicio <= hoje && r.fim >= hoje : false;

  return (
    <AppShell titulo="Administração" papel="admin" ativo="/app/admin">
      <div className="greet">
        <h2>Administração</h2>
        <p>{org.data?.nome}</p>
      </div>
      <div className="demo-ribbon">
        👑 Você vê <b>todos os grupos e rodadas</b>. Os filhos não veem estes dados.
      </div>

      {pendentes > 0 ? (
        <div className="card alerta">
          <h3>📎 Comprovantes para analisar: {pendentes}</h3>
          <div className="actions">
            {pendMens.count ? (
              <Link className="btn green small" href="/app/admin/financeiro">
                Mensalidades ({pendMens.count})
              </Link>
            ) : null}
            {pendFesta.count ? (
              <Link className="btn green small" href="/app/admin/festas">
                Festas ({pendFesta.count})
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="card">
        <h3>Resumo do rodízio ({ano})</h3>
        <div className="item">
          <div className="row between">
            <span>Rodadas previstas</span>
            <b>{total}</b>
          </div>
        </div>
        <div className="item">
          <div className="row between">
            <span>Concluídas</span>
            <b style={{ color: 'var(--green)' }}>{concluidas}</b>
          </div>
        </div>
        <div className="item">
          <div className="row between">
            <span>Pendentes</span>
            <b style={{ color: 'var(--amber)' }}>{total - concluidas}</b>
          </div>
        </div>
        <div className="item">
          <div className="row between">
            <span>Filhos abaixo da meta de limpezas</span>
            <b style={{ color: abaixoMeta ? 'var(--red)' : 'var(--green)' }}>{abaixoMeta}</b>
          </div>
        </div>
      </div>

      {r ? (
        <div className="card">
          <h3>📌 Rodada em foco</h3>
          <div className="item">
            <div className="t">
              Rodada {r.numero} — Grupo {r.grupo?.numero}{' '}
              {emAndamento ? <span className="pill now">esta semana</span> : <span className="pill open">próxima</span>}
            </div>
            <div className="s">
              {fmt(r.inicio)} a {fmt(r.fim)} ·{' '}
              <Link href={`/app/admin/rodizio/${r.id}`}>ver quem escolheu cada dia</Link>
            </div>
          </div>
          <LocaisRodada rodadaId={r.id} locais={r.rodada_locais} voltar="/app/admin" />
        </div>
      ) : null}

      <div className="stack">
        <Link className="btn" href="/app/admin/rodizio">
          🧹 Ver rodízio completo
        </Link>
        <Link className="btn sec" href="/app/admin/financeiro">
          💰 Controle financeiro
        </Link>
        <Link className="btn sec" href="/app/admin/filhos">
          🧑🏾 Filhos (cadastro)
        </Link>
        <Link className="btn sec" href="/app/admin/festas">
          🎉 Festas (contribuições)
        </Link>
        <Link className="btn sec" href="/app/admin/calendario">
          📅 Calendário de funções e toques
        </Link>
        <Link className="btn sec" href="/app/admin/galeria">
          📸 Galeria (fotos / vídeos)
        </Link>
        <Link className="btn sec" href="/app/admin/site">
          🎨 Aparência do site
        </Link>
        <Link className="btn ghost" href="/app/admin/restritas">
          🔒 Áreas restritas
        </Link>
        <Link className="btn ghost" href="/app/admin/auditoria">
          🧾 Auditoria (quem fez o quê)
        </Link>
        <form action="/auth/sair" method="post">
          <button className="btn ghost" type="submit">
            🚪 Sair
          </button>
        </form>
      </div>
    </AppShell>
  );
}
