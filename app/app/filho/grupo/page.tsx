import { AppShell } from '@/components/AppShell';
import { exigirFilho } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

export default async function MeuGrupo() {
  const { supabase, membro } = await exigirFilho();
  const [{ data: colegas }, grupo] = await Promise.all([
    supabase.rpc('colegas_do_grupo'),
    membro.grupo_id ? supabase.from('grupos').select('numero').eq('id', membro.grupo_id).single() : Promise.resolve({ data: null }),
  ]);
  return (
    <AppShell titulo="Área do filho" papel="filho" voltar="/app/filho" ativo="/app/filho/grupo">
      <div className="card">
        <h3>👥 Meu grupo {grupo.data ? `— Grupo ${grupo.data.numero}` : ''}</h3>
        {colegas?.length ? (
          colegas.map((c, i) => (
            <div className="item" key={i}>
              <div className="t">
                {c.nome} {c.sou_eu ? <span className="pill now">você</span> : null}
              </div>
            </div>
          ))
        ) : (
          <div className="muted">Você ainda não está em um grupo. Fale com a administração.</div>
        )}
        <div className="note">
          Você vê apenas os integrantes do <b>seu</b> grupo (para combinar a limpeza). Contatos não são exibidos.
        </div>
      </div>
    </AppShell>
  );
}
