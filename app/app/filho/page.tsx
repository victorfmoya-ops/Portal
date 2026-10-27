import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { StatusPagamento, StatusRodada } from '@/components/Status';
import { competenciaAtual, rodadasDoMeuGrupo } from '@/lib/consultas';
import { brl, diaSemana, fmt, hojeISO, hora, MESES } from '@/lib/datas';
import { exigirFilho } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

export default async function InicioFilho() {
  const { supabase, membro } = await exigirFilho();
  const hoje = hojeISO();
  const mesAtual = Number(hoje.slice(5, 7));

  const [org, grupo, funcoes, rodadas, mens, contribs, toques, aniversarios, minhasLimpezas, cfg, responsavel] = await Promise.all([
    supabase.from('organizacoes').select('nome').eq('id', membro.org_id).single(),
    membro.grupo_id ? supabase.from('grupos').select('numero').eq('id', membro.grupo_id).single() : Promise.resolve({ data: null }),
    supabase.from('funcoes').select('id, titulo, data, hora, referencia, obrigatorio').gte('data', hoje).order('data').limit(4),
    rodadasDoMeuGrupo(supabase, membro.id, 2),
    supabase.from('mensalidades').select('id, valor, status').eq('membro_id', membro.id).eq('competencia', competenciaAtual()).maybeSingle(),
    supabase.from('contribuicoes_festa').select('id, valor, status, festa:festas(nome, data)').eq('membro_id', membro.id).neq('status', 'confirmado'),
    supabase.from('eventos').select('id, titulo, data, hora').gte('data', hoje).order('data').limit(3),
    supabase.rpc('aniversariantes'),
    supabase.rpc('minhas_limpezas_no_ano', {}),
    supabase.from('site_config').select('meta_limpezas_ano').eq('org_id', membro.org_id).maybeSingle(),
    supabase.from('funcao_responsaveis').select('funcao_id').eq('membro_id', membro.id),
  ]);
  const meusResp = new Set((responsavel.data ?? []).map((r) => r.funcao_id));
  const meta = cfg.data?.meta_limpezas_ano ?? 5;
  const feitas = minhasLimpezas.data ?? 0;
  const anivMes = (aniversarios.data ?? []).filter((a) => a.mes === mesAtual);

  return (
    <AppShell titulo="Área do filho" papel="filho" ativo="/app/filho">
      <div className="greet">
        <h2>Olá, {membro.nome.split(/ [-(]/)[0]}! 👋</h2>
        <p>
          {grupo.data ? `Grupo ${grupo.data.numero} · ` : ''}
          {org.data?.nome}
        </p>
      </div>
      <div className="demo-ribbon">
        🔒 Você vê <b>só o seu grupo</b>. Dados de outros grupos e de administradores não aparecem.
      </div>

      {funcoes.data?.length ? (
        <div className="card alerta">
          <h3>🔔 Funções e obrigações</h3>
          {funcoes.data.map((f) => (
            <div className="item" key={f.id}>
              <div className="t">{f.titulo}</div>
              <div className="s">
                {fmt(f.data)} ({diaSemana(f.data)}){f.hora ? ` às ${hora(f.hora)}` : ''}
                {f.referencia ? ` · ${f.referencia}` : ''}
              </div>
              {f.obrigatorio ? (
                <div style={{ marginTop: 5 }}>
                  <span className="pill no">⚠️ Presença obrigatória de todos os filhos</span>
                </div>
              ) : null}
              {meusResp.has(f.id) ? (
                <div style={{ marginTop: 5 }}>
                  <span className="pill gold">⭐ Você está escalado(a) nesta função</span>
                </div>
              ) : null}
            </div>
          ))}
          <div className="actions">
            <Link className="btn sec small" href="/app/filho/calendario">
              Ver calendário
            </Link>
          </div>
        </div>
      ) : null}

      <div className="card">
        <h3>🧹 Próxima semana do meu grupo</h3>
        {rodadas.length ? (
          rodadas.map((r) => (
            <div className="item" key={r.id}>
              <div className="row between">
                <div>
                  <div className="t">
                    Rodada {r.numero} — Grupo {r.grupo?.numero} {r.emAndamento ? <span className="pill now">esta semana</span> : null}
                  </div>
                  <div className="s">
                    {fmt(r.inicio)} a {fmt(r.fim)} (seg a dom)
                  </div>
                </div>
                <StatusRodada feitos={r.feitos} total={r.locais.length} passou={false} />
              </div>
              <div className="s" style={{ marginTop: 6 }}>
                Dia escolhido: <b>{r.meuDia ? `${fmt(r.meuDia)} (${diaSemana(r.meuDia)})` : 'a definir'}</b>
              </div>
              <div className="actions">
                <Link className="btn sec small" href="/app/filho/escala">
                  Escolher o dia
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="muted">Sem semanas futuras para o seu grupo.</div>
        )}
        <div className="s" style={{ marginTop: 8 }}>
          Limpezas no ano: <b>{`${feitas}/${meta}`}</b>
        </div>
        <div className="progresso" aria-hidden>
          <div style={{ width: `${Math.min(100, meta ? (feitas / meta) * 100 : 100)}%` }} />
        </div>
      </div>

      <div className="card">
        <h3>💰 Minha mensalidade</h3>
        {mens.data ? (
          <div className="item">
            <div className="t">{brl(mens.data.valor)} / mês</div>
            <div className="s">
              <StatusPagamento status={mens.data.status} />
            </div>
          </div>
        ) : (
          <div className="muted">Nenhuma mensalidade lançada neste mês.</div>
        )}
        <div className="actions">
          <Link className="btn sec small" href="/app/filho/mensalidade">
            Ver / enviar comprovante
          </Link>
        </div>
      </div>

      <div className="card">
        <h3>🎉 Festas / contribuições</h3>
        {contribs.data?.length ? (
          contribs.data.map((c) => (
            <div className="item" key={c.id}>
              <div className="t">
                {c.festa?.nome} — {brl(c.valor)}
              </div>
              <div className="s">
                {fmt(c.festa?.data)} · <StatusPagamento status={c.status} />
              </div>
            </div>
          ))
        ) : (
          <div className="muted">Nenhuma contribuição pendente. Axé! 🙏</div>
        )}
        <div className="actions">
          <Link className="btn sec small" href="/app/filho/festas">
            Ver / enviar comprovante
          </Link>
        </div>
      </div>

      <Link className="btn ghost" href="/app/filho/meus-dados">
        🪪 Meus dados
      </Link>
      <div style={{ height: 12 }} />

      <div className="card">
        <h3>🥁 Próximos toques</h3>
        {toques.data?.length ? (
          toques.data.map((t) => (
            <div className="item" key={t.id}>
              <div className="t">{t.titulo}</div>
              <div className="s">
                {fmt(t.data)} ({diaSemana(t.data)}){t.hora ? ` · ${hora(t.hora)}` : ''}
              </div>
            </div>
          ))
        ) : (
          <div className="muted">Nenhum toque marcado.</div>
        )}
      </div>

      {anivMes.length ? (
        <div className="card">
          <h3>🎂 Aniversariantes de {MESES[mesAtual - 1]}</h3>
          {anivMes.map((a, i) => (
            <div className="item" key={i}>
              <div className="row between">
                <span className="t">{a.nome}</span>
                <span className="muted">{`${String(a.dia).padStart(2, '0')}/${String(a.mes).padStart(2, '0')}`}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="note">
        Cada grupo assume uma semana (seg–dom) no rodízio <b>quinzenal</b>. Escolha o seu dia até <b>1 mês antes</b> da semana do grupo.
      </div>
      <div style={{ height: 12 }} />
      <form action="/auth/sair" method="post">
        <button className="btn ghost" type="submit">
          🚪 Sair
        </button>
      </form>
    </AppShell>
  );
}
