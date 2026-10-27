'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

/** Mostra ?ok=... ou ?erro=... como aviso no rodapé por alguns segundos. */
export function Aviso() {
  const params = useSearchParams();
  const erro = params.get('erro');
  const texto = (erro ?? params.get('ok') ?? '').slice(0, 200);
  // "t" muda a cada ação, então a mesma mensagem aparece de novo numa segunda ação igual
  const chave = texto ? `${texto}|${params.get('t') ?? ''}` : '';
  const [fechado, setFechado] = useState('');

  useEffect(() => {
    if (!chave) return;
    const t = setTimeout(() => setFechado(chave), erro ? 6000 : 2800);
    return () => clearTimeout(t);
  }, [chave, erro]);

  if (!chave || fechado === chave) return null;
  return (
    <div className={`toast${erro ? ' erro' : ''}`} role={erro ? 'alert' : 'status'}>
      {texto}
    </div>
  );
}
