import { NextResponse } from 'next/server';
import { z } from 'zod';
import { exigirAdmin } from '@/lib/sessao';

/** Abre o comprovante (bucket privado) com um link temporário de 2 minutos. Só admin. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { supabase } = await exigirAdmin();
  const id = z.uuid().safeParse((await ctx.params).id);
  if (!id.success) return new NextResponse('Comprovante inválido', { status: 400 });
  const { data: c } = await supabase.from('comprovantes').select('storage_path').eq('id', id.data).maybeSingle();
  if (!c) return new NextResponse('Comprovante não encontrado (pode já ter sido apagado após a análise).', { status: 404 });
  const { data, error } = await supabase.storage.from('comprovantes').createSignedUrl(c.storage_path, 120);
  if (error || !data) return new NextResponse('Não foi possível abrir o arquivo.', { status: 500 });
  // o link assinado aponta para o Supabase; no Docker o servidor usa a URL interna, então trocamos pela pública
  const publica = data.signedUrl.replace(process.env.SUPABASE_INTERNAL_URL || '\u0000', process.env.NEXT_PUBLIC_SUPABASE_URL || '');
  return NextResponse.redirect(publica, { headers: { 'Cache-Control': 'no-store' } });
}
