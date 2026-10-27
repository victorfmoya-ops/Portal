import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { envPublico } from '@/lib/env';
import { criarClienteServidor } from '@/lib/supabase/servidor';

const TIPOS: EmailOtpType[] = ['email', 'signup', 'recovery', 'email_change'];

/** Link do e-mail (confirmação de cadastro ou nova senha). */
export async function GET(req: NextRequest) {
  const base = envPublico.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const tokenHash = req.nextUrl.searchParams.get('token_hash');
  const tipo = req.nextUrl.searchParams.get('type') as EmailOtpType | null;
  const proximo = req.nextUrl.searchParams.get('next') || '/app';
  // só caminhos internos (evita redirecionamento para sites de fora)
  const destino = /^\/(?!\/)[\w\-/]*$/.test(proximo) ? proximo : '/app';

  if (!tokenHash || !tipo || !TIPOS.includes(tipo)) {
    return NextResponse.redirect(`${base}/entrar?erro=${encodeURIComponent('Link inválido.')}`);
  }
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
  if (error) {
    return NextResponse.redirect(`${base}/entrar?erro=${encodeURIComponent('Link expirado ou já usado. Peça outro.')}`);
  }
  await supabase.rpc('vincular_meu_cadastro');
  return NextResponse.redirect(`${base}${destino}`);
}
