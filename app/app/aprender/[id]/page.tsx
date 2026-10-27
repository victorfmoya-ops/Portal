import Link from 'next/link';
import { notFound } from 'next/navigation';
import { excluirLicao } from '../acoes';
import { FormLicao } from '../FormLicao';
import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { CATEGORIAS, podeEnsinar, rotuloCargo, type Categoria } from '@/lib/aprendizado';
import { fmt } from '@/lib/datas';
import { exigirMembro } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

/** Uma lição do espaço de aprendizado. */
export default async function Licao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, membro } = await exigirMembro();
  const { data: l } = await supabase
    .from('licoes')
    .select('id, categoria, titulo, conteudo, midia_url, autor_id, autor_nome, autor_cargo, criado_em, atualizado_em')
    .eq('id', id)
    .maybeSingle();
  if (!l) notFound();

  const c = CATEGORIAS[l.categoria as Categoria] ?? CATEGORIAS.outros;
  const cargo = rotuloCargo(l.autor_cargo);
  const editavel = podeEnsinar(membro) && (membro.papel === 'admin' || l.autor_id === membro.id);
  const criada = l.criado_em.slice(0, 10);
  const atualizada = l.atualizado_em.slice(0, 10);

  return (
    <AppShell titulo="Espaço de aprendizado" papel={membro.papel} voltar={`/app/aprender?cat=${l.categoria}`} ativo="/app/aprender">
      <article className="card">
        <span className="pill gold">
          {c.icone} {c.rotulo}
        </span>
        <h2 style={{ margin: '12px 0 4px', fontSize: 22, fontFamily: 'var(--font-tit)' }}>{l.titulo}</h2>
        <div className="muted">
          Por {cargo ? `${cargo} ` : ''}
          {l.autor_nome} · {fmt(criada)}
          {atualizada !== criada ? ` · atualizada em ${fmt(atualizada)}` : ''}
        </div>
        <p className="texto-longo">{l.conteudo}</p>
        {l.midia_url ? (
          <a className="midia-link" href={l.midia_url} target="_blank" rel="noopener noreferrer">
            ▶ Ouvir / assistir
          </a>
        ) : null}
      </article>

      {editavel ? (
        <div className="card">
          <details>
            <summary style={{ marginTop: 0 }}>✏️ Editar esta lição</summary>
            <FormLicao licao={l} />
          </details>
          <form action={excluirLicao} className="actions">
            <input type="hidden" name="id" value={l.id} />
            <BotaoEnviar className="btn ghost small" confirmar="Excluir esta lição?">
              Excluir
            </BotaoEnviar>
          </form>
        </div>
      ) : null}

      <Link className="btn ghost" href={`/app/aprender?cat=${l.categoria}`}>
        ‹ Mais {c.rotulo.toLowerCase()}
      </Link>
    </AppShell>
  );
}
