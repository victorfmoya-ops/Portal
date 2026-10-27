'use server';
import { revalidatePath } from 'next/cache';
import { MIMES_COMPROVANTE, TAMANHO_MAX_COMPROVANTE, validarArquivo } from '@/lib/arquivos';
import { hojeISO } from '@/lib/datas';
import { mensagemDeErro, voltar } from '@/lib/mensagens';
import { exigirFilho } from '@/lib/sessao';
import { criarClienteServico } from '@/lib/supabase/servico';
import { escolhaDiaSchema, validar } from '@/lib/validacao';
import { z } from 'zod';

/* O filho só tem estas DUAS ações de gravação (que cobrem as 3 permitidas):
   escolher o dia da limpeza e enviar comprovante (mensalidade ou festa). */

export async function escolherDia(fd: FormData) {
  const { supabase } = await exigirFilho();
  const v = validar(escolhaDiaSchema, fd);
  if (!v.ok) voltar('/app/filho/escala', { erro: v.erro });
  const { error } = await supabase.rpc('escolher_dia_limpeza', { p_rodada: v.dados.rodada, p_dia: v.dados.dia });
  if (error) voltar('/app/filho/escala', { erro: mensagemDeErro(error) });
  revalidatePath('/app/filho');
  voltar('/app/filho/escala', { ok: 'Dia escolhido ✔' });
}

const comprovanteSchema = z.object({
  tipo: z.enum(['mensalidade', 'festa']),
  referencia: z.uuid(),
  data_pagamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data do pagamento'),
});

export async function enviarComprovante(fd: FormData) {
  const { supabase, membro } = await exigirFilho();
  const destino = fd.get('tipo') === 'festa' ? '/app/filho/festas' : '/app/filho/mensalidade';
  const v = validar(comprovanteSchema, {
    tipo: fd.get('tipo'),
    referencia: fd.get('referencia'),
    data_pagamento: fd.get('data_pagamento'),
  });
  if (!v.ok) voltar(destino, { erro: v.erro });
  if (v.dados.data_pagamento > hojeISO()) voltar(destino, { erro: 'A data do pagamento não pode ser no futuro.' });

  const arquivo = fd.get('arquivo');
  if (!(arquivo instanceof File) || arquivo.size === 0) voltar(destino, { erro: 'Anexe o comprovante (PDF ou imagem).' });
  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const r = validarArquivo(arquivo.name, bytes, { tamanhoMax: TAMANHO_MAX_COMPROVANTE, permitidos: MIMES_COMPROVANTE });
  if (!r.ok) voltar(destino, { erro: r.erro });

  const caminho = `${membro.org_id}/${membro.id}/${v.dados.tipo}/${v.dados.referencia}/${crypto.randomUUID()}.${r.ext}`;
  const envio = await supabase.storage.from('comprovantes').upload(caminho, bytes, { contentType: r.mime, upsert: false });
  if (envio.error) {
    console.error('[comprovante] upload falhou:', envio.error.message);
    voltar(destino, { erro: 'Não consegui enviar o arquivo. Tente de novo.' });
  }

  const { error } = await supabase.rpc('enviar_comprovante', {
    p_tipo: v.dados.tipo,
    p_referencia: v.dados.referencia,
    p_storage_path: caminho,
    p_data_pagamento: v.dados.data_pagamento,
  });
  if (error) {
    // não deixa arquivo órfão: o filho não tem permissão de apagar, então a rotina de serviço remove
    await criarClienteServico().storage.from('comprovantes').remove([caminho]);
    voltar(destino, { erro: mensagemDeErro(error) });
  }
  revalidatePath('/app/filho');
  voltar(destino, { ok: 'Comprovante enviado — em análise' });
}
