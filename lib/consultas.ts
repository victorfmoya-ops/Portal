import 'server-only';
import { hojeISO } from '@/lib/datas';
import type { obterSessao } from '@/lib/sessao';

type Db = NonNullable<Awaited<ReturnType<typeof obterSessao>>>['supabase'];

export function competenciaAtual(hoje = hojeISO()): string {
  return `${hoje.slice(0, 7)}-01`;
}

/** Rodadas futuras (ou em andamento) do grupo do filho, com locais e o dia que ele escolheu. */
export async function rodadasDoMeuGrupo(db: Db, membroId: string, limite = 6) {
  const hoje = hojeISO();
  const { data: rodadas } = await db
    .from('rodadas')
    .select('id, numero, inicio, fim, prazo_escolha, grupo:grupos(numero), rodada_locais(concluido_em, local:locais(nome, ordem, restrito))')
    .gte('fim', hoje)
    .order('inicio')
    .limit(limite);
  const ids = (rodadas ?? []).map((r) => r.id);
  const { data: escolhas } = ids.length
    ? await db.from('escolhas_limpeza').select('rodada_id, dia').eq('membro_id', membroId).in('rodada_id', ids)
    : { data: [] as { rodada_id: string; dia: string }[] };
  const meuDia = new Map((escolhas ?? []).map((e) => [e.rodada_id, e.dia]));
  return (rodadas ?? []).map((r) => {
    const locais = [...(r.rodada_locais ?? [])].sort((a, b) => (a.local?.ordem ?? 0) - (b.local?.ordem ?? 0));
    return {
      ...r,
      locais,
      feitos: locais.filter((l) => l.concluido_em).length,
      meuDia: meuDia.get(r.id) ?? null,
      emAndamento: r.inicio <= hoje && r.fim >= hoje,
      podeEscolher: hoje <= r.prazo_escolha,
    };
  });
}
