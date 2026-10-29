'use server';
import { redirect } from 'next/navigation';
import { envPublico, paraUrlPublica } from '@/lib/env';
import { voltar } from '@/lib/mensagens';
import { googleAtivo } from '@/lib/provedores';
import { verificarRecaptcha } from '@/lib/recaptcha';
import { criarClienteServidor } from '@/lib/supabase/servidor';
import { emailSchema, loginSchema, novaSenhaSchema, primeiroAcessoSchema, validar } from '@/lib/validacao';

const site = () => envPublico.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');

export async function entrarComSenha(fd: FormData) {
  const v = validar(loginSchema, fd);
  if (!v.ok) voltar('/entrar', { erro: v.erro });
  const captcha = await verificarRecaptcha(fd.get('g-recaptcha-response'));
  if (!captcha.ok) {
    console.warn('[login] reCAPTCHA recusou:', captcha.motivo);
    voltar('/entrar', { erro: 'Não conseguimos confirmar que é você (verificação de segurança). Tente de novo.' });
  }
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email: v.dados.email, password: v.dados.senha });
  if (error) {
    if (/not confirmed/i.test(error.message)) voltar('/entrar', { erro: 'Confirme seu e-mail primeiro (veja a caixa de entrada).' });
    voltar('/entrar', { erro: 'E-mail ou senha incorretos.' });
  }
  redirect('/app');
}

export async function entrarComGoogle() {
  if (!(await googleAtivo())) voltar('/entrar', { erro: 'Login com Google ainda não está configurado. Use e-mail e senha.' });
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${site()}/auth/callback`, scopes: 'openid email profile' },
  });
  if (error || !data.url) voltar('/entrar', { erro: 'Login com Google ainda não está configurado. Use e-mail e senha.' });
  redirect(paraUrlPublica(data.url));
}

/** Cria a senha de quem a casa já cadastrou. Sempre responde igual (não revela quem está cadastrado). */
export async function criarPrimeiroAcesso(fd: FormData) {
  const v = validar(primeiroAcessoSchema, fd);
  if (!v.ok) voltar('/primeiro-acesso', { erro: v.erro });
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signUp({
    email: v.dados.email,
    password: v.dados.senha,
    options: { emailRedirectTo: `${site()}/auth/confirm` },
  });
  if (error && /password/i.test(error.message)) voltar('/primeiro-acesso', { erro: 'Senha fraca: use 8+ caracteres com letras e números.' });
  voltar('/entrar', { ok: 'Pronto! Se o e-mail estiver cadastrado pela casa, chegará uma mensagem para confirmar.' });
}

export async function pedirNovaSenha(fd: FormData) {
  const v = validar(emailSchema, fd);
  if (!v.ok) voltar('/esqueci-senha', { erro: v.erro });
  const supabase = await criarClienteServidor();
  await supabase.auth.resetPasswordForEmail(v.dados.email, { redirectTo: `${site()}/auth/confirm?next=/redefinir-senha` });
  voltar('/entrar', { ok: 'Se o e-mail existir, enviamos o link para criar uma nova senha.' });
}

export async function salvarNovaSenha(fd: FormData) {
  const v = validar(novaSenhaSchema, fd);
  if (!v.ok) voltar('/redefinir-senha', { erro: v.erro });
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: v.dados.senha });
  if (error) voltar('/redefinir-senha', { erro: 'Não foi possível trocar a senha. Abra o link do e-mail de novo.' });
  voltar('/app', { ok: 'Senha alterada ✔' });
}
