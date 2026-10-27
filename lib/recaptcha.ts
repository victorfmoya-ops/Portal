import 'server-only';

/**
 * reCAPTCHA Enterprise (com pontuação, invisível) no login.
 * Liga só quando as 3 variáveis existem: RECAPTCHA_SITE_KEY (pública), RECAPTCHA_PROJECT_ID e
 * RECAPTCHA_API_KEY (só servidor). O token do navegador é sempre conferido aqui, no servidor,
 * com a API do Google (assessments) — sem essa conferência o captcha não protege nada.
 */
export type ConfigRecaptcha = { siteKey: string; projeto: string; apiKey: string; notaMinima: number };

export function configRecaptcha(env: Record<string, string | undefined> = process.env): ConfigRecaptcha | null {
  const siteKey = env.RECAPTCHA_SITE_KEY?.trim();
  const projeto = env.RECAPTCHA_PROJECT_ID?.trim();
  const apiKey = env.RECAPTCHA_API_KEY?.trim();
  if (!siteKey || !projeto || !apiKey) return null;
  const nota = Number(env.RECAPTCHA_NOTA_MINIMA ?? '0.5');
  return { siteKey, projeto, apiKey, notaMinima: Number.isFinite(nota) && nota >= 0 && nota <= 1 ? nota : 0.5 };
}

/** Chave pública para a página de login (null = captcha desligado). */
export function chaveRecaptcha(): string | null {
  return configRecaptcha()?.siteKey ?? null;
}

type Avaliacao = {
  tokenProperties?: { valid?: boolean; action?: string; invalidReason?: string };
  riskAnalysis?: { score?: number };
};

/** Decide a partir da resposta do Google: token válido, da mesma ação e com nota suficiente. */
export function interpretarAvaliacao(r: Avaliacao, acao: string, notaMinima: number): { ok: boolean; motivo?: string } {
  if (!r.tokenProperties?.valid) return { ok: false, motivo: `token inválido (${r.tokenProperties?.invalidReason ?? 'sem motivo'})` };
  if (r.tokenProperties.action !== acao) return { ok: false, motivo: `ação diferente (${r.tokenProperties.action})` };
  const nota = r.riskAnalysis?.score ?? 0;
  if (nota < notaMinima) return { ok: false, motivo: `nota baixa (${nota})` };
  return { ok: true };
}

/**
 * Confere o token. Captcha desligado → libera. Se o Google não responder, BLOQUEIA
 * (mais seguro; o aviso pede para tentar de novo).
 */
export async function verificarRecaptcha(
  token: unknown,
  acao: string,
  cfg: ConfigRecaptcha | null = configRecaptcha(),
  buscar: typeof fetch = fetch,
): Promise<{ ok: boolean; motivo?: string }> {
  if (!cfg) return { ok: true };
  if (typeof token !== 'string' || token.length < 20 || token.length > 4000) return { ok: false, motivo: 'sem token' };
  try {
    const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(cfg.projeto)}/assessments?key=${encodeURIComponent(cfg.apiKey)}`;
    const resp = await buscar(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: { token, siteKey: cfg.siteKey, expectedAction: acao } }),
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) return { ok: false, motivo: `Google respondeu ${resp.status}` };
    return interpretarAvaliacao((await resp.json()) as Avaliacao, acao, cfg.notaMinima);
  } catch (e) {
    return { ok: false, motivo: `falha ao consultar o Google: ${(e as Error).message}` };
  }
}
