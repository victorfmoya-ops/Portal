'use client';

import { useId, useState } from 'react';

/**
 * Campo de arquivo com texto em português em qualquer navegador
 * (o botão nativo segue o idioma do navegador: "Choose File"…).
 */
export function CampoArquivo({ name, accept, required }: { name: string; accept: string; required?: boolean }) {
  const id = useId();
  const [nome, setNome] = useState('');
  return (
    <span className="arquivo">
      <input id={id} type="file" name={name} accept={accept} required={required} onChange={(e) => setNome(e.target.files?.[0]?.name ?? '')} />
      <label htmlFor={id} className="arquivo-botao">
        📎 Escolher arquivo
      </label>
      <span className="arquivo-nome">{nome || 'Nenhum arquivo'}</span>
    </span>
  );
}
