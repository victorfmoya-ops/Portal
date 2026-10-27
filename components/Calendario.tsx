import Link from 'next/link';
import { DIAS_CURTOS, gradeDoMes, hojeISO, mesAnterior, mesSeguinte, nomeMes } from '@/lib/datas';

export type Marcacao = 'toque' | 'funcao' | 'obrig' | 'limpeza';

const ROTULO: Record<Marcacao, string> = {
  toque: 'Toque',
  funcao: 'Função',
  obrig: 'Função obrigatória',
  limpeza: 'Minha limpeza',
};

/** Calendário mensal com pontinhos coloridos por tipo de compromisso. */
export function Calendario({
  mes,
  caminho,
  marcacoes,
  legenda,
}: {
  mes: string;
  caminho: string;
  marcacoes: Record<string, Marcacao[]>;
  legenda: Marcacao[];
}) {
  const hoje = hojeISO();
  return (
    <div>
      <div className="cal-nav">
        <Link href={`${caminho}?mes=${mesAnterior(mes)}`} aria-label="Mês anterior">
          ‹
        </Link>
        <strong>{nomeMes(mes)}</strong>
        <Link href={`${caminho}?mes=${mesSeguinte(mes)}`} aria-label="Próximo mês">
          ›
        </Link>
      </div>
      <table className="cal">
        <thead>
          <tr>
            {DIAS_CURTOS.map((d, i) => (
              <th key={i} scope="col">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {gradeDoMes(mes).map((semana, i) => (
            <tr key={i}>
              {semana.map((dia, j) =>
                dia ? (
                  <td key={j} className={dia === hoje ? 'hoje' : undefined}>
                    <span className="n">{Number(dia.slice(8))}</span>
                    <span className="dots">
                      {(marcacoes[dia] ?? []).map((m, k) => (
                        <span key={k} className={`dot ${m}`} title={ROTULO[m]} />
                      ))}
                    </span>
                  </td>
                ) : (
                  <td key={j} className="vazio" />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="legenda">
        {legenda.map((m) => (
          <span key={m}>
            <span className={`dot ${m}`} /> {ROTULO[m]}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Junta datas e tipos no formato que o calendário espera. */
export function marcar(itens: { data: string; tipo: Marcacao }[]): Record<string, Marcacao[]> {
  const r: Record<string, Marcacao[]> = {};
  for (const i of itens) (r[i.data] ??= []).push(i.tipo);
  return r;
}
