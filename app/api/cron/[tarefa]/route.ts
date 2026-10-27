import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { metricas } from '@/lib/metricas';
import { criarClienteServico } from '@/lib/supabase/servico';

export const dynamic = 'force-dynamic';

/**
 * Rotinas automáticas chamadas pelo agendador (container "agendador" no Docker
 * ou qualquer cron externo) com o cabeçalho Authorization: Bearer CRON_SECRET.
 *   POST /api/cron/limpar-comprovantes  → apaga comprovantes já analisados (privacidade)
 *   POST /api/cron/gerar-mensalidades   → garante as mensalidades do mês (idempotente)
 */
function autorizado(req: NextRequest): boolean {
  const esperado = process.env.CRON_SECRET;
  if (!esperado || esperado.length < 16) return false;
  const a = Buffer.from((req.headers.get('authorization') || '').replace(/^Bearer /, ''));
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function limparComprovantes() {
  const db = criarClienteServico();
  const { data, error } = await db.from('comprovantes').select('id, storage_path').not('remover_em', 'is', null).limit(200);
  if (error) throw error;
  if (!data.length) return { removidos: 0 };
  const { error: es } = await db.storage.from('comprovantes').remove(data.map((c) => c.storage_path));
  if (es) throw es;
  const { error: ed } = await db.from('comprovantes').delete().in('id', data.map((c) => c.id));
  if (ed) throw ed;
  metricas.comprovantesRemovidos.inc(data.length);
  return { removidos: data.length };
}

async function gerarMensalidades() {
  const { data, error } = await criarClienteServico().rpc('gerar_mensalidades', {});
  if (error) throw error;
  return { criadas: data ?? 0 };
}

const TAREFAS: Record<string, () => Promise<Record<string, number>>> = {
  'limpar-comprovantes': limparComprovantes,
  'gerar-mensalidades': gerarMensalidades,
};

export async function POST(req: NextRequest, ctx: { params: Promise<{ tarefa: string }> }) {
  if (!autorizado(req)) return new NextResponse('Não autorizado', { status: 401 });
  const { tarefa } = await ctx.params;
  const executar = TAREFAS[tarefa];
  if (!executar) return new NextResponse('Tarefa desconhecida', { status: 404 });
  try {
    const resultado = await executar();
    metricas.rotinas.inc({ tarefa, resultado: 'ok' });
    console.info(`[cron] ${tarefa}`, resultado);
    return NextResponse.json({ ok: true, tarefa, ...resultado });
  } catch (e) {
    metricas.rotinas.inc({ tarefa, resultado: 'erro' });
    console.error(`[cron] ${tarefa} falhou:`, (e as Error).message);
    return NextResponse.json({ ok: false, tarefa }, { status: 500 });
  }
}
