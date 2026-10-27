import { NextResponse, type NextRequest } from 'next/server';
import { envPublico } from '@/lib/env';
import { criarClienteServidor } from '@/lib/supabase/servidor';

/** Retorno do login com Google: troca o código pela sessão e liga a conta ao cadastro. */
export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get('code');
  const base = envPublico.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (!codigo) return NextResponse.redirect(`${base}/entrar?erro=${encodeURIComponent('Login cancelado.')}`);
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.exchangeCodeForSession(codigo);
  if (error) return NextResponse.redirect(`${base}/entrar?erro=${encodeURIComponent('Não foi possível entrar. Tente de novo.')}`);
  await supabase.rpc('vincular_meu_cadastro');
  return NextResponse.redirect(`${base}/app`);
}
