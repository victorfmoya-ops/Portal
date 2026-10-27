import Link from 'next/link';
import { redirect } from 'next/navigation';
import { carregarSite } from '@/lib/publico';

export const dynamic = 'force-dynamic';

/** Loja virtual: se o admin cadastrou o link (https), redireciona; senão, "em manutenção". */
export default async function Loja() {
  const { site } = await carregarSite();
  if (site.loja_url && /^https:\/\//.test(site.loja_url)) redirect(site.loja_url);
  return (
    <div className="pub">
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="bigword">🛒 LOJA VIRTUAL</div>
        <p>A loja virtual está em manutenção. Em breve!</p>
        <Link className="btn-map" href="/">
          ‹ Voltar ao site
        </Link>
      </section>
    </div>
  );
}
