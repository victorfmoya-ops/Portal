import Link from 'next/link';
import { Calendario, marcar } from '@/components/Calendario';
import { diaSemana, fmt, hora, limitesDoMes, mesValido } from '@/lib/datas';
import { envPublico } from '@/lib/env';
import { criarClientePublico } from '@/lib/supabase/servico';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Calendário de toques — Família Àṣẹ Omos Odé' };

/** Calendário público de toques (visitantes, sem login). */
export default async function Agenda({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const mes = mesValido((await searchParams).mes);
  const { de, ate } = limitesDoMes(mes);
  const db = criarClientePublico();
  const { data: org } = await db.from('organizacoes').select('id').eq('slug', envPublico.NEXT_PUBLIC_ORG_SLUG).maybeSingle();
  const { data: eventos } = org
    ? await db.from('eventos').select('id, titulo, data, hora, observacao').eq('org_id', org.id).gte('data', de).lte('data', ate).order('data')
    : { data: [] };
  const lista = eventos ?? [];

  return (
    <div className="pub">
      <header className="site-header">
        <Link className="brand" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo.png" alt="Brasão" />
          <span>Família Àṣẹ Omos Odé</span>
        </Link>
        <nav className="site-nav">
          <Link href="/">Início</Link>
          <Link className="cta" href="/entrar">
            Área restrita
          </Link>
        </nav>
      </header>
      <section className="section">
        <p className="kicker">Calendário de</p>
        <div className="bigword">TOQUES</div>
        <div className="cal-box">
          <Calendario mes={mes} caminho="/agenda" marcacoes={marcar(lista.map((e) => ({ data: e.data, tipo: 'toque' })))} legenda={['toque']} />
        </div>
        <ul className="agenda-list" style={{ marginTop: 18 }}>
          {lista.length ? (
            lista.map((e) => (
              <li key={e.id}>
                <b>{e.titulo}</b>
                <span>
                  {fmt(e.data)} ({diaSemana(e.data)}){e.hora ? ` · ${hora(e.hora)}` : ''}
                  {e.observacao ? ` · ${e.observacao}` : ''}
                </span>
              </li>
            ))
          ) : (
            <li>
              <span>Nenhum toque neste mês.</span>
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
