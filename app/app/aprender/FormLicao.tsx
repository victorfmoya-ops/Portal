import { salvarLicao } from './acoes';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { CATEGORIAS } from '@/lib/aprendizado';

/** Formulário de lição (nova ou edição). */
export function FormLicao({
  licao,
  categoriaPadrao,
}: {
  licao?: { id: string; categoria: string; titulo: string; conteudo: string; midia_url: string | null };
  categoriaPadrao?: string;
}) {
  return (
    <form action={salvarLicao} style={{ marginTop: 10 }}>
      {licao ? <input type="hidden" name="id" value={licao.id} /> : null}
      <label className="f">
        <span>Categoria</span>
        <select name="categoria" defaultValue={licao?.categoria ?? categoriaPadrao ?? 'cantigas'} required>
          {Object.entries(CATEGORIAS).map(([valor, c]) => (
            <option key={valor} value={valor}>
              {c.icone} {c.rotulo}
            </option>
          ))}
        </select>
      </label>
      <label className="f">
        <span>Título</span>
        <input name="titulo" maxLength={140} required defaultValue={licao?.titulo} placeholder="Ex.: Cantiga de abertura para Oxóssi" />
      </label>
      <label className="f">
        <span>Conteúdo (letra da cantiga, tradução, explicação, regra…)</span>
        <textarea name="conteudo" rows={10} maxLength={20000} required defaultValue={licao?.conteudo} />
      </label>
      <label className="f">
        <span>Link de áudio ou vídeo (opcional, https://)</span>
        <input name="midia_url" type="url" maxLength={500} defaultValue={licao?.midia_url ?? ''} placeholder="https://www.youtube.com/…" />
      </label>
      <BotaoEnviar>{licao ? 'Salvar alterações' : 'Publicar lição'}</BotaoEnviar>
    </form>
  );
}
