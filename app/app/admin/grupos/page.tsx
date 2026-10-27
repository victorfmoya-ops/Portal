import Link from 'next/link';
import { criarGrupo } from '../acoes';
import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { exigirAdmin } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

export default async function Grupos() {
  const { supabase } = await exigirAdmin();
  const [{ data: grupos }, { data: semGrupo }] = await Promise.all([
    supabase.from('grupos').select('id, numero, membros(id, nome, status)').order('numero'),
    supabase.from('membros').select('id, nome').is('grupo_id', null).eq('papel', 'filho').eq('status', 'ativo').order('nome'),
  ]);
  const total = (grupos ?? []).reduce((s, g) => s + g.membros.filter((m) => m.status === 'ativo').length, 0);

  return (
    <AppShell titulo="Administração" papel="admin" voltar="/app/admin" ativo="/app/admin/grupos">
      <div className="card">
        <h3>
          👥 Grupos ({grupos?.length ?? 0}) — {total} filhos
        </h3>
        {(grupos ?? []).map((g) => {
          const ativos = g.membros.filter((m) => m.status === 'ativo').sort((a, b) => a.nome.localeCompare(b.nome));
          return (
            <div className="item" key={g.id}>
              <div className="t">
                Grupo {g.numero} <span className="pill open">{ativos.length} integrantes</span>
              </div>
              <div className="chips">
                {ativos.map((m) => (
                  <Link key={m.id} className="chip" href={`/app/admin/filhos/${m.id}`} style={{ textDecoration: 'none' }}>
                    {m.nome}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
        <div className="note">Rodízio quinzenal: a cada {grupos?.length ?? 5} rodadas o grupo repete. Para trocar alguém de grupo, abra a ficha.</div>
      </div>
      {semGrupo?.length ? (
        <div className="card alerta">
          <h3>⚠️ Filhos sem grupo ({semGrupo.length})</h3>
          <div className="chips">
            {semGrupo.map((m) => (
              <Link key={m.id} className="chip" href={`/app/admin/filhos/${m.id}`} style={{ textDecoration: 'none' }}>
                {m.nome}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <form action={criarGrupo}>
        <BotaoEnviar className="btn sec">+ Criar novo grupo</BotaoEnviar>
      </form>
    </AppShell>
  );
}
