/** Datas sempre como texto 'AAAA-MM-DD' no fuso de São Paulo (evita erro de um dia). */
export const FUSO = 'America/Sao_Paulo';

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
export const DIAS_CURTOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function hojeISO(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);
}

function partes(iso: string): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Data inválida: ${iso}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** 2026-10-17 → 17/10/2026 */
export function fmt(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [a, m, d] = partes(iso.slice(0, 10));
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`;
}

/** 2026-10-17 → 17/10 */
export function fmtCurto(iso: string): string {
  return fmt(iso).slice(0, 5);
}

export function diaSemana(iso: string): string {
  const [a, m, d] = partes(iso);
  return DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
}

export function somarDias(iso: string, dias: number): string {
  const [a, m, d] = partes(iso);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** Lista os dias de uma semana de rodada (segunda a domingo). */
export function diasDaRodada(inicio: string): string[] {
  return Array.from({ length: 7 }, (_, i) => somarDias(inicio, i));
}

export function hora(h: string | null | undefined): string {
  return h ? h.slice(0, 5) : '';
}

export function brl(v: number | string): string {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** '2026-10' a partir do parâmetro ?mes= (ou o mês atual). */
export function mesValido(param: string | undefined, hoje = hojeISO()): string {
  return param && /^\d{4}-(0[1-9]|1[0-2])$/.test(param) ? param : hoje.slice(0, 7);
}

export function mesAnterior(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`;
}

export function mesSeguinte(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`;
}

export function nomeMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  return `${MESES[m - 1]} de ${a}`;
}

/** Grade do calendário (semanas de domingo a sábado); null = célula vazia. */
export function gradeDoMes(mes: string): (string | null)[][] {
  const [a, m] = mes.split('-').map(Number);
  const primeiro = new Date(Date.UTC(a, m - 1, 1));
  const diasNoMes = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const celulas: (string | null)[] = Array(primeiro.getUTCDay()).fill(null);
  for (let d = 1; d <= diasNoMes; d++) celulas.push(`${mes}-${String(d).padStart(2, '0')}`);
  while (celulas.length % 7) celulas.push(null);
  const semanas: (string | null)[][] = [];
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7));
  return semanas;
}

/** Primeiro e último dia do mês (para filtrar no banco). */
export function limitesDoMes(mes: string): { de: string; ate: string } {
  const [a, m] = mes.split('-').map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return { de: `${mes}-01`, ate: `${mes}-${String(ultimo).padStart(2, '0')}` };
}
