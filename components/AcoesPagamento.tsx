import { BotaoEnviar } from '@/components/BotaoEnviar';
import { decidirPagamento } from '@/app/app/admin/acoes';

/** Botões do admin para uma mensalidade/contribuição (iguais ao protótipo + recusar com motivo). */
export function AcoesPagamento({
  tipo,
  id,
  status,
  comprovanteId,
  voltar,
}: {
  tipo: 'mensalidade' | 'festa';
  id: string;
  status: string;
  comprovanteId?: string;
  voltar: string;
}) {
  const campos = (decisao: string) => (
    <>
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="decisao" value={decisao} />
      <input type="hidden" name="voltar" value={voltar} />
    </>
  );
  return (
    <div className="actions" style={{ margin: 0, justifyContent: 'flex-end' }}>
      {status === 'pendente' && comprovanteId ? (
        <a className="btn ghost small" href={`/app/admin/comprovante/${comprovanteId}`} target="_blank" rel="noopener noreferrer">
          📎 Ver
        </a>
      ) : null}
      {status === 'pendente' ? (
        <form action={decidirPagamento}>
          {campos('confirmado')}
          <BotaoEnviar className="btn green small">✔ Confirmar</BotaoEnviar>
        </form>
      ) : null}
      {status === 'aberta' || status === 'rejeitado' ? (
        <form action={decidirPagamento}>
          {campos('confirmado')}
          <BotaoEnviar className="btn sec small">Marcar pago</BotaoEnviar>
        </form>
      ) : null}
      {status === 'confirmado' || status === 'rejeitado' ? (
        <form action={decidirPagamento}>
          {campos('aberta')}
          <BotaoEnviar className="btn ghost small">Desfazer</BotaoEnviar>
        </form>
      ) : null}
      {status === 'pendente' ? (
        <details style={{ width: '100%' }}>
          <summary>Recusar comprovante</summary>
          <form action={decidirPagamento} className="actions">
            {campos('rejeitado')}
            <input name="motivo" placeholder="Motivo (o filho vai ver)" maxLength={300} required style={{ flex: 1 }} />
            <BotaoEnviar className="btn red small">Recusar</BotaoEnviar>
          </form>
        </details>
      ) : null}
    </div>
  );
}
