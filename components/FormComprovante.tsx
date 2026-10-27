import { BotaoEnviar } from '@/components/BotaoEnviar';
import { CampoArquivo } from '@/components/CampoArquivo';
import { hojeISO } from '@/lib/datas';

/** Formulário de envio de comprovante (PDF ou imagem, até 10 MB). */
export function FormComprovante({
  acao,
  tipo,
  referencia,
}: {
  acao: (fd: FormData) => Promise<void>;
  tipo: 'mensalidade' | 'festa';
  referencia: string;
}) {
  return (
    <form action={acao} style={{ marginTop: 10 }}>
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="referencia" value={referencia} />
      <label className="f">
        <span>Data do pagamento</span>
        <input type="date" name="data_pagamento" defaultValue={hojeISO()} max={hojeISO()} required />
      </label>
      <div className="f">
        <span>Comprovante (PDF ou imagem, até 10 MB)</span>
        <CampoArquivo name="arquivo" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.heic,application/pdf,image/*" required />
      </div>
      <BotaoEnviar className="btn small">📎 Enviar comprovante</BotaoEnviar>
    </form>
  );
}
