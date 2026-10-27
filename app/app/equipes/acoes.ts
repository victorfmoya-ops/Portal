'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { brl } from '@/lib/datas';
import { mensagemDeErro, voltar } from '@/lib/mensagens';
import { exigirAdmin, exigirMembro } from '@/lib/sessao';
import { compraSchema, equipeSchema, tarefaSchema, validar } from '@/lib/validacao';

const id = z.uuid();
/** Só aceita voltar para as páginas de equipes e de organização das festas. */
const destino = (fd: FormData, padrao: string) => {
  const d = String(fd.get('voltar') || '');
  return /^\/app\/(equipes|organizacao)(\/[\w-]*)?(\?[\w=&-]*)?$/.test(d) ? d : padrao;
};
function exigirId(valor: FormDataEntryValue | null, volta: string): string {
  const r = id.safeParse(valor);
  if (!r.success) voltar(volta, { erro: 'Registro inválido.' });
  return r.data;
}
const pronto = (volta: string, ok: string): never => {
  revalidatePath('/app', 'layout');
  voltar(volta, { ok });
};

// ---------- Equipes (administração) ----------
export async function salvarEquipe(fd: FormData) {
  const { supabase, membro } = await exigirAdmin();
  const equipeId = fd.get('id') ? exigirId(fd.get('id'), '/app/equipes') : null;
  const volta = equipeId ? `/app/equipes/${equipeId}` : '/app/equipes';
  const v = validar(equipeSchema, fd);
  if (!v.ok) voltar(volta, { erro: v.erro });
  const { data, error } = equipeId
    ? await supabase.from('equipes').update(v.dados).eq('id', equipeId).select('id').single()
    : await supabase.from('equipes').insert({ ...v.dados, org_id: membro.org_id }).select('id').single();
  if (error) {
    const msg = error.code === '23505' ? 'Já existe uma equipe com esse nome (ou já há uma equipe de arrecadação).' : mensagemDeErro(error);
    voltar(volta, { erro: msg });
  }
  // o coordenador passa a fazer parte da equipe
  if (v.dados.coordenador_id) await supabase.from('membros').update({ equipe_id: data.id }).eq('id', v.dados.coordenador_id);
  pronto(`/app/equipes/${data.id}`, equipeId ? 'Equipe atualizada ✔' : 'Equipe criada ✔');
}

export async function excluirEquipe(fd: FormData) {
  const { supabase } = await exigirAdmin();
  const equipeId = exigirId(fd.get('id'), '/app/equipes');
  const { error } = await supabase.from('equipes').delete().eq('id', equipeId);
  if (error) voltar(`/app/equipes/${equipeId}`, { erro: mensagemDeErro(error) });
  pronto('/app/equipes', 'Equipe excluída');
}

export async function adicionarNaEquipe(fd: FormData) {
  const { supabase } = await exigirAdmin();
  const equipeId = exigirId(fd.get('equipe_id'), '/app/equipes');
  const volta = `/app/equipes/${equipeId}`;
  const ids = fd.getAll('membros').map((m) => exigirId(m, volta));
  if (!ids.length) voltar(volta, { erro: 'Escolha pelo menos uma pessoa.' });
  const { error } = await supabase.from('membros').update({ equipe_id: equipeId }).in('id', ids);
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  pronto(volta, `${ids.length} pessoa(s) na equipe ✔`);
}

export async function tirarDaEquipe(fd: FormData) {
  const { supabase } = await exigirAdmin();
  const equipeId = exigirId(fd.get('equipe_id'), '/app/equipes');
  const volta = `/app/equipes/${equipeId}`;
  const { error } = await supabase.from('membros').update({ equipe_id: null }).eq('id', exigirId(fd.get('membro_id'), volta)).eq('equipe_id', equipeId);
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  pronto(volta, 'Pessoa retirada da equipe');
}

// ---------- Tarefas da festa (coordenador da equipe; marcar: quem é da equipe) ----------
export async function salvarTarefa(fd: FormData) {
  const { supabase } = await exigirMembro();
  const volta = destino(fd, '/app/equipes');
  const v = validar(tarefaSchema, fd);
  if (!v.ok) voltar(volta, { erro: v.erro });
  const { error } = await supabase.rpc('salvar_tarefa', { p_festa: v.dados.festa_id, p_equipe: v.dados.equipe_id, p_descricao: v.dados.descricao });
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  pronto(volta, 'Tarefa criada ✔');
}

export async function alternarTarefa(fd: FormData) {
  const { supabase } = await exigirMembro();
  const volta = destino(fd, '/app/equipes');
  const { error } = await supabase.rpc('alternar_tarefa', { p_id: exigirId(fd.get('id'), volta) });
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  pronto(volta, 'Tarefa atualizada ✔');
}

export async function excluirTarefa(fd: FormData) {
  const { supabase } = await exigirMembro();
  const volta = destino(fd, '/app/equipes');
  const { error } = await supabase.rpc('excluir_tarefa', { p_id: exigirId(fd.get('id'), volta) });
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  pronto(volta, 'Tarefa excluída');
}

// ---------- Compras e rateio (coordenador da arrecadação) ----------
export async function salvarCompra(fd: FormData) {
  const { supabase } = await exigirMembro();
  const volta = destino(fd, '/app/equipes');
  const v = validar(compraSchema, fd);
  if (!v.ok) voltar(volta, { erro: v.erro });
  const { error } = await supabase.rpc('salvar_compra', {
    p_festa: v.dados.festa_id,
    p_item: v.dados.item,
    p_quantidade: v.dados.quantidade,
    p_valor_unitario: v.dados.valor_unitario,
  });
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  pronto(volta, 'Item adicionado ✔');
}

export async function alternarCompra(fd: FormData) {
  const { supabase } = await exigirMembro();
  const volta = destino(fd, '/app/equipes');
  const { error } = await supabase.rpc('alternar_compra', { p_id: exigirId(fd.get('id'), volta) });
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  pronto(volta, 'Item atualizado ✔');
}

export async function excluirCompra(fd: FormData) {
  const { supabase } = await exigirMembro();
  const volta = destino(fd, '/app/equipes');
  const { error } = await supabase.rpc('excluir_compra', { p_id: exigirId(fd.get('id'), volta) });
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  pronto(volta, 'Item excluído');
}

export async function aplicarRateio(fd: FormData) {
  const { supabase } = await exigirMembro();
  const volta = destino(fd, '/app/equipes');
  const festa = exigirId(fd.get('festa_id'), volta);
  const { data, error } = await supabase.rpc('aplicar_rateio', { p_festa: festa, p_arredondar: fd.get('arredondar') === 'on' });
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  const r = data as { valor: number; filhos: number; ja_pagas: number };
  const aviso = r.ja_pagas ? ` · ${r.ja_pagas} filho(s) já tinham pago o valor antigo` : '';
  pronto(volta, `Contribuição definida: ${brl(r.valor)} para cada um dos ${r.filhos} filhos ✔${aviso}`);
}
