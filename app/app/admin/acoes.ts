'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { MIMES_FOTO, TAMANHO_MAX_FOTO, validarArquivo } from '@/lib/arquivos';
import { mensagemDeErro, voltar } from '@/lib/mensagens';
import { exigirAdmin } from '@/lib/sessao';
import {
  caixaSchema,
  eventoSchema,
  festaSchema,
  fichaSchema,
  funcaoSchema,
  membroSchema,
  rejeicaoSchema,
  rodizioSchema,
  siteSchema,
  validar,
  videoSchema,
} from '@/lib/validacao';

const id = z.uuid();
/** Só aceita voltar para páginas do próprio painel. */
const destino = (fd: FormData, padrao: string) => {
  const d = String(fd.get('voltar') || '');
  return /^\/app\/admin(\/[\w\-/]*)?(\?[\w=&-]*)?$/.test(d) ? d : padrao;
};
function exigirId(valor: FormDataEntryValue | null, volta: string): string {
  const r = id.safeParse(valor);
  if (!r.success) voltar(volta, { erro: 'Registro inválido.' });
  return r.data;
}

/* ------------------------------ Rodízio ------------------------------ */
export async function alternarLocal(fd: FormData) {
  const { supabase, membro } = await exigirAdmin();
  const volta = destino(fd, '/app/admin');
  const rodada = exigirId(fd.get('rodada'), volta);
  const local = exigirId(fd.get('local'), volta);
  const concluido = fd.get('concluido') === '1';
  const { error } = await supabase
    .from('rodada_locais')
    .update(concluido ? { concluido_em: null, concluido_por: null } : { concluido_em: new Date().toISOString(), concluido_por: membro.id })
    .eq('rodada_id', rodada)
    .eq('local_id', local);
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  revalidatePath('/app/admin', 'layout');
  voltar(volta, { ok: concluido ? 'Local desmarcado' : 'Local concluído ✔' });
}

export async function gerarRodizio(fd: FormData) {
  const { supabase } = await exigirAdmin();
  const v = validar(rodizioSchema, fd);
  if (!v.ok) voltar('/app/admin/rodizio', { erro: v.erro });
  const { data, error } = await supabase.rpc('gerar_rodizio', { p_inicio: v.dados.inicio, p_quantidade: v.dados.quantidade, p_intervalo: 2 });
  if (error) voltar('/app/admin/rodizio', { erro: mensagemDeErro(error) });
  voltar('/app/admin/rodizio', { ok: `${data ?? 0} rodada(s) criada(s) ✔` });
}

/** Admin define (ou limpa) o dia de um filho na rodada — pode mesmo depois do prazo. */
export async function definirDiaFilho(fd: FormData) {
  const { supabase, membro } = await exigirAdmin();
  const rodada = exigirId(fd.get('rodada'), '/app/admin/rodizio');
  const volta = `/app/admin/rodizio/${rodada}`;
  const filho = exigirId(fd.get('membro'), volta);
  const dia = String(fd.get('dia') || '');
  if (dia === '') {
    const { error } = await supabase.from('escolhas_limpeza').delete().eq('rodada_id', rodada).eq('membro_id', filho);
    if (error) voltar(volta, { erro: mensagemDeErro(error) });
    voltar(volta, { ok: 'Dia removido' });
  }
  const { data: r } = await supabase.from('rodadas').select('inicio, fim').eq('id', rodada).single();
  if (!r || !/^\d{4}-\d{2}-\d{2}$/.test(dia) || dia < r.inicio || dia > r.fim) voltar(volta, { erro: 'Dia fora da semana da rodada.' });
  const { error } = await supabase
    .from('escolhas_limpeza')
    .upsert({ org_id: membro.org_id, rodada_id: rodada, membro_id: filho, dia }, { onConflict: 'rodada_id,membro_id' });
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  voltar(volta, { ok: 'Dia definido ✔' });
}

export async function alterarPrazo(fd: FormData) {
  const { supabase } = await exigirAdmin();
  const rodada = exigirId(fd.get('rodada'), '/app/admin/rodizio');
  const volta = `/app/admin/rodizio/${rodada}`;
  const prazo = String(fd.get('prazo') || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(prazo)) voltar(volta, { erro: 'Data inválida' });
  const { error } = await supabase.from('rodadas').update({ prazo_escolha: prazo }).eq('id', rodada);
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  voltar(volta, { ok: 'Prazo alterado ✔' });
}

/* ------------------------------ Pagamentos ------------------------------ */
export async function decidirPagamento(fd: FormData) {
  const { supabase } = await exigirAdmin();
  const volta = destino(fd, '/app/admin/financeiro');
  const tipo = z.enum(['mensalidade', 'festa']).safeParse(fd.get('tipo'));
  const decisao = z.enum(['confirmado', 'rejeitado', 'aberta']).safeParse(fd.get('decisao'));
  if (!tipo.success || !decisao.success) voltar(volta, { erro: 'Operação inválida.' });
  const ref = exigirId(fd.get('id'), volta);
  let motivo: string | undefined;
  if (decisao.data === 'rejeitado') {
    const v = validar(rejeicaoSchema, { motivo: fd.get('motivo') ?? '' });
    if (!v.ok) voltar(volta, { erro: v.erro });
    motivo = v.dados.motivo;
  }
  const { error } = await supabase.rpc('decidir_pagamento', { p_tipo: tipo.data, p_id: ref, p_decisao: decisao.data, p_motivo: motivo });
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  revalidatePath('/app/admin', 'layout');
  const msg = { confirmado: 'Pagamento confirmado ✔', rejeitado: 'Comprovante recusado', aberta: 'Desfeito' } as const;
  voltar(volta, { ok: msg[decisao.data] });
}

export async function gerarMensalidades(fd: FormData) {
  const { supabase } = await exigirAdmin();
  const comp = String(fd.get('competencia') || '');
  if (!/^\d{4}-\d{2}$/.test(comp)) voltar('/app/admin/financeiro', { erro: 'Mês inválido' });
  const { data, error } = await supabase.rpc('gerar_mensalidades', { p_competencia: `${comp}-01` });
  if (error) voltar(`/app/admin/financeiro?mes=${comp}`, { erro: mensagemDeErro(error) });
  voltar(`/app/admin/financeiro?mes=${comp}`, { ok: `${data ?? 0} mensalidade(s) lançada(s)` });
}

/* ------------------------------ Caixa ------------------------------ */
export async function salvarLancamento(fd: FormData) {
  const { supabase, membro } = await exigirAdmin();
  const volta = destino(fd, '/app/admin/financeiro');
  const v = validar(caixaSchema, fd);
  if (!v.ok) voltar(volta, { erro: v.erro });
  const { error } = await supabase.from('caixa_lancamentos').insert({ ...v.dados, org_id: membro.org_id, criado_por: membro.id });
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  voltar(volta, { ok: 'Lançamento salvo ✔' });
}

export async function excluirLancamento(fd: FormData) {
  const { supabase } = await exigirAdmin();
  const volta = destino(fd, '/app/admin/financeiro');
  const { error } = await supabase.from('caixa_lancamentos').delete().eq('id', exigirId(fd.get('id'), volta));
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  voltar(volta, { ok: 'Lançamento excluído' });
}

/* ------------------------------ Filhos (cadastro) ------------------------------ */
export async function salvarMembro(fd: FormData) {
  const { supabase, membro: eu } = await exigirAdmin();
  const membroId = fd.get('id') ? exigirId(fd.get('id'), '/app/admin/filhos') : null;
  const volta = membroId ? `/app/admin/filhos/${membroId}` : '/app/admin/filhos/novo';
  const m = validar(membroSchema, fd);
  if (!m.ok) voltar(volta, { erro: m.erro });
  const f = validar(fichaSchema, fd);
  if (!f.ok) voltar(volta, { erro: f.erro });
  if (membroId === eu.id && (m.dados.papel !== 'admin' || m.dados.status !== 'ativo')) {
    voltar(volta, { erro: 'Você não pode tirar o seu próprio acesso de administrador.' });
  }

  let alvo = membroId;
  if (membroId) {
    const { error } = await supabase.from('membros').update(m.dados).eq('id', membroId);
    if (error) voltar(volta, { erro: mensagemDeErro(error) });
  } else {
    const { data, error } = await supabase.from('membros').insert({ ...m.dados, org_id: eu.org_id }).select('id').single();
    if (error) voltar(volta, { erro: error.code === '23505' ? 'Já existe um cadastro com este e-mail.' : mensagemDeErro(error) });
    alvo = data.id;
  }
  const { error: ef } = await supabase.from('fichas').upsert({ ...f.dados, membro_id: alvo!, org_id: eu.org_id }, { onConflict: 'membro_id' });
  if (ef) voltar(volta, { erro: mensagemDeErro(ef) });
  revalidatePath('/app/admin', 'layout');
  voltar('/app/admin/filhos', { ok: 'Cadastro salvo ✔' });
}

export async function criarGrupo() {
  const { supabase, membro } = await exigirAdmin();
  const { data: ultimo } = await supabase.from('grupos').select('numero').order('numero', { ascending: false }).limit(1).maybeSingle();
  const numero = (ultimo?.numero ?? 0) + 1;
  const { error } = await supabase.from('grupos').insert({ org_id: membro.org_id, numero, nome: `Grupo ${numero}` });
  if (error) voltar('/app/admin/grupos', { erro: mensagemDeErro(error) });
  voltar('/app/admin/grupos', { ok: `Grupo ${numero} criado ✔` });
}

/* ------------------------------ Calendários ------------------------------ */
export async function salvarToque(fd: FormData) {
  const { supabase, membro } = await exigirAdmin();
  const volta = destino(fd, '/app/admin/calendario');
  const v = validar(eventoSchema, fd);
  if (!v.ok) voltar(volta, { erro: v.erro });
  const { error } = await supabase.from('eventos').insert({ ...v.dados, org_id: membro.org_id });
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  voltar(volta, { ok: 'Toque cadastrado ✔' });
}

export async function excluirToque(fd: FormData) {
  const { supabase } = await exigirAdmin();
  const volta = destino(fd, '/app/admin/calendario');
  const { error } = await supabase.from('eventos').delete().eq('id', exigirId(fd.get('id'), volta));
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  voltar(volta, { ok: 'Toque excluído' });
}

export async function salvarFuncao(fd: FormData) {
  const { supabase, membro } = await exigirAdmin();
  const volta = destino(fd, '/app/admin/calendario');
  const v = validar(funcaoSchema, {
    titulo: fd.get('titulo'),
    data: fd.get('data'),
    hora: fd.get('hora') ?? '',
    referencia: fd.get('referencia') ?? '',
    obrigatorio: fd.get('obrigatorio') ?? '',
  });
  if (!v.ok) voltar(volta, { erro: v.erro });
  const responsaveis = fd.getAll('responsaveis').map(String).filter((x) => id.safeParse(x).success).slice(0, 60);
  const { data, error } = await supabase.from('funcoes').insert({ ...v.dados, org_id: membro.org_id }).select('id').single();
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  if (responsaveis.length) {
    const { error: er } = await supabase
      .from('funcao_responsaveis')
      .insert(responsaveis.map((m) => ({ funcao_id: data.id, membro_id: m, org_id: membro.org_id })));
    if (er) voltar(volta, { erro: mensagemDeErro(er) });
  }
  voltar(volta, { ok: 'Função cadastrada ✔ (já aparece para os filhos)' });
}

export async function excluirFuncao(fd: FormData) {
  const { supabase } = await exigirAdmin();
  const volta = destino(fd, '/app/admin/calendario');
  const { error } = await supabase.from('funcoes').delete().eq('id', exigirId(fd.get('id'), volta));
  if (error) voltar(volta, { erro: mensagemDeErro(error) });
  voltar(volta, { ok: 'Função excluída' });
}

/* ------------------------------ Festas ------------------------------ */
export async function salvarFesta(fd: FormData) {
  const { supabase, membro } = await exigirAdmin();
  const v = validar(festaSchema, fd);
  if (!v.ok) voltar('/app/admin/festas', { erro: v.erro });
  const { error } = await supabase.from('festas').insert({ ...v.dados, org_id: membro.org_id });
  if (error) voltar('/app/admin/festas', { erro: mensagemDeErro(error) });
  voltar('/app/admin/festas', { ok: 'Festa criada ✔ (contribuições lançadas para todos os filhos)' });
}

export async function excluirFesta(fd: FormData) {
  const { supabase } = await exigirAdmin();
  const { error } = await supabase.from('festas').delete().eq('id', exigirId(fd.get('id'), '/app/admin/festas'));
  if (error) voltar('/app/admin/festas', { erro: mensagemDeErro(error) });
  voltar('/app/admin/festas', { ok: 'Festa excluída' });
}

/* ------------------------------ Site e galeria ------------------------------ */
export async function salvarSite(fd: FormData) {
  const { supabase, membro } = await exigirAdmin();
  const v = validar(siteSchema, fd);
  if (!v.ok) voltar('/app/admin/site', { erro: v.erro });
  const { error } = await supabase.from('site_config').upsert({ ...v.dados, org_id: membro.org_id }, { onConflict: 'org_id' });
  if (error) voltar('/app/admin/site', { erro: mensagemDeErro(error) });
  revalidatePath('/');
  voltar('/app/admin/site', { ok: 'Aparência salva ✔ (já está no site)' });
}

export async function enviarFoto(fd: FormData) {
  const { supabase, membro } = await exigirAdmin();
  const arquivo = fd.get('arquivo');
  if (!(arquivo instanceof File) || arquivo.size === 0) voltar('/app/admin/galeria', { erro: 'Escolha uma imagem.' });
  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const r = validarArquivo(arquivo.name, bytes, { tamanhoMax: TAMANHO_MAX_FOTO, permitidos: MIMES_FOTO });
  if (!r.ok) voltar('/app/admin/galeria', { erro: r.ok === false ? r.erro.replace('PDF ou imagem', 'JPG, PNG ou WEBP') : '' });
  const titulo = String(fd.get('titulo') || '').trim().slice(0, 120) || null;
  const caminho = `${membro.org_id}/${crypto.randomUUID()}.${r.ext}`;
  const envio = await supabase.storage.from('galeria').upload(caminho, bytes, { contentType: r.mime });
  if (envio.error) voltar('/app/admin/galeria', { erro: 'Não consegui enviar a foto.' });
  const { error } = await supabase.from('midia').insert({ org_id: membro.org_id, tipo: 'foto', titulo, storage_path: caminho });
  if (error) {
    await supabase.storage.from('galeria').remove([caminho]);
    voltar('/app/admin/galeria', { erro: mensagemDeErro(error) });
  }
  revalidatePath('/');
  voltar('/app/admin/galeria', { ok: 'Foto publicada ✔' });
}

export async function adicionarVideo(fd: FormData) {
  const { supabase, membro } = await exigirAdmin();
  const v = validar(videoSchema, fd);
  if (!v.ok) voltar('/app/admin/galeria', { erro: v.erro });
  const { error } = await supabase.from('midia').insert({ org_id: membro.org_id, tipo: 'video', titulo: v.dados.titulo, url: v.dados.url });
  if (error) voltar('/app/admin/galeria', { erro: mensagemDeErro(error) });
  revalidatePath('/');
  voltar('/app/admin/galeria', { ok: 'Vídeo publicado ✔' });
}

export async function excluirMidia(fd: FormData) {
  const { supabase } = await exigirAdmin();
  const midiaId = exigirId(fd.get('id'), '/app/admin/galeria');
  const { data } = await supabase.from('midia').select('storage_path').eq('id', midiaId).single();
  const { error } = await supabase.from('midia').delete().eq('id', midiaId);
  if (error) voltar('/app/admin/galeria', { erro: mensagemDeErro(error) });
  if (data?.storage_path) await supabase.storage.from('galeria').remove([data.storage_path]);
  revalidatePath('/');
  voltar('/app/admin/galeria', { ok: 'Excluído' });
}

/* ------------------------------ Áreas restritas ------------------------------ */
export async function criarArea(fd: FormData) {
  const { supabase, membro } = await exigirAdmin();
  const nome = String(fd.get('nome') || '').trim();
  if (nome.length < 2 || nome.length > 120) voltar('/app/admin/restritas', { erro: 'Informe o nome da área.' });
  const { error } = await supabase.from('areas_restritas').insert({ org_id: membro.org_id, nome });
  if (error) voltar('/app/admin/restritas', { erro: mensagemDeErro(error) });
  voltar('/app/admin/restritas', { ok: 'Área criada ✔' });
}

export async function adicionarPessoaArea(fd: FormData) {
  const { supabase, membro } = await exigirAdmin();
  const area = exigirId(fd.get('area'), '/app/admin/restritas');
  const pessoa = exigirId(fd.get('membro'), '/app/admin/restritas');
  const papel = z.enum(['responsavel', 'apoio', 'nao_incluir']).safeParse(fd.get('papel'));
  if (!papel.success) voltar('/app/admin/restritas', { erro: 'Escolha a função.' });
  const { error } = await supabase
    .from('area_restrita_pessoas')
    .upsert({ area_id: area, membro_id: pessoa, org_id: membro.org_id, papel: papel.data }, { onConflict: 'area_id,membro_id' });
  if (error) voltar('/app/admin/restritas', { erro: mensagemDeErro(error) });
  voltar('/app/admin/restritas', { ok: 'Atualizado ✔' });
}

export async function removerPessoaArea(fd: FormData) {
  const { supabase } = await exigirAdmin();
  const area = exigirId(fd.get('area'), '/app/admin/restritas');
  const pessoa = exigirId(fd.get('membro'), '/app/admin/restritas');
  const { error } = await supabase.from('area_restrita_pessoas').delete().eq('area_id', area).eq('membro_id', pessoa);
  if (error) voltar('/app/admin/restritas', { erro: mensagemDeErro(error) });
  voltar('/app/admin/restritas', { ok: 'Removido' });
}
