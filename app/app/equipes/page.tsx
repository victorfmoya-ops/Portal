import Link from 'next/link';
import { salvarEquipe } from './acoes';
import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { brl, diaSemana, fmt, hojeISO, somarDias } from '@/lib/datas';
import { exigirMembro } from '@/lib/sessao';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Equipes — Família Àṣẹ Omos Odé' };

/** Equipes (a função fixa de cada um na casa) e o panorama da organização das festas. */
export default async function Equipes() {
  const { supabase, membro } = await exigirMembro();
  const admin = membro.papel === 'admin';
  const { data: festas } = await supabase
    .from('festas')
    .select('id, nome, data, valor')
    .gte('data', somarDias(hojeISO(), -30))
    .order('data');
  const proxima = (festas ?? []).find((f) => f.data >= hojeISO()) ?? null;
  const [{ data: equipes }, { data: pessoas }] = await Promise.all([
    supabase.rpc('equipes_visao', proxima ? { p_festa: proxima.id } : {}),
    admin ? supabase.from('membros').select('id, nome').eq('status', 'ativo').order('nome') : Promise.resolve({ data: [] }),
  ]);
  const lista = equipes ?? [];
  const minha = lista.find((e) => e.id === membro.equipe_id) ?? null;
  const coordeno = lista.filter((e) => e.coordenador_id === membro.id);

  return (
    <AppShell titulo="Equipes da casa" papel={membro.papel} voltar={`/app/${membro.papel}`} ativo="/app/equipes">
      <div className="greet">
        <h2>🤝 Equipes da casa</h2>
        <p>Cada filho tem uma função fixa. O coordenador de cada equipe organiza as tarefas das festas.</p>
      </div>

      <div className="card">
        <h3>Minha equipe</h3>
        {minha ? (
          <Link href={`/app/equipes/${minha.id}`} className="item" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
            <div className="t">
              {minha.arrecadacao ? '💰 ' : ''}
              {minha.nome}
            </div>
            <div className="s">Coordenação: {minha.coordenador_nome ?? 'a definir'}</div>
          </Link>
        ) : (
          <div className="muted">Você ainda não está em nenhuma equipe. A administração define a função de cada filho.</div>
        )}
        {coordeno.length ? (
          <div className="chips">
            {coordeno.map((e) => (
              <span key={e.id} className="pill gold">
                ⭐ Você coordena: {e.nome}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="card">
        <h3>🎉 Organização das festas</h3>
        {festas?.length ? (
          festas.map((f) => (
            <Link key={f.id} href={`/app/organizacao/${f.id}`} className="item" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
              <div className="row between">
                <div className="t">{f.nome}</div>
                {f.data < hojeISO() ? <span className="pill open">já passou</span> : f.id === proxima?.id ? <span className="pill now">próxima</span> : null}
              </div>
              <div className="s">
                {fmt(f.data)} ({diaSemana(f.data)}) · {Number(f.valor) > 0 ? `${brl(f.valor)} por filho` : 'contribuição ainda não calculada'}
              </div>
            </Link>
          ))
        ) : (
          <div className="muted">Nenhuma festa cadastrada. A administração cadastra as festas em Administração → Festas.</div>
        )}
      </div>

      <div className="card">
        <h3>📊 Panorama das equipes{proxima ? ` · ${proxima.nome}` : ''}</h3>
        {lista.length ? (
          lista.map((e) => {
            const pct = e.tarefas ? Math.round((e.feitas / e.tarefas) * 100) : 0;
            return (
              <Link key={e.id} href={`/app/equipes/${e.id}`} className="item" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                <div className="row between">
                  <div className="t">
                    {e.arrecadacao ? '💰 ' : ''}
                    {e.nome}
                  </div>
                  <span className="muted">{e.membros} pessoa(s)</span>
                </div>
                <div className="s">Coordenação: {e.coordenador_nome ?? 'a definir'}</div>
                {proxima ? (
                  <>
                    <div className="progresso" aria-label={`${pct}% das tarefas feitas`}>
                      <div style={{ width: `${pct}%` }} />
                    </div>
                    <div className="s">{e.tarefas ? `${e.feitas} de ${e.tarefas} tarefas feitas` : 'Sem tarefas para a próxima festa'}</div>
                  </>
                ) : null}
              </Link>
            );
          })
        ) : (
          <div className="muted">Nenhuma equipe criada ainda.</div>
        )}
      </div>

      {admin ? (
        <div className="card">
          <details>
            <summary style={{ marginTop: 0 }}>+ Nova equipe</summary>
            <form action={salvarEquipe} style={{ marginTop: 10 }}>
              <label className="f">
                <span>Nome da equipe (a função)</span>
                <input name="nome" maxLength={60} required placeholder="Ex.: Cozinha, Decoração, Barracão" />
              </label>
              <label className="f">
                <span>Descrição (opcional)</span>
                <input name="descricao" maxLength={300} />
              </label>
              <label className="f">
                <span>Coordenador(a)</span>
                <select name="coordenador_id" defaultValue="">
                  <option value="">— a definir —</option>
                  {(pessoas ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="inline">
                <input type="checkbox" name="arrecadacao" /> Esta é a equipe de arrecadação (compras e contribuição das festas)
              </label>
              <BotaoEnviar>Criar equipe</BotaoEnviar>
            </form>
          </details>
        </div>
      ) : null}
    </AppShell>
  );
}
