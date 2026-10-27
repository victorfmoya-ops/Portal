import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { fmt } from '@/lib/datas';
import { exigirAdmin } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

export default async function Filhos({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { supabase } = await exigirAdmin();
  const q = ((await searchParams).q ?? '').trim().slice(0, 60);
  let consulta = supabase
    .from('membros')
    .select('id, nome, papel, status, user_id, grupo:grupos(numero), ficha:fichas(orisa, iniciado, dt_iniciacao)')
    .order('nome');
  if (q) consulta = consulta.ilike('nome', `%${q.replace(/[%_\\]/g, '')}%`);
  const { data: membros } = await consulta;

  return (
    <AppShell titulo="Administração" papel="admin" voltar="/app/admin" ativo="/app/admin">
      <Link className="btn" href="/app/admin/filhos/novo">
        + Novo cadastro
      </Link>
      <div style={{ height: 12 }} />
      <form className="card" style={{ display: 'flex', gap: 8 }}>
        <input name="q" defaultValue={q} placeholder="Buscar pelo nome" aria-label="Buscar" />
        <button className="btn small" type="submit">
          Buscar
        </button>
      </form>
      <div className="card">
        <h3>🧑🏾 Cadastrados ({membros?.length ?? 0})</h3>
        {(membros ?? []).map((m) => (
          <div className="item" key={m.id}>
            <div className="row between">
              <div>
                <div className="t">
                  {m.nome} {m.papel === 'admin' ? <span className="pill gold">admin</span> : null}{' '}
                  {m.status === 'bloqueado' ? <span className="pill no">bloqueado</span> : null}
                </div>
                <div className="s">
                  {m.grupo ? `Grupo ${m.grupo.numero} · ` : ''}
                  {m.ficha?.orisa ? `Òrìṣà: ${m.ficha.orisa}` : 'Òrìṣà —'}
                  {m.ficha?.iniciado ? ' · iniciado(a)' : ''}
                  {m.ficha?.dt_iniciacao ? ` · desde ${fmt(m.ficha.dt_iniciacao)}` : ''}
                  {m.user_id ? ' · ✅ já entrou' : ' · ⏳ ainda não entrou'}
                </div>
              </div>
              <Link className="btn sec small" href={`/app/admin/filhos/${m.id}`}>
                Ficha
              </Link>
            </div>
          </div>
        ))}
      </div>
      <div className="note">
        Para liberar o acesso de um filho, cadastre o <b>e-mail</b> dele aqui. Ele entra com Google ou cria a senha em “Primeiro acesso”.
      </div>
    </AppShell>
  );
}
