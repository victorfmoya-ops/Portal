import 'server-only';

/**
 * reCAPTCHA v2 com caixinha ("Não sou um robô") no login.
 * Liga só quando RECAPTCHA_SITE_KEY (pública) e RECAPTCHA_SECRET_KEY (segredo, só servidor)
 * existem — chaves criadas em https://www.google.com/recaptcha/admin (tipo "Desafio v2 · caixa de seleção").
 * A resposta da caixinha é SEMPRE conferida aqui, no servidor (siteverify); sem isso o captcha não protege nada.
 */
export type ConfigRecaptcha = { siteKey: string; secreta: string; dominio: string | null };

export function configRecaptcha(env: Record<string, string | undefined> = process.env): ConfigRecaptcha | null {
  const siteKey = env.RECAPTCHA_SITE_KEY?.trim();
  const secreta = env.RECAPTCHA_SECRET_KEY?.trim();
  if (!siteKey || !secreta) return null;
  let dominio: string | null = null;
  try {
    dominio = env.NEXT_PUBLIC_SITE_URL ? new URL(env.NEXT_PUBLIC_SITE_URL).hostname : null;
  } catch {
    dominio = null;
  }
  return { siteKey, secreta, dominio };
}

/** Chave pública para a página de login (null = captcha desligado). */
export function chaveRecaptcha(): string | null {
  return configRecaptcha()?.siteKey ?? null;
}

type RespostaGoogle = { success?: boolean; hostname?: string; 'error-codes'?: string[] };

/** Decide a partir da resposta do Google: caixinha resolvida e no domínio do próprio portal. */
export function interpretarResposta(r: RespostaGoogle, dominio: string | null): { ok: boolean; motivo?: string } {
  if (!r.success) return { ok: false, motivo: `recusado (${(r['error-codes'] ?? []).join(', ') || 'sem motivo'})` };
  // "testkey.google.com" só vem com as chaves de TESTE públicas do Google (que aprovam tudo de qualquer jeito);
  // com a chave secreta real, o Google devolve o domínio onde a caixinha foi resolvida.
  if (dominio && r.hostname && r.hostname !== dominio && r.hostname !== 'testkey.google.com') {
    return { ok: false, motivo: `resolvido em outro domínio (${r.hostname})` };
  }
  return { ok: true };
}

/**
 * Confere a resposta da caixinha. Captcha desligado → libera. Se o Google não responder,
 * BLOQUEIA (mais seguro; o aviso pede para tentar de novo).
 */
export async function verificarRecaptcha(
  resposta: unknown,
  cfg: ConfigRecaptcha | null = configRecaptcha(),
  buscar: typeof fetch = fetch,
): Promise<{ ok: boolean; motivo?: string }> {
  if (!cfg) return { ok: true };
  if (typeof resposta !== 'string' || resposta.length < 20 || resposta.length > 4000) return { ok: false, motivo: 'caixinha não marcada' };
  try {
    const resp = await buscar('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: cfg.secreta, response: resposta }).toString(),
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) return { ok: false, motivo: `Google respondeu ${resp.status}` };
    return interpretarResposta((await resp.json()) as RespostaGoogle, cfg.dominio);
  } catch (e) {
    return { ok: false, motivo: `falha ao consultar o Google: ${(e as Error).message}` };
  }
}
