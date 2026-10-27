import 'server-only';
import { redirect } from 'next/navigation';

/** Volta para a página com uma mensagem (mostrada como aviso no rodapé). */
export function voltar(caminho: string, msg: { ok?: string; erro?: string }): never {
  const url = new URL(caminho, 'http://x');
  if (msg.ok) url.searchParams.set('ok', msg.ok);
  if (msg.erro) url.searchParams.set('erro', msg.erro);
  url.searchParams.set('t', Date.now().toString(36));
  redirect(url.pathname + url.search);
}

/** Traduz erros do banco/Supabase para mensagens que o usuário entende. */
export function mensagemDeErro(e: { message?: string; code?: string } | null | undefined): string {
  if (!e) return 'Algo deu errado. Tente de novo.';
  if (e.code === '42501') return e.message && !/row-level security/i.test(e.message) ? e.message : 'Você não tem permissão para isso.';
  if (e.code === '23505') return 'Já existe um registro igual.';
  if (e.code === '23514') return 'Algum campo está fora do permitido (tamanho ou formato).';
  if (e.code === '22023') return e.message || 'Dados inválidos.';
  if (e.code === '22P02') return 'Dados inválidos.';
  if (e.code === 'P0001') return e.message || 'Operação não permitida.';
  return 'Algo deu errado. Tente de novo.';
}
