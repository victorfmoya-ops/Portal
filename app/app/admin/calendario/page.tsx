import { excluirFuncao, excluirToque, salvarFuncao, salvarToque } from '../acoes';
import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { Calendario, type ItemCalendario } from '@/components/Calendario';
import { diaSemana, fmt, hojeISO, hora, limitesDoMes, mesValido } from '@/lib/datas';
import { exigirAdmin } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

/** Calendário de funções (cada função com seu dia e responsáveis) e de toques. */
export default async function CalendarioAdmin({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { supabase } = await exigirAdmin();
  const mes = mesValido((await searchParams).mes);
  const { de, ate } = limitesDoMes(mes);
  const voltar = `/app/admin/calendario?mes=${mes}`;
  const padraoData = mes === hojeISO().slice(0, 7) ? hojeISO() : de;

  const [funcoes, toques, filhos] = await Promise.all([
    supabase
      .from('funcoes')
      .select('id, titulo, data, hora, referencia, obrigatorio, funcao_responsaveis(membro:membros(nome))')
      .gte('data', de)
      .lte('data', ate)
      .order('data'),
    supabase.from('eventos').select('id, titulo, data, hora, observacao, publico').gte('data', de).lte('data', ate).order('data'),
    supabase.from('membros').select('id, nome, grupo:grupos(numero)').eq('status', 'ativo').eq('papel', 'filho').order('nome'),
  ]);
  const itens: ItemCalendario[] = [
    ...(toques.data ?? []).map((t) => ({
      id: t.id,
      data: t.data,
      tipo: 'toque' as const,
      titulo: t.titulo,
      hora: t.hora,
      detalhe: t.observacao,
      destaque: t.publico ? null : 'Só para filhos (fora do site)',
    })),
    ...(funcoes.data ?? []).map((f) => {
      const nomes = f.funcao_responsaveis.map((r) => r.membro?.nome).filter(Boolean);
      return {
        id: f.id,
        data: f.data,
        tipo: f.obrigatorio ? ('obrig' as const) : ('funcao' as const),
        titulo: f.titulo,
        hora: f.hora,
        detalhe: f.referencia,
        destaque: nomes.length ? `Responsáveis: ${nomes.join(', ')}` : f.obrigatorio ? 'Presença obrigatória de todos os filhos' : null,
      };
    }),
  ];

  return (
    <AppShell titulo="Administração" papel="admin" voltar="/app/admin" ativo="/app/admin/calendario">
      <div className="card">
        <Calendario key={mes} mes={mes} caminho="/app/admin/calendario" itens={itens} legenda={['toque', 'funcao', 'obrig']} />
      </div>

      <div className="card">
        <h3>🔔 Funções / obrigações (visível aos filhos)</h3>
        {funcoes.data?.length ? (
          funcoes.data.map((f) => (
            <div className="item" key={f.id}>
              <div className="t">{f.titulo}</div>
              <div className="s">
                {fmt(f.data)} ({diaSemana(f.data)}){f.hora ? ` às ${hora(f.hora)}` : ''}
                {f.referencia ? ` · ${f.referencia}` : ''}
              </div>
              <div className="chips">
                {f.obrigatorio ? <span className="pill no">Presença obrigatória de todos os filhos</span> : null}
                {f.funcao_responsaveis.map((r, i) => (
                  <span className="chip" key={i}>
                    {r.membro?.nome}
                  </span>
                ))}
              </div>
              <form action={excluirFuncao} className="actions">
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="voltar" value={voltar} />
                <BotaoEnviar className="btn ghost small" confirmar="Excluir esta função?">
                  Excluir
                </BotaoEnviar>
              </form>
            </div>
          ))
        ) : (
          <div className="muted">Nenhuma função neste mês.</div>
        )}
        <details>
          <summary>+ Nova função / obrigação</summary>
          <form action={salvarFuncao} style={{ marginTop: 10 }}>
            <input type="hidden" name="voltar" value={voltar} />
            <label className="f">
              <span>Título</span>
              <input name="titulo" maxLength={120} required placeholder="Ex.: Oro para os santos da casa" />
            </label>
            <div className="two">
              <label className="f">
                <span>Data</span>
                <input type="date" name="data" defaultValue={padraoData} required />
              </label>
              <label className="f">
                <span>Hora</span>
                <input type="time" name="hora" defaultValue="18:00" />
              </label>
            </div>
            <label className="f">
              <span>Referência (opcional)</span>
              <input name="referencia" maxLength={200} placeholder="Ex.: Preparação do Ipetê da Oxum (17/10)" />
            </label>
            <label className="inline">
              <input type="checkbox" name="obrigatorio" /> Presença obrigatória de todos os filhos
            </label>
            <label className="f">
              <span>Quem vai fazer (opcional — segure Ctrl/toque para escolher vários)</span>
              <select name="responsaveis" multiple size={6}>
                {(filhos.data ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                    {m.grupo ? ` (G${m.grupo.numero})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <div className="note">Se o título contiver “Oro”, a presença obrigatória é marcada automaticamente.</div>
            <div style={{ height: 8 }} />
            <BotaoEnviar>Salvar função</BotaoEnviar>
          </form>
        </details>
      </div>

      <div className="card">
        <h3>🥁 Toques (agenda pública do site)</h3>
        {toques.data?.length ? (
          toques.data.map((t) => (
            <div className="item" key={t.id}>
              <div className="t">
                {t.titulo} {t.publico ? null : <span className="pill open">só para filhos</span>}
              </div>
              <div className="s">
                {fmt(t.data)} ({diaSemana(t.data)}){t.hora ? ` · ${hora(t.hora)}` : ''}
                {t.observacao ? ` · ${t.observacao}` : ''}
              </div>
              <form action={excluirToque} className="actions">
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="voltar" value={voltar} />
                <BotaoEnviar className="btn ghost small" confirmar="Excluir este toque?">
                  Excluir
                </BotaoEnviar>
              </form>
            </div>
          ))
        ) : (
          <div className="muted">Nenhum toque neste mês.</div>
        )}
        <details>
          <summary>+ Novo toque</summary>
          <form action={salvarToque} style={{ marginTop: 10 }}>
            <input type="hidden" name="voltar" value={voltar} />
            <label className="f">
              <span>Título</span>
              <input name="titulo" maxLength={120} required placeholder="Ex.: Toque de Exu" />
            </label>
            <div className="two">
              <label className="f">
                <span>Data</span>
                <input type="date" name="data" defaultValue={padraoData} required />
              </label>
              <label className="f">
                <span>Hora (opcional)</span>
                <input type="time" name="hora" />
              </label>
            </div>
            <label className="f">
              <span>Observação (opcional)</span>
              <input name="observacao" maxLength={300} placeholder="Ex.: Aberto à comunidade" />
            </label>
            <label className="inline">
              <input type="checkbox" name="publico" defaultChecked /> Mostrar no site público
            </label>
            <BotaoEnviar>Salvar toque</BotaoEnviar>
          </form>
        </details>
      </div>
    </AppShell>
  );
}
