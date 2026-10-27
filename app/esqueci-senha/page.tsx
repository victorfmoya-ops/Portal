import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { pedirNovaSenha } from '../entrar/acoes';

export const metadata = { title: 'Esqueci a senha — Família Àṣẹ Omos Odé' };

export default function EsqueciSenha() {
  return (
    <AppShell titulo="Esqueci a senha" voltar="/entrar">
      <div className="card">
        <h3>Receber link para nova senha</h3>
        <form action={pedirNovaSenha}>
          <label className="f">
            <span>E-mail</span>
            <input name="email" type="email" autoComplete="email" required maxLength={254} />
          </label>
          <BotaoEnviar>Enviar link</BotaoEnviar>
        </form>
      </div>
    </AppShell>
  );
}
