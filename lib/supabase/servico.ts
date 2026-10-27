import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { envPublico, urlSupabaseServidor } from '@/lib/env';
import type { Database } from '@/lib/database.types';

/**
 * Cliente com a chave de SERVIÇO (ignora a RLS). Uso restrito às rotinas
 * automáticas (/api/cron/*) e a leituras públicas sem sessão. Nunca no navegador.
 */
export function criarClienteServico() {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
  return createClient<Database>(urlSupabaseServidor(), chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cliente anônimo do servidor (visitante): só enxerga o que as policies públicas liberam. */
export function criarClientePublico() {
  return createClient<Database>(urlSupabaseServidor(), envPublico.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
