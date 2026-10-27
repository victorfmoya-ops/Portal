import Link from 'next/link';
import { Calendario } from '@/components/Calendario';
import { FormBuzios } from '@/components/FormBuzios';
import { SiteHeader } from '@/components/SiteHeader';
import { carregarSite, urlFotoGaleria } from '@/lib/publico';
import { MESES, diaSemana, diasAte, fmt, hojeISO, hora } from '@/lib/datas';

export const dynamic = 'force-dynamic';

function quandoFalta(dias: number): string {
  if (dias === 0) return 'é hoje';
  if (dias === 1) return 'é amanhã';
  return `faltam ${dias} dias`;
}

export default async function Inicio() {
  const { site, eventos, fotos, videos } = await carregarSite();
  const hoje = hojeISO();
  const mes = hoje.slice(0, 7);
  const proximos = eventos.filter((e) => e.data >= hoje).slice(0, 6);
  const proximo = proximos[0];
  const anos = Number(hoje.slice(0, 4)) - 1980;
  const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.endereco)}`;
  const wppFormatado = site.whatsapp.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, '+55 $1 $2-$3');

  return (
    <div className="pub" id="top" style={{ ['--brand' as string]: site.cor }}>
      <div className="aurora" aria-hidden />
      <SiteHeader inicio />

      <section className="hero2">
        <div className="hero-conteudo">
          <span className="selo">
            <span className="pulso" aria-hidden /> Casa de axé · São Paulo · desde 1980
          </span>
          <h1>{site.hero_titulo}</h1>
          <p>{site.hero_subtitulo}</p>
          <div className="hero-acoes">
            <a className="cta" href="#buzios">
              Agende um jogo de búzios
            </a>
            <Link className="cta ghost" href="/agenda">
              📅 Agenda de toques
            </Link>
          </div>
          <dl className="numeros">
            <div>
              <dt>Fundação</dt>
              <dd>1980</dd>
            </div>
            <div>
              <dt>Anos de axé</dt>
              <dd>{anos}+</dd>
            </div>
          </dl>
        </div>
        {proximo ? (
          <a className="proximo" href="#agenda">
            <span className="rot">
              <span className="pulso" aria-hidden /> Próximo toque · {quandoFalta(diasAte(proximo.data, hoje))}
            </span>
            <strong>{proximo.titulo}</strong>
            <span>
              {fmt(proximo.data)} · {diaSemana(proximo.data)}
              {proximo.hora ? ` · ${hora(proximo.hora)}` : ''}
            </span>
          </a>
        ) : null}
      </section>

      <section className="section" id="casa">
        <p className="kicker">Mais de {anos} anos de</p>
        <div className="bigword">FÉ</div>
        <p>{site.sobre}</p>
      </section>

      <section className="section" id="agenda">
        <p className="kicker">Calendário de</p>
        <div className="bigword">TOQUES</div>
        <div className="agenda-grid">
          <div className="cal-box">
            <Calendario
              key={mes}
              mes={mes}
              caminho="/agenda"
              itens={eventos.map((e) => ({ id: e.id, data: e.data, tipo: 'toque' as const, titulo: e.titulo, hora: e.hora, detalhe: e.observacao }))}
              legenda={['toque']}
            />
          </div>
          <div>
            <h3 className="sub">Próximos toques</h3>
            <ul className="timeline">
              {proximos.length ? (
                proximos.map((ev) => (
                  <li key={ev.id}>
                    <span className="quando">
                      <b>{ev.data.slice(8)}</b>
                      {MESES[Number(ev.data.slice(5, 7)) - 1].slice(0, 3)}
                    </span>
                    <div>
                      <strong>{ev.titulo}</strong>
                      <span>
                        {diaSemana(ev.data)}
                        {ev.hora ? ` · ${hora(ev.hora)}` : ''}
                        {ev.observacao ? ` · ${ev.observacao}` : ''}
                      </span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="vazio">Nenhum toque marcado no momento. Volte em breve!</li>
              )}
            </ul>
            <Link className="link-mais" href="/agenda">
              📅 Ver o calendário de toques →
            </Link>
          </div>
        </div>
      </section>

      <section className="alt">
        <div className="inner" id="galeria">
          <p className="kicker">Fotos e vídeos das</p>
          <div className="bigword">FESTAS</div>
          <div className="gal">
            {fotos.length ? (
              fotos.map((f) => (
                <div className="ph" key={f.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urlFotoGaleria(f.storage_path!)} alt={f.titulo || 'Foto da festa'} loading="lazy" />
                </div>
              ))
            ) : (
              <>
                <div className="ph">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/fundo-inicial.png" alt="Festa" />
                </div>
                <div className="ph">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/logo.png" alt="Brasão" />
                </div>
                <div className="ph">📷</div>
              </>
            )}
          </div>
          {videos.length ? (
            <div className="videos">
              <h3 className="sub">Vídeos</h3>
              {videos.map((v) => (
                <a key={v.id} href={v.url!} target="_blank" rel="noopener noreferrer">
                  ▶ {v.titulo || v.url}
                </a>
              ))}
            </div>
          ) : null}
          <p className="note">As fotos e vídeos são publicados pela administração da casa na área restrita.</p>
        </div>
      </section>

      <section className="section" id="buzios">
        <p className="kicker">Agende um</p>
        <div className="bigword">JOGO DE BÚZIOS</div>
        <p>Preencha e envie pelo WhatsApp para combinarmos dia e horário.</p>
        <div className="vidro">
          <FormBuzios whatsapp={site.whatsapp} />
        </div>
      </section>

      <section className="alt">
        <div className="inner" id="local">
          <p className="kicker">Onde</p>
          <div className="bigword">ESTAMOS</div>
          <p>{site.endereco}</p>
          <a className="btn-map" href={mapa} target="_blank" rel="noopener noreferrer">
            📍 Ver no mapa
          </a>
        </div>
      </section>

      <footer className="site-footer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo.png" alt="Brasão" />
        <h3>Família Àṣẹ Omos Odé</h3>
        <p>{site.endereco}</p>
        <p>WhatsApp: {wppFormatado}</p>
        <Link className="cta" href="/entrar">
          🔒 Área restrita (filhos e administradores)
        </Link>
      </footer>
    </div>
  );
}
