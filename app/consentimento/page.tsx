import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { TERMO_TEXTO, TERMO_VERSAO } from '@/lib/consentimento';
import { mensagemDeErro, voltar } from '@/lib/mensagens';
import { obterSessao } from '@/lib/sessao';

export const metadata = { title: 'Termo de uso dos dados — Família Àṣẹ Omos Odé' };

async function aceitar() {
  'use server';
  const s = await obterSessao();
  if (!s?.membro) redirect('/acesso-negado');
  const { error } = await s.supabase.rpc('registrar_consentimento', { p_versao: TERMO_VERSAO });
  if (error) voltar('/consentimento', { erro: mensagemDeErro(error) });
  redirect('/app');
}

export default async function Consentimento() {
  const s = await obterSessao();
  if (!s) redirect('/entrar');
  if (!s.membro) redirect('/acesso-negado');
  return (
    <AppShell titulo="Antes de começar">
      <div className="card">
        <h3>📄 Termo de uso dos seus dados ({TERMO_VERSAO})</h3>
        {TERMO_TEXTO.map((p, i) => (
          <p key={i} className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>
            {p}
          </p>
        ))}
        <form action={aceitar}>
          <BotaoEnviar className="btn green">Li e aceito</BotaoEnviar>
        </form>
      </div>
      <form action="/auth/sair" method="post">
        <button className="btn ghost" type="submit">
          Não aceito (sair)
        </button>
      </form>
    </AppShell>
  );
}
