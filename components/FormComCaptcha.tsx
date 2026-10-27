'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';

type Grecaptcha = {
  render: (el: HTMLElement, opcoes: Record<string, unknown>) => number;
  getResponse: (id?: number) => string;
  reset: (id?: number) => void;
};
declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
    aoCarregarRecaptcha?: () => void;
  }
}

/**
 * Formulário com reCAPTCHA v2 ("Não sou um robô"). A caixinha cria o campo
 * "g-recaptcha-response", que o servidor confere no Google. Sem chave, é um formulário comum.
 */
export function FormComCaptcha({
  acao,
  chave,
  botao,
  children,
}: {
  acao: (fd: FormData) => Promise<void>;
  chave: string | null;
  botao: React.ReactNode;
  children: React.ReactNode;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const widget = useRef<number | null>(null);
  const [erro, setErro] = useState('');

  const desenhar = useCallback(() => {
    const g = window.grecaptcha;
    if (!chave || !g?.render || !caixa.current || widget.current !== null) return;
    widget.current = g.render(caixa.current, {
      sitekey: chave,
      theme: 'dark',
      callback: () => setErro(''),
      'expired-callback': () => setErro('A verificação expirou. Marque a caixinha de novo.'),
    });
  }, [chave]);

  useEffect(() => {
    if (!chave) return;
    // o script chama aoCarregarRecaptcha quando termina; se já estava carregado (navegação), desenha na hora
    window.aoCarregarRecaptcha = desenhar;
    desenhar();
    return () => {
      widget.current = null;
    };
  }, [chave, desenhar]);

  function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    if (!chave) return;
    const g = window.grecaptcha;
    if (!g || widget.current === null) {
      e.preventDefault();
      setErro('A verificação de segurança ainda está carregando. Aguarde um instante.');
      return;
    }
    if (!g.getResponse(widget.current)) {
      e.preventDefault();
      setErro('Marque a caixinha “Não sou um robô”.');
    }
  }

  return (
    <form action={acao} onSubmit={aoEnviar}>
      {children}
      {chave ? (
        <>
          <Script src="https://www.google.com/recaptcha/api.js?render=explicit&onload=aoCarregarRecaptcha&hl=pt-BR" strategy="afterInteractive" />
          <div ref={caixa} className="captcha" />
        </>
      ) : null}
      {erro ? (
        <p role="alert" style={{ color: 'var(--red)', fontSize: 13, margin: '0 0 10px' }}>
          {erro}
        </p>
      ) : null}
      {botao}
    </form>
  );
}
