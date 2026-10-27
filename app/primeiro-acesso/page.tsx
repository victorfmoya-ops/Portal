import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { criarPrimeiroAcesso } from '../entrar/acoes';

export const metadata = { title: 'Primeiro acesso — Família Àṣẹ Omos Odé' };

export default function PrimeiroAcesso() {
  return (
    <AppShell titulo="Primeiro acesso" voltar="/entrar">
      <div className="card">
        <h3>Criar minha senha</h3>
        <p className="muted">
          Use o <b>mesmo e-mail</b> que você passou para a administração da casa. Depois, confirme pelo link que chega no seu e-mail.
        </p>
        <form action={criarPrimeiroAcesso}>
          <label className="f">
            <span>E-mail</span>
            <input name="email" type="email" autoComplete="email" required maxLength={254} />
          </label>
          <label className="f">
            <span>Senha (8+ caracteres, com letras e números)</span>
            <input name="senha" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
          </label>
          <label className="f">
            <span>Repita a senha</span>
            <input name="confirmar" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
          </label>
          <BotaoEnviar>Criar senha</BotaoEnviar>
        </form>
        <div className="note">Prefere não criar senha? Volte e use “Entrar com Google”.</div>
      </div>
      <Link className="btn ghost" href="/entrar">
        ‹ Voltar
      </Link>
    </AppShell>
  );
}
