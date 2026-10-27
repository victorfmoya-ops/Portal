import Link from 'next/link';

/** Cabeçalho flutuante do site público. Fora da página inicial, as âncoras apontam para "/#…". */
export function SiteHeader({ inicio = false }: { inicio?: boolean }) {
  const p = inicio ? '' : '/';
  return (
    <header className="site-header">
      <Link className="brand" href={inicio ? '#top' : '/'}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo.png" alt="Brasão" />
        <span>
          Família <em>Àṣẹ</em> Omos Odé
        </span>
      </Link>
      <nav className="site-nav" aria-label="Site">
        <a href={`${p}#casa`}>A Casa</a>
        <Link href="/agenda">Agenda</Link>
        <a href={`${p}#galeria`}>Galeria</a>
        <a href={`${p}#buzios`}>Búzios</a>
        <Link href="/loja">Loja</Link>
        <a href={`${p}#local`}>Local</a>
      </nav>
      <Link className="cta" href="/entrar">
        <span aria-hidden>🔒</span> Área restrita
      </Link>
    </header>
  );
}
