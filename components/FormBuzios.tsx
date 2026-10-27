'use client';
import { useState } from 'react';

/** Agendar jogo de búzios: monta a mensagem e abre o WhatsApp da casa. Nada é enviado sozinho. */
export function FormBuzios({ whatsapp }: { whatsapp: string }) {
  const [erro, setErro] = useState('');
  return (
    <form
      style={{ maxWidth: 520 }}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const nome = String(fd.get('nome') || '').trim();
        const contato = String(fd.get('contato') || '').trim();
        const data = String(fd.get('data') || '').trim();
        const msg = String(fd.get('msg') || '').trim();
        if (!nome || !contato) {
          setErro('Preencha nome e contato.');
          return;
        }
        setErro('');
        const texto =
          `Olá! Gostaria de agendar um jogo de búzios.\n\nNome: ${nome}\nContato: ${contato}` +
          (data ? `\nData desejada: ${data}` : '') +
          (msg ? `\nMensagem: ${msg}` : '');
        window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
      }}
    >
      <label className="field">
        <span>Seu nome</span>
        <input name="nome" maxLength={120} required placeholder="Como podemos te chamar" />
      </label>
      <label className="field">
        <span>Seu contato (WhatsApp/telefone)</span>
        <input name="contato" maxLength={40} required placeholder="(DDD) número" />
      </label>
      <label className="field">
        <span>Data desejada (opcional)</span>
        <input name="data" maxLength={60} placeholder="Ex.: sábado à tarde" />
      </label>
      <label className="field">
        <span>Mensagem (opcional)</span>
        <textarea name="msg" maxLength={500} rows={3} placeholder="Conte brevemente o que procura" />
      </label>
      {erro ? <p style={{ color: 'var(--red)', fontWeight: 700 }}>{erro}</p> : null}
      <button className="btn-wpp" type="submit">
        💬 Enviar pelo WhatsApp
      </button>
      <p className="note">O botão abre o WhatsApp com a mensagem pronta; você confere e envia. Nada é enviado automaticamente.</p>
    </form>
  );
}
