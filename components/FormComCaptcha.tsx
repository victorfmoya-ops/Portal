'use client';

import Script from 'next/script';
import { useRef, useState } from 'react';

type Enterprise = {
  ready: (fn: () => void) => void;
  execute: (chave: string, opcoes: { action: string }) => Promise<string>;
};
declare global {
  interface Window {
    grecaptcha?: { enterprise?: Enterprise };
  }
}

/** O script do Google leva alguns segundos para carregar: espera até 10 s antes de desistir. */
async function esperarRecaptcha(limiteMs = 10_000): Promise<Enterprise | null> {
  const fim = Date.now() + limiteMs;
  while (Date.now() < fim) {
    const g = window.grecaptcha?.enterprise;
    if (g?.execute) return g;
    await new Promise((r) => setTimeout(r, 200));
  }
  return null;
}

/**
 * Formulário protegido por reCAPTCHA Enterprise (invisível, por pontuação).
 * Antes de enviar, pede o token ao Google e o coloca no campo "recaptcha";
 * o servidor confere o token. Sem chave configurada, é um formulário comum.
 */
export function FormComCaptcha({
  acao,
  chave,
  acaoRecaptcha,
  children,
}: {
  acao: (fd: FormData) => Promise<void>;
  chave: string | null;
  acaoRecaptcha: string;
  children: React.ReactNode;
}) {
  const form = useRef<HTMLFormElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const liberado = useRef(false);
  const [verificando, setVerificando] = useState(false);
  const [erro, setErro] = useState('');

  function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    if (!chave || liberado.current) {
      liberado.current = false;
      return; // segue para a Server Action
    }
    e.preventDefault();
    if (verificando) return;
    setErro('');
    setVerificando(true);
    void (async () => {
      const g = await esperarRecaptcha();
      if (!g) {
        setVerificando(false);
        setErro('A verificação de segurança não carregou. Confira a internet e recarregue a página.');
        return;
      }
      g.ready(async () => {
        try {
          campo.current!.value = await g.execute(chave, { action: acaoRecaptcha });
          liberado.current = true;
          form.current!.requestSubmit();
        } catch {
          setErro('Não foi possível fazer a verificação de segurança. Tente de novo.');
        } finally {
          setVerificando(false);
        }
      });
    })();
  }

  return (
    <form ref={form} action={acao} onSubmit={aoEnviar}>
      {chave ? (
        <>
          <Script src={`https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(chave)}`} strategy="afterInteractive" />
          <input ref={campo} type="hidden" name="recaptcha" />
        </>
      ) : null}
      {children}
      {verificando ? (
        <p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>
          Verificando segurança…
        </p>
      ) : null}
      {erro ? (
        <p role="alert" style={{ color: 'var(--red)', fontSize: 13, margin: '8px 0 0' }}>
          {erro}
        </p>
      ) : null}
      {chave ? (
        <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>
          Protegido pelo reCAPTCHA do Google — <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacidade</a> e{' '}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Termos</a>.
        </p>
      ) : null}
    </form>
  );
}
