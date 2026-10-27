import { AppShell } from '@/components/AppShell';
import { FormComprovante } from '@/components/FormComprovante';
import { StatusPagamento } from '@/components/Status';
import { brl, fmt, MESES } from '@/lib/datas';
import { exigirFilho } from '@/lib/sessao';
import { enviarComprovante } from '../acoes';

export const dynamic = 'force-dynamic';

const nomeCompetencia = (c: string) => `${MESES[Number(c.slice(5, 7)) - 1]} de ${c.slice(0, 4)}`;

export default async function Mensalidade() {
  const { supabase, membro } = await exigirFilho();
  const { data: lista } = await supabase
    .from('mensalidades')
    .select('id, competencia, valor, status, data_pagamento, motivo_rejeicao')
    .eq('membro_id', membro.id)
    .order('competencia', { ascending: false })
    .limit(12);

  return (
    <AppShell titulo="Área do filho" papel="filho" voltar="/app/filho" ativo="/app/filho/mensalidade">
      {lista?.length ? (
        lista.map((m, i) => (
          <div className="card" key={m.id}>
            <h3>
              💰 {i === 0 ? 'Minha mensalidade' : 'Mensalidade'} — {brl(m.valor)}/mês
            </h3>
            <div className="item">
              <div className="t" style={{ textTransform: 'capitalize' }}>
                {nomeCompetencia(m.competencia)}
              </div>
              <div className="s">
                <StatusPagamento status={m.status} />
                {m.data_pagamento ? ` · pago em ${fmt(m.data_pagamento)}` : ''}
              </div>
            </div>
            {m.status === 'rejeitado' && m.motivo_rejeicao ? (
              <div className="note">Comprovante recusado: {m.motivo_rejeicao}. Envie novamente.</div>
            ) : null}
            {m.status === 'aberta' || m.status === 'rejeitado' ? (
              <FormComprovante acao={enviarComprovante} tipo="mensalidade" referencia={m.id} />
            ) : null}
            {m.status === 'pendente' ? (
              <div className="note">Comprovante enviado — aguardando a administração confirmar. Não é marcado como pago automaticamente.</div>
            ) : null}
            {m.status === 'confirmado' ? <div className="note">Mensalidade confirmada. Axé! 🙏</div> : null}
          </div>
        ))
      ) : (
        <div className="card muted">Nenhuma mensalidade lançada ainda.</div>
      )}
      <div className="card">
        <h3>Como funciona</h3>
        <p className="muted">
          Você paga do jeito combinado com a casa (fora do portal), informa a data, anexa o comprovante e envia → fica <b>em análise</b> → a
          administração confirma. O portal não guarda dados bancários, e o comprovante é apagado depois da análise.
        </p>
      </div>
    </AppShell>
  );
}
