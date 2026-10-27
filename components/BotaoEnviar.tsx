'use client';
import { useFormStatus } from 'react-dom';

/** Botão de formulário que trava enquanto envia (evita clique duplo). */
export function BotaoEnviar({
  children,
  className = 'btn',
  confirmar,
}: {
  children: React.ReactNode;
  className?: string;
  confirmar?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
    >
      {pending ? 'Enviando…' : children}
    </button>
  );
}
