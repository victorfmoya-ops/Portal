import { adicionarPessoaArea, criarArea, removerPessoaArea } from '../acoes';
import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { exigirAdmin } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

const PAPEIS = [
  ['responsavel', 'Responsáveis'],
  ['apoio', 'Apoio'],
  ['nao_incluir', 'Não incluir nesta escala'],
] as const;

export default async function AreasRestritas() {
  const { supabase } = await exigirAdmin();
  const [{ data: areas }, { data: membros }] = await Promise.all([
    supabase.from('areas_restritas').select('id, nome, area_restrita_pessoas(membro_id, papel, membro:membros(nome))').order('nome'),
    supabase.from('membros').select('id, nome').eq('status', 'ativo').order('nome'),
  ]);

  return (
    <AppShell titulo="Administração" papel="admin" voltar="/app/admin" ativo="/app/admin">
      {(areas ?? []).map((a) => (
        <div className="card" key={a.id}>
          <h3>🔒 {a.nome}</h3>
          {PAPEIS.map(([papel, rotulo]) => (
            <div className="item" key={papel}>
              <div className="t">{rotulo}</div>
              <div className="chips">
                {a.area_restrita_pessoas
                  .filter((p) => p.papel === papel)
                  .map((p) => (
                    <form action={removerPessoaArea} key={p.membro_id}>
                      <input type="hidden" name="area" value={a.id} />
                      <input type="hidden" name="membro" value={p.membro_id} />
                      <button type="submit" className="chip" title="Remover">
                        {p.membro?.nome} ✕
                      </button>
                    </form>
                  ))}
              </div>
            </div>
          ))}
          <form action={adicionarPessoaArea} className="actions">
            <input type="hidden" name="area" value={a.id} />
            <select name="membro" required defaultValue="" style={{ flex: 2 }} aria-label="Pessoa">
              <option value="" disabled>
                Pessoa…
              </option>
              {(membros ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
            <select name="papel" defaultValue="responsavel" style={{ flex: 1 }} aria-label="Função">
              {PAPEIS.map(([v, r]) => (
                <option key={v} value={v}>
                  {r}
                </option>
              ))}
            </select>
            <BotaoEnviar className="btn small">Adicionar</BotaoEnviar>
          </form>
        </div>
      ))}
      <form action={criarArea} className="card">
        <h3>+ Nova área restrita</h3>
        <input name="nome" maxLength={120} required placeholder="Ex.: Quarto de santo" />
        <div style={{ height: 8 }} />
        <BotaoEnviar className="btn sec">Criar área</BotaoEnviar>
      </form>
      <div className="note">A limpeza das áreas restritas é feita por responsáveis específicos, fora do rodízio dos grupos. Os filhos não veem esta tela.</div>
    </AppShell>
  );
}
