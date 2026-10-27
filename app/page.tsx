import Link from 'next/link';
import { FormBuzios } from '@/components/FormBuzios';
import { carregarSite, urlFotoGaleria } from '@/lib/publico';
import { diaSemana, fmtCurto, hora } from '@/lib/datas';

export const dynamic = 'force-dynamic';

const ORIXAS = [
  { e: '🏹', n: 'Odé / Oxóssi', d: 'Caçador · fartura · o mato' },
  { e: '💛', n: 'Oxum', d: 'Rio · ouro · amor' },
  { e: '🌾', n: 'Obaluaê / Azauani', d: 'Terra · saúde · cura' },
];

export default async function Inicio() {
  const { site, eventos, fotos, videos } = await carregarSite();
  const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.endereco)}`;
  const wppFormatado = site.whatsapp.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, '+55 $1 $2-$3');

  return (
    <div className="pub" id="top" style={{ ['--brand' as string]: site.cor }}>
      <header className="site-header">
        <a className="brand" href="#top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo.png" alt="Brasão" />
          <span>Família Àṣẹ Omos Odé</span>
        </a>
        <nav className="site-nav">
          <a href="#casa">A Casa</a>
          <a href="#orixas">Orixás</a>
          <a href="#agenda">Agenda</a>
          <a href="#galeria">Galeria</a>
          <a href="#buzios">Búzios</a>
          <Link href="/loja">Loja virtual</Link>
          <a href="#local">Local</a>
          <Link className="cta" href="/entrar">
            Área restrita
          </Link>
        </nav>
      </header>

      <section className="hero2">
        <div>
          <h1>{site.hero_titulo}</h1>
          <p>{site.hero_subtitulo}</p>
          <a className="cta" href="#buzios">
            Agende um jogo de búzios
          </a>
        </div>
      </section>

      <section className="section" id="casa">
        <p className="kicker">Mais de 45 anos de</p>
        <div className="bigword">FÉ</div>
        <p>{site.sobre}</p>
      </section>

      <section className="alt">
        <div className="inner" id="orixas">
          <p className="kicker">Nossos</p>
          <div className="bigword">ORIXÁS</div>
          <div className="cards3">
            {ORIXAS.map((o) => (
              <div className="c" key={o.n}>
                <div className="e" aria-hidden>
                  {o.e}
                </div>
                <h4>{o.n}</h4>
                <p>{o.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="agenda">
        <p className="kicker">Próximos</p>
        <div className="bigword">TOQUES</div>
        {eventos.length ? (
          <ul className="agenda-list">
            {eventos.map((ev) => (
              <li key={ev.id}>
                <b>{ev.titulo}</b>
                <span>
                  {fmtCurto(ev.data)} ({diaSemana(ev.data)}){ev.hora ? ` · ${hora(ev.hora)}` : ''}
                  {ev.observacao ? ` · ${ev.observacao}` : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="note">Nenhum toque marcado no momento. Volte em breve!</p>
        )}
        <Link className="link-mais" href="/agenda">
          📅 Ver o calendário de toques
        </Link>
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
              <h3 style={{ marginTop: 22, fontStyle: 'italic' }}>Vídeos</h3>
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
        <FormBuzios whatsapp={site.whatsapp} />
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
        <h3 style={{ fontStyle: 'italic', margin: '12px 0 2px' }}>Família Àṣẹ Omos Odé</h3>
        <p style={{ opacity: 0.85, margin: '0 0 2px' }}>{site.endereco}</p>
        <p style={{ opacity: 0.85, margin: 0 }}>WhatsApp: {wppFormatado}</p>
        <Link className="cta" href="/entrar">
          🔒 Área restrita (filhos e administradores)
        </Link>
      </footer>
    </div>
  );
}
