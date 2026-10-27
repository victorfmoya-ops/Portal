'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { podeEnsinar } from '@/lib/aprendizado';
import { mensagemDeErro, voltar } from '@/lib/mensagens';
import { exigirMembro } from '@/lib/sessao';
import { licaoSchema, validar } from '@/lib/validacao';

const id = z.uuid();

/** Publica ou edita uma lição (pai/mãe de santo, ogã, ebomi ou administrador). */
export async function salvarLicao(fd: FormData) {
  const { supabase, membro } = await exigirMembro();
  let licaoId: string | null = null;
  if (fd.get('id')) {
    const r = id.safeParse(fd.get('id'));
    if (!r.success) voltar('/app/aprender', { erro: 'Registro inválido.' });
    licaoId = r.data;
  }
  const volta = licaoId ? `/app/aprender/${licaoId}` : '/app/aprender';
  if (!podeEnsinar(membro)) voltar(volta, { erro: 'Somente pais/mães de santo, ogãs, ebomis e a administração publicam.' });
  const v = validar(licaoSchema, fd);
  if (!v.ok) voltar(volta, { erro: v.erro });

  const { data, error } = await supabase.rpc('salvar_licao', {
    p_id: licaoId as string, // null = lição nova (o tipo gerado não marca o parâmetro como opcional)
    p_categoria: v.dados.categoria,
    p_titulo: v.dados.titulo,
    p_conteudo: v.dados.conteudo,
    p_midia_url: v.dados.midia_url ?? undefined,
  });
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  revalidatePath('/app/aprender', 'layout');
  voltar(`/app/aprender/${data}`, { ok: licaoId ? 'Lição atualizada ✔' : 'Lição publicada ✔' });
}

export async function excluirLicao(fd: FormData) {
  const { supabase } = await exigirMembro();
  const r = id.safeParse(fd.get('id'));
  if (!r.success) voltar('/app/aprender', { erro: 'Registro inválido.' });
  const { error } = await supabase.rpc('excluir_licao', { p_id: r.data });
  if (error) voltar(`/app/aprender/${r.data}`, { erro: mensagemDeErro(error) });
  revalidatePath('/app/aprender', 'layout');
  voltar('/app/aprender', { ok: 'Lição excluída' });
}
