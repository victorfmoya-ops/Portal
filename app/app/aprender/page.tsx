import Link from 'next/link';
import { FormLicao } from './FormLicao';
import { AppShell } from '@/components/AppShell';
import { CATEGORIAS, podeEnsinar, rotuloCargo, type Categoria } from '@/lib/aprendizado';
import { fmt } from '@/lib/datas';
import { exigirMembro } from '@/lib/sessao';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Espaço de aprendizado — Família Àṣẹ Omos Odé' };

/** Espaço de aprendizado: cantigas, rezas, regras e fundamentos ensinados pelos mais velhos da casa. */
export default async function Aprender({ searchParams }: { searchParams: Promise<{ cat?: string; q?: string }> }) {
  const { supabase, membro } = await exigirMembro();
  const p = await searchParams;
  const cat = p.cat && p.cat in CATEGORIAS ? (p.cat as Categoria) : null;
  const busca = (p.q ?? '').trim().slice(0, 60);

  let consulta = supabase
    .from('licoes')
    .select('id, categoria, titulo, autor_nome, autor_cargo, criado_em, midia_url')
    .order('criado_em', { ascending: false })
    .limit(100);
  if (cat) consulta = consulta.eq('categoria', cat);
  if (busca) consulta = consulta.ilike('titulo', `%${busca.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
  const [{ data: licoes }, { data: todas }] = await Promise.all([consulta, supabase.from('licoes').select('categoria')]);
  const contagem: Record<string, number> = {};
  for (const l of todas ?? []) contagem[l.categoria] = (contagem[l.categoria] ?? 0) + 1;
  const ensina = podeEnsinar(membro);
  const link = (c: string | null) => `/app/aprender${c ? `?cat=${c}` : ''}`;

  return (
    <AppShell titulo="Espaço de aprendizado" papel={membro.papel} voltar={`/app/${membro.papel}`} ativo="/app/aprender">
      <div className="greet">
        <h2>📖 Aprender com os mais velhos</h2>
        <p>Cantigas, rezas, regras da casa e fundamentos ensinados pelos pais de santo, ogãs e ebomis.</p>
      </div>

      <form className="card" action="/app/aprender" role="search" style={{ padding: 10 }}>
        {cat ? <input type="hidden" name="cat" value={cat} /> : null}
        <input name="q" type="search" defaultValue={busca} maxLength={60} placeholder="🔎 Buscar pelo título…" aria-label="Buscar lição" />
      </form>

      <nav className="aprender-cats chips" aria-label="Categorias">
        <Link className={`chip${cat ? '' : ' on'}`} href={link(null)}>
          Tudo · {todas?.length ?? 0}
        </Link>
        {Object.entries(CATEGORIAS).map(([valor, c]) => (
          <Link key={valor} className={`chip${cat === valor ? ' on' : ''}`} href={link(valor)}>
            {c.icone} {c.rotulo} · {contagem[valor] ?? 0}
          </Link>
        ))}
      </nav>

      {ensina ? (
        <div className="card">
          <details>
            <summary style={{ marginTop: 0 }}>+ Publicar uma lição</summary>
            <FormLicao categoriaPadrao={cat ?? undefined} />
          </details>
        </div>
      ) : null}

      {licoes?.length ? (
        licoes.map((l) => {
          const c = CATEGORIAS[l.categoria as Categoria] ?? CATEGORIAS.outros;
          const cargo = rotuloCargo(l.autor_cargo);
          return (
            <Link key={l.id} href={`/app/aprender/${l.id}`} className="card licao">
              <span className="cat">
                {c.icone} {c.rotulo}
              </span>
              <h3>{l.titulo}</h3>
              <span className="por">
                {cargo ? `${cargo} ` : ''}
                {l.autor_nome} · {fmt(l.criado_em.slice(0, 10))}
                {l.midia_url ? ' · ▶ áudio/vídeo' : ''}
              </span>
            </Link>
          );
        })
      ) : (
        <div className="card">
          <div className="muted">
            {busca || cat ? 'Nenhuma lição encontrada com esse filtro.' : 'Ainda não há lições publicadas.'}
            {ensina ? ' Use “Publicar uma lição” para começar.' : ' Em breve os mais velhos da casa vão publicar aqui.'}
          </div>
        </div>
      )}
    </AppShell>
  );
}
