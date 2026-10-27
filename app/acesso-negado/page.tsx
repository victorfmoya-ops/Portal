import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { obterSessao } from '@/lib/sessao';

export const metadata = { title: 'Acesso não liberado — Família Àṣẹ Omos Odé' };

export default async function AcessoNegado() {
  const s = await obterSessao();
  return (
    <AppShell titulo="Acesso não liberado">
      <div className="card">
        <h3>🔒 Seu acesso ainda não foi liberado</h3>
        <p className="muted">
          Você entrou como <b>{s?.user.email ?? 'visitante'}</b>, mas este e-mail não está cadastrado (ou está bloqueado) na casa.
        </p>
        <p className="muted">
          Peça para a administração cadastrar <b>este mesmo e-mail</b>. Depois é só entrar de novo — o acesso libera sozinho.
        </p>
        {s?.user && !s.user.email_confirmed_at ? <div className="note">Confirme seu e-mail pelo link que enviamos.</div> : null}
      </div>
      <form action="/auth/sair" method="post">
        <button className="btn sec" type="submit">
          Sair e entrar com outra conta
        </button>
      </form>
      <div style={{ height: 8 }} />
      <Link className="btn ghost" href="/">
        ‹ Voltar ao site
      </Link>
    </AppShell>
  );
}
