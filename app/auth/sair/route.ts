import { NextResponse } from 'next/server';
import { envPublico } from '@/lib/env';
import { criarClienteServidor } from '@/lib/supabase/servidor';

/** Sair (POST, para não ser disparado por um link/imagem de outro site). */
export async function POST() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  return NextResponse.redirect(`${envPublico.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/`, { status: 303 });
}
