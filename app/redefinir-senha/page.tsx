import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { obterSessao } from '@/lib/sessao';
import { salvarNovaSenha } from '../entrar/acoes';

export const metadata = { title: 'Nova senha — Família Àṣẹ Omos Odé' };

export default async function RedefinirSenha() {
  if (!(await obterSessao())) redirect('/esqueci-senha');
  return (
    <AppShell titulo="Nova senha">
      <div className="card">
        <h3>Criar nova senha</h3>
        <form action={salvarNovaSenha}>
          <label className="f">
            <span>Nova senha (8+ caracteres, com letras e números)</span>
            <input name="senha" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
          </label>
          <label className="f">
            <span>Repita a senha</span>
            <input name="confirmar" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
          </label>
          <BotaoEnviar>Salvar senha</BotaoEnviar>
        </form>
      </div>
    </AppShell>
  );
}
