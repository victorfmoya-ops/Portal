import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { criarClienteServidor } from '@/lib/supabase/servidor';
import { TERMO_VERSAO } from '@/lib/consentimento';

export type Membro = {
  id: string;
  org_id: string;
  nome: string;
  email: string;
  papel: 'filho' | 'admin';
  cargo: string | null;
  equipe_id: string | null;
  grupo_id: string | null;
  status: 'ativo' | 'bloqueado';
};

const CAMPOS = 'id, org_id, nome, email, papel, cargo, equipe_id, grupo_id, status';

/**
 * Sessão atual: usuário autenticado (Google ou e-mail) + cadastro na casa.
 * Google/e-mail AUTENTICAM; quem AUTORIZA é a tabela "membros" (cadastro feito pelo admin).
 */
export const obterSessao = cache(async () => {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let { data: membro } = await supabase.from('membros').select(CAMPOS).eq('user_id', user.id).maybeSingle();
  if (!membro) {
    // 1º acesso (ou cadastrado depois do 1º login): tenta ligar a conta ao cadastro pelo e-mail confirmado
    await supabase.rpc('vincular_meu_cadastro');
    ({ data: membro } = await supabase.from('membros').select(CAMPOS).eq('user_id', user.id).maybeSingle());
  }
  return { supabase, user, membro: (membro as Membro | null) ?? null };
});

/** Exige login + cadastro ativo + termo aceito. */
export async function exigirMembro() {
  const s = await obterSessao();
  if (!s) redirect('/entrar');
  if (!s.membro || s.membro.status !== 'ativo') redirect('/acesso-negado');
  const { data: aceite } = await s.supabase
    .from('consentimentos')
    .select('id')
    .eq('membro_id', s.membro.id)
    .eq('versao', TERMO_VERSAO)
    .maybeSingle();
  if (!aceite) redirect('/consentimento');
  return { ...s, membro: s.membro };
}

export async function exigirFilho() {
  const s = await exigirMembro();
  if (s.membro.papel !== 'filho') redirect('/app/admin');
  return s;
}

export async function exigirAdmin() {
  const s = await exigirMembro();
  if (s.membro.papel !== 'admin') redirect('/app/filho');
  return s;
}
