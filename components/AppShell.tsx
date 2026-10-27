import Link from 'next/link';
import { Suspense } from 'react';
import { Aviso } from '@/components/Aviso';

type ItemNav = { href: string; icone: string; rotulo: string };

const NAV_FILHO: ItemNav[] = [
  { href: '/app/filho', icone: '🏠', rotulo: 'Início' },
  { href: '/app/filho/escala', icone: '🧹', rotulo: 'Escala' },
  { href: '/app/filho/calendario', icone: '📅', rotulo: 'Calendário' },
  { href: '/app/aprender', icone: '📖', rotulo: 'Aprender' },
  { href: '/app/equipes', icone: '🤝', rotulo: 'Equipes' },
  { href: '/app/filho/mensalidade', icone: '💰', rotulo: 'Mensalidade' },
  { href: '/app/filho/grupo', icone: '👥', rotulo: 'Grupo' },
];

const NAV_ADMIN: ItemNav[] = [
  { href: '/app/admin', icone: '🏠', rotulo: 'Início' },
  { href: '/app/admin/rodizio', icone: '🧹', rotulo: 'Rodízio' },
  { href: '/app/admin/calendario', icone: '📅', rotulo: 'Calendário' },
  { href: '/app/aprender', icone: '📖', rotulo: 'Aprender' },
  { href: '/app/equipes', icone: '🤝', rotulo: 'Equipes' },
  { href: '/app/admin/financeiro', icone: '💰', rotulo: 'Financeiro' },
  { href: '/app/admin/grupos', icone: '👥', rotulo: 'Grupos' },
];

/**
 * Moldura do aplicativo (igual ao protótipo): topo azul com brasão,
 * botão voltar, selo FILHO/ADMIN e menu inferior.
 */
export function AppShell({
  titulo,
  papel,
  voltar,
  ativo,
  children,
}: {
  titulo: string;
  papel?: 'filho' | 'admin';
  voltar?: string;
  ativo?: string;
  children: React.ReactNode;
}) {
  const nav = papel === 'admin' ? NAV_ADMIN : papel === 'filho' ? NAV_FILHO : null;
  return (
    <div className="app">
      <header className="top">
        {voltar ? (
          <Link className="btn-back" href={voltar} aria-label="Voltar">
            ‹
          </Link>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo.png" alt="Brasão da casa" />
        <h1>{titulo}</h1>
        {papel ? <span className="role">{papel === 'admin' ? 'ADMIN' : 'FILHO'}</span> : null}
        {papel ? (
          <form action="/auth/sair" method="post">
            <button className="btn-sair" type="submit" title="Sair da conta">
              Sair
            </button>
          </form>
        ) : null}
      </header>
      <main>{children}</main>
      {nav ? (
        <nav className="bottom" aria-label="Menu">
          {nav.map((i) => (
            <Link key={i.href} href={i.href} className={ativo === i.href ? 'active' : ''}>
              <span className="i" aria-hidden>
                {i.icone}
              </span>
              {i.rotulo}
            </Link>
          ))}
        </nav>
      ) : null}
      <Suspense fallback={null}>
        <Aviso />
      </Suspense>
    </div>
  );
}
