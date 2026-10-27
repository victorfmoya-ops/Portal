import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_SESSAO, envPublico, urlSupabaseServidor } from '@/lib/env';

const PROTEGIDAS = ['/app', '/consentimento'];

/** Renova a sessão a cada requisição e manda para /entrar quem não está logado. */
export async function atualizarSessao(req: NextRequest) {
  let resposta = NextResponse.next({ request: req });
  const supabase = createServerClient(urlSupabaseServidor(), envPublico.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookieOptions: { name: COOKIE_SESSAO },
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => req.cookies.set(name, value));
        resposta = NextResponse.next({ request: req });
        lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = req.nextUrl.pathname;
  if (!user && PROTEGIDAS.some((p) => caminho === p || caminho.startsWith(p + '/'))) {
    const url = req.nextUrl.clone();
    url.pathname = '/entrar';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return resposta;
}
