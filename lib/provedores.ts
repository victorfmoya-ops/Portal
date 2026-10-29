import 'server-only';
import { envPublico, urlSupabaseServidor } from '@/lib/env';

/**
 * O login com Google está ligado no Supabase? (GET /auth/v1/settings → external.google)
 * Sem isso, o botão levaria a um erro técnico ("provider is not enabled"). Consulta guardada por 60 s;
 * se o Supabase não responder, considera desligado.
 */
export async function googleAtivo(): Promise<boolean> {
  try {
    const r = await fetch(`${urlSupabaseServidor()}/auth/v1/settings`, {
      headers: { apikey: envPublico.NEXT_PUBLIC_SUPABASE_ANON_KEY },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) return false;
    const d = (await r.json()) as { external?: { google?: boolean } };
    return d.external?.google === true;
  } catch {
    return false;
  }
}
