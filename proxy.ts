import type { NextRequest } from 'next/server';
import { atualizarSessao } from '@/lib/supabase/proxy';

export async function proxy(req: NextRequest) {
  return atualizarSessao(req);
}

export const config = {
  // Ignora arquivos estáticos, imagens e as rotas técnicas (health/metrics/cron)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|img/|api/health|api/metrics|api/cron|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)'],
};
