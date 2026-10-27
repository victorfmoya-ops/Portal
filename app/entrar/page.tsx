import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { obterSessao } from '@/lib/sessao';
import { entrarComGoogle, entrarComSenha } from './acoes';

export const metadata = { title: 'Entrar — Família Àṣẹ Omos Odé' };

export default async function Entrar() {
  if (await obterSessao()) redirect('/app');
  return (
    <AppShell titulo="Entrar">
      <div className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo.png" alt="Brasão" />
        <h2>Área restrita</h2>
        <p>Filhos e administradores da casa</p>
      </div>
      <div className="card">
        <h3>Entrar com Google</h3>
        <p className="muted">Só entra quem a administração da casa cadastrou. Use o mesmo e-mail informado ao administrador.</p>
        <form action={entrarComGoogle}>
          <BotaoEnviar className="btn google">
            <span aria-hidden>🟦</span> Entrar com Google
          </BotaoEnviar>
        </form>
        <div className="divisor">ou com e-mail e senha</div>
        <form action={entrarComSenha}>
          <label className="f">
            <span>E-mail</span>
            <input name="email" type="email" autoComplete="email" required maxLength={254} />
          </label>
          <label className="f">
            <span>Senha</span>
            <input name="senha" type="password" autoComplete="current-password" required maxLength={72} />
          </label>
          <BotaoEnviar>Entrar</BotaoEnviar>
        </form>
        <div className="actions" style={{ justifyContent: 'space-between' }}>
          <Link href="/primeiro-acesso">Primeiro acesso (criar senha)</Link>
          <Link href="/esqueci-senha">Esqueci a senha</Link>
        </div>
      </div>
      <Link className="btn ghost" href="/">
        ‹ Voltar ao site
      </Link>
    </AppShell>
  );
}
