import { Calendario } from '@/components/Calendario';
import { SiteHeader } from '@/components/SiteHeader';
import { diaSemana, fmt, hora, limitesDoMes, mesValido, nomeMes } from '@/lib/datas';
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
      <div className="aurora" aria-hidden />
      <SiteHeader />
      <section className="section">
        <p className="kicker">Calendário de</p>
        <div className="bigword">TOQUES</div>
        <p className="lead">Os toques abertos à comunidade. Toque num dia para ver os detalhes.</p>
        <div className="cal-box">
          <Calendario
            key={mes}
            mes={mes}
            caminho="/agenda"
            itens={lista.map((e) => ({ id: e.id, data: e.data, tipo: 'toque' as const, titulo: e.titulo, hora: e.hora, detalhe: e.observacao }))}
            legenda={['toque']}
          />
        </div>
        <h3 className="sub">Toques de {nomeMes(mes)}</h3>
        <ul className="timeline">
          {lista.length ? (
            lista.map((e) => (
              <li key={e.id}>
                <span className="quando">
                  <b>{e.data.slice(8)}</b>
                  {diaSemana(e.data).slice(0, 3)}
                </span>
                <div>
                  <strong>{e.titulo}</strong>
                  <span>
                    {fmt(e.data)}
                    {e.hora ? ` · ${hora(e.hora)}` : ''}
                    {e.observacao ? ` · ${e.observacao}` : ''}
                  </span>
                </div>
              </li>
            ))
          ) : (
            <li className="vazio">Nenhum toque neste mês.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
