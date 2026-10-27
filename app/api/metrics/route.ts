import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { metricas } from '@/lib/metricas';

export const dynamic = 'force-dynamic';

function autorizado(req: NextRequest): boolean {
  const esperado = process.env.METRICS_TOKEN;
  if (!esperado) return false;
  const recebido = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Métricas Prometheus (protegidas por token; o nginx/proxy não expõe esta rota). */
export async function GET(req: NextRequest) {
  if (!autorizado(req)) return new NextResponse('Não autorizado', { status: 401 });
  return new NextResponse(await metricas.registro.metrics(), {
    headers: { 'Content-Type': metricas.registro.contentType, 'Cache-Control': 'no-store' },
  });
}
