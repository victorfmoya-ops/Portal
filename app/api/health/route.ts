import { NextResponse } from 'next/server';
import { envPublico } from '@/lib/env';
import { metricas } from '@/lib/metricas';
import { criarClientePublico } from '@/lib/supabase/servico';

export const dynamic = 'force-dynamic';

/** Saúde do portal: usado pelo Docker, pela esteira (smoke test) e pelo monitoramento. */
export async function GET() {
  let banco = false;
  try {
    const { error } = await criarClientePublico().from('organizacoes').select('id').eq('slug', envPublico.NEXT_PUBLIC_ORG_SLUG).limit(1);
    banco = !error;
  } catch {
    banco = false;
  }
  metricas.bancoOk.set(banco ? 1 : 0);
  return NextResponse.json(
    { status: banco ? 'ok' : 'degradado', banco: banco ? 'up' : 'down' },
    { status: banco ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
