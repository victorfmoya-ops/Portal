'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DIAS_ABREV, MESES, diaSemana, gradeDoMes, hojeISO, hora, mesAnterior, mesSeguinte } from '@/lib/datas';

export type Marcacao = 'toque' | 'funcao' | 'obrig' | 'limpeza';

/** Um compromisso no calendário (toque, função, obrigação ou limpeza). */
export type ItemCalendario = {
  id: string;
  data: string;
  tipo: Marcacao;
  titulo: string;
  hora?: string | null;
  detalhe?: string | null;
  destaque?: string | null;
};

const ROTULO: Record<Marcacao, string> = {
  toque: 'Toque',
  funcao: 'Função',
  obrig: 'Obrigação',
  limpeza: 'Minha limpeza',
};

const MAX_NA_CELULA = 3;

/**
 * Calendário mensal: cada dia mostra os compromissos com título e cor por tipo.
 * Tocar num dia abre os detalhes; os botões da legenda filtram os tipos.
 */
export function Calendario({
  mes,
  caminho,
  itens,
  legenda,
}: {
  mes: string;
  caminho: string;
  itens: ItemCalendario[];
  legenda: Marcacao[];
}) {
  const hoje = hojeISO();
  const [ativos, setAtivos] = useState<Set<Marcacao>>(() => new Set(legenda));
  const visiveis = useMemo(() => itens.filter((i) => ativos.has(i.tipo)), [itens, ativos]);
  const porDia = useMemo(() => {
    const r: Record<string, ItemCalendario[]> = {};
    for (const i of visiveis) (r[i.data] ??= []).push(i);
    for (const lista of Object.values(r)) lista.sort((a, b) => (a.hora ?? '99').localeCompare(b.hora ?? '99'));
    return r;
  }, [visiveis]);
  const [selecionado, setSelecionado] = useState<string>(() =>
    hoje.startsWith(mes) ? hoje : ([...itens].sort((a, b) => a.data.localeCompare(b.data))[0]?.data ?? `${mes}-01`),
  );

  const [ano, numMes] = mes.split('-').map(Number);
  const doDia = porDia[selecionado] ?? [];
  const alternar = (t: Marcacao) =>
    setAtivos((atual) => {
      const novo = new Set(atual);
      if (novo.has(t)) novo.delete(t);
      else novo.add(t);
      return novo;
    });

  return (
    <div className="calx">
      <div className="calx-topo">
        <div>
          <span className="calx-ano">{ano}</span>
          <h3 className="calx-mes">{MESES[numMes - 1]}</h3>
        </div>
        <div className="calx-nav">
          <Link href={`${caminho}?mes=${mesAnterior(mes)}`} scroll={false} aria-label="Mês anterior">
            ‹
          </Link>
          <Link href={caminho} scroll={false} className="hoje">
            Hoje
          </Link>
          <Link href={`${caminho}?mes=${mesSeguinte(mes)}`} scroll={false} aria-label="Próximo mês">
            ›
          </Link>
        </div>
      </div>

      {legenda.length > 1 ? (
        <div className="calx-filtros" role="group" aria-label="Mostrar no calendário">
          {legenda.map((t) => (
            <button key={t} type="button" className={`calx-filtro ${t}`} aria-pressed={ativos.has(t)} onClick={() => alternar(t)}>
              <span className={`dot ${t}`} aria-hidden /> {ROTULO[t]}
              <span className="qtd">{itens.filter((i) => i.tipo === t).length}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="calx-grade">
        {DIAS_ABREV.map((d) => (
          <div key={d} className="calx-sem" aria-hidden>
            {d}
          </div>
        ))}
        {gradeDoMes(mes)
          .flat()
          .map((dia, i) => {
            if (!dia) return <div key={i} className="calx-cel vazio" />;
            const lista = porDia[dia] ?? [];
            const classes = ['calx-cel', dia === hoje && 'hoje', dia === selecionado && 'sel', lista.length && 'tem', dia < hoje && 'passou']
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={dia}
                type="button"
                className={classes}
                onClick={() => setSelecionado(dia)}
                aria-pressed={dia === selecionado}
                aria-label={`${Number(dia.slice(8))} de ${MESES[numMes - 1]}${lista.length ? `, ${lista.length} compromisso(s)` : ''}`}
              >
                <span className="n">{Number(dia.slice(8))}</span>
                <span className="calx-evs" aria-hidden>
                  {lista.slice(0, MAX_NA_CELULA).map((e) => (
                    <span key={e.id} className={`calx-ev ${e.tipo}`}>
                      {e.hora ? <b>{hora(e.hora)}</b> : null}
                      {e.titulo}
                    </span>
                  ))}
                  {lista.length > MAX_NA_CELULA ? <span className="calx-mais">+{lista.length - MAX_NA_CELULA}</span> : null}
                </span>
                <span className="calx-dots" aria-hidden>
                  {lista.map((e) => (
                    <span key={e.id} className={`dot ${e.tipo}`} />
                  ))}
                </span>
              </button>
            );
          })}
      </div>

      <div className="calx-dia" aria-live="polite">
        <div className="calx-dia-cab">
          <span className="calx-dia-n">{Number(selecionado.slice(8))}</span>
          <div>
            <strong>{diaSemana(selecionado)}</strong>
            <span>
              {MESES[Number(selecionado.slice(5, 7)) - 1]} de {selecionado.slice(0, 4)}
            </span>
          </div>
        </div>
        {doDia.length ? (
          <ul>
            {doDia.map((e) => (
              <li key={e.id} className={e.tipo}>
                <span className="tag">{ROTULO[e.tipo]}</span>
                <span className="titulo">{e.titulo}</span>
                <span className="info">
                  {e.hora ? `às ${hora(e.hora)}` : 'horário a confirmar'}
                  {e.detalhe ? ` · ${e.detalhe}` : ''}
                </span>
                {e.destaque ? <span className="destaque">{e.destaque}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="calx-vazio">Nada marcado neste dia.</p>
        )}
      </div>
    </div>
  );
}
