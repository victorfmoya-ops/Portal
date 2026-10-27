import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { OPCOES_COOKIE_SESSAO, envPublico, urlSupabaseServidor } from '@/lib/env';
import type { Database } from '@/lib/database.types';

/** Cliente Supabase com a sessão do usuário (respeita a RLS do banco). */
export async function criarClienteServidor() {
  const loja = await cookies();
  return createServerClient<Database>(urlSupabaseServidor(), envPublico.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookieOptions: OPCOES_COOKIE_SESSAO,
    cookies: {
      getAll: () => loja.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => loja.set(name, value, options));
        } catch {
          // Chamado de um Server Component: o proxy.ts renova a sessão.
        }
      },
    },
  });
}
