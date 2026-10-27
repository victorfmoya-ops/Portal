import { z } from 'zod';

/**
 * Variáveis de ambiente validadas.
 * NEXT_PUBLIC_* vão para o navegador (são públicas por natureza).
 * SUPABASE_SERVICE_ROLE_KEY e CRON_SECRET existem só no servidor.
 */
const publico = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.url().default('http://127.0.0.1:3000'),
  NEXT_PUBLIC_ORG_SLUG: z.string().regex(/^[a-z0-9-]{2,40}$/).default('omos-ode'),
});

export const envPublico = publico.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_ORG_SLUG: process.env.NEXT_PUBLIC_ORG_SLUG,
});

/** URL que o SERVIDOR usa para falar com o Supabase (dentro do Docker é diferente da do navegador). */
export function urlSupabaseServidor(): string {
  return process.env.SUPABASE_INTERNAL_URL || envPublico.NEXT_PUBLIC_SUPABASE_URL;
}

/**
 * Links do Supabase que vão para o NAVEGADOR (login com Google, arquivo assinado) saem com a URL
 * que o servidor usou; dentro do Docker ela é interna (host.docker.internal) — troca pela pública.
 */
export function paraUrlPublica(url: string): string {
  const interna = urlSupabaseServidor();
  return interna !== envPublico.NEXT_PUBLIC_SUPABASE_URL && url.startsWith(interna)
    ? envPublico.NEXT_PUBLIC_SUPABASE_URL + url.slice(interna.length)
    : url;
}

/** Nome fixo do cookie de sessão: igual no navegador e no servidor, mesmo com URLs diferentes. */
export const COOKIE_SESSAO = 'sb-portal-ase-auth';

/**
 * Cookie de sessão: o navegador nunca usa o Supabase direto (tudo passa pelo servidor),
 * então o cookie pode ser HttpOnly (scripts da página não leem a sessão) e, em HTTPS, Secure.
 */
export const OPCOES_COOKIE_SESSAO = {
  name: COOKIE_SESSAO,
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: envPublico.NEXT_PUBLIC_SITE_URL.startsWith('https://'),
};
