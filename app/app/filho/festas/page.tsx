import { AppShell } from '@/components/AppShell';
import { FormComprovante } from '@/components/FormComprovante';
import { StatusPagamento } from '@/components/Status';
import { brl, fmt } from '@/lib/datas';
import { exigirFilho } from '@/lib/sessao';
import { enviarComprovante } from '../acoes';

export const dynamic = 'force-dynamic';

export default async function Festas() {
  const { supabase, membro } = await exigirFilho();
  const { data: lista } = await supabase
    .from('contribuicoes_festa')
    .select('id, valor, status, data_pagamento, motivo_rejeicao, festa:festas(nome, data)')
    .eq('membro_id', membro.id)
    .order('festa_id');

  return (
    <AppShell titulo="Área do filho" papel="filho" voltar="/app/filho" ativo="/app/filho">
      <div className="card">
        <h3>🎉 Festas / contribuições</h3>
        {lista?.length ? (
          lista.map((c) => (
            <div className="item" key={c.id}>
              <div className="t">
                {c.festa?.nome} — {brl(c.valor)}
              </div>
              <div className="s">
                {fmt(c.festa?.data)} · <StatusPagamento status={c.status} />
              </div>
              {c.status === 'rejeitado' && c.motivo_rejeicao ? <div className="note">Recusado: {c.motivo_rejeicao}. Envie novamente.</div> : null}
              {c.status === 'aberta' || c.status === 'rejeitado' ? (
                <FormComprovante acao={enviarComprovante} tipo="festa" referencia={c.id} />
              ) : null}
              {c.status === 'pendente' ? <div className="note">Comprovante enviado — aguardando a administração confirmar.</div> : null}
              {c.status === 'confirmado' ? <div className="note">Contribuição confirmada. Axé! 🙏</div> : null}
            </div>
          ))
        ) : (
          <div className="muted">Nenhuma festa com contribuição no momento.</div>
        )}
      </div>
    </AppShell>
  );
}
