import { notFound } from 'next/navigation';
import { adicionarNaEquipe, excluirEquipe, salvarEquipe, tirarDaEquipe } from '../acoes';
import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { exigirMembro } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

/** Uma equipe: coordenação e pessoas. O administrador edita e escolhe quem faz parte. */
export default async function Equipe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, membro } = await exigirMembro();
  const admin = membro.papel === 'admin';
  const [{ data: visao }, pessoas, { data: todos }] = await Promise.all([
    supabase.rpc('equipes_visao'),
    supabase.rpc('pessoas_da_equipe', { p_equipe: id }),
    admin
      ? supabase.from('membros').select('id, nome, papel, equipe:equipes!membros_equipe_id_fkey(nome)').eq('status', 'ativo').order('nome')
      : Promise.resolve({ data: [] }),
  ]);
  const e = (visao ?? []).find((x) => x.id === id);
  if (!e) notFound();
  const equipe = pessoas.data ?? [];
  const naEquipe = new Set(equipe.map((p) => p.id));
  const voltar = `/app/equipes/${id}`;

  return (
    <AppShell titulo="Equipes da casa" papel={membro.papel} voltar="/app/equipes" ativo="/app/equipes">
      <div className="card">
        {e.arrecadacao ? <span className="pill gold">💰 Arrecadação das festas</span> : null}
        <h2 style={{ margin: '10px 0 4px', fontSize: 22, fontFamily: 'var(--font-tit)' }}>{e.nome}</h2>
        {e.descricao ? <div className="muted">{e.descricao}</div> : null}
        <div className="item">
          <div className="s">Coordenação</div>
          <div className="t">
            {e.coordenador_nome ?? 'a definir'} {e.coordenador_id === membro.id ? <span className="pill gold">você</span> : null}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>👥 Pessoas ({e.membros})</h3>
        {pessoas.error ? (
          <div className="muted">Você vê só as pessoas da sua própria equipe.</div>
        ) : equipe.length ? (
          equipe.map((p) => (
            <div key={p.id} className="row between item">
              <span>
                {p.nome}
                {p.id === e.coordenador_id ? ' ⭐' : ''}
              </span>
              {admin ? (
                <form action={tirarDaEquipe}>
                  <input type="hidden" name="equipe_id" value={id} />
                  <input type="hidden" name="membro_id" value={p.id} />
                  <BotaoEnviar className="btn ghost small" confirmar={`Tirar ${p.nome} da equipe?`}>
                    Tirar
                  </BotaoEnviar>
                </form>
              ) : null}
            </div>
          ))
        ) : (
          <div className="muted">Ninguém nesta equipe ainda.</div>
        )}
        {admin ? (
          <details>
            <summary>+ Colocar pessoas nesta equipe</summary>
            <form action={adicionarNaEquipe} style={{ marginTop: 10 }}>
              <input type="hidden" name="equipe_id" value={id} />
              <label className="f">
                <span>Escolha uma ou várias (segure Ctrl / toque para marcar). Quem já está em outra equipe muda para esta.</span>
                <select name="membros" multiple size={10}>
                  {(todos ?? [])
                    .filter((p) => !naEquipe.has(p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                        {p.equipe ? ` (hoje: ${p.equipe.nome})` : ''}
                      </option>
                    ))}
                </select>
              </label>
              <BotaoEnviar>Colocar na equipe</BotaoEnviar>
            </form>
          </details>
        ) : null}
      </div>

      {admin ? (
        <div className="card">
          <details>
            <summary style={{ marginTop: 0 }}>✏️ Editar equipe</summary>
            <form action={salvarEquipe} style={{ marginTop: 10 }}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="voltar" value={voltar} />
              <label className="f">
                <span>Nome</span>
                <input name="nome" maxLength={60} required defaultValue={e.nome} />
              </label>
              <label className="f">
                <span>Descrição (opcional)</span>
                <input name="descricao" maxLength={300} defaultValue={e.descricao ?? ''} />
              </label>
              <label className="f">
                <span>Coordenador(a)</span>
                <select name="coordenador_id" defaultValue={e.coordenador_id ?? ''}>
                  <option value="">— a definir —</option>
                  {(todos ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="inline">
                <input type="checkbox" name="arrecadacao" defaultChecked={e.arrecadacao} /> Equipe de arrecadação (compras e contribuição das festas)
              </label>
              <BotaoEnviar>Salvar equipe</BotaoEnviar>
            </form>
          </details>
          <form action={excluirEquipe} className="actions">
            <input type="hidden" name="id" value={id} />
            <BotaoEnviar className="btn ghost small" confirmar="Excluir esta equipe? As pessoas ficam sem equipe.">
              Excluir equipe
            </BotaoEnviar>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}
