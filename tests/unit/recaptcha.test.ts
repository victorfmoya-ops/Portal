import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const { configRecaptcha, interpretarAvaliacao, verificarRecaptcha } = await import('@/lib/recaptcha');

const cfg = { siteKey: 'chave-site', projeto: 'projeto-x', apiKey: 'api-secreta', notaMinima: 0.5 };
const token = 't'.repeat(40);
const respostaGoogle = (corpo: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(corpo), { status }));

describe('reCAPTCHA do login', () => {
  it('só liga com chave do site, projeto e chave de API', () => {
    expect(configRecaptcha({ RECAPTCHA_SITE_KEY: 'a' })).toBeNull();
    expect(configRecaptcha({ RECAPTCHA_SITE_KEY: 'a', RECAPTCHA_PROJECT_ID: 'p' })).toBeNull();
    expect(configRecaptcha({ RECAPTCHA_SITE_KEY: 'a', RECAPTCHA_PROJECT_ID: 'p', RECAPTCHA_API_KEY: 'k' })).toMatchObject({ notaMinima: 0.5 });
    expect(configRecaptcha({ RECAPTCHA_SITE_KEY: 'a', RECAPTCHA_PROJECT_ID: 'p', RECAPTCHA_API_KEY: 'k', RECAPTCHA_NOTA_MINIMA: '7' })?.notaMinima).toBe(0.5);
  });

  it('desligado: não bloqueia o login', async () => {
    expect(await verificarRecaptcha(undefined, 'LOGIN', null)).toEqual({ ok: true });
  });

  it('ligado: sem token é recusado sem nem chamar o Google', async () => {
    const buscar = vi.fn();
    expect((await verificarRecaptcha('', 'LOGIN', cfg, buscar)).ok).toBe(false);
    expect(buscar).not.toHaveBeenCalled();
  });

  it('aceita token válido, da ação certa e com nota suficiente', async () => {
    const buscar = respostaGoogle({ tokenProperties: { valid: true, action: 'LOGIN' }, riskAnalysis: { score: 0.9 } });
    expect(await verificarRecaptcha(token, 'LOGIN', cfg, buscar)).toEqual({ ok: true });
    const [url, init] = buscar.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://recaptchaenterprise.googleapis.com/v1/projects/projeto-x/assessments?key=api-secreta');
    expect(JSON.parse(String(init.body))).toEqual({ event: { token, siteKey: 'chave-site', expectedAction: 'LOGIN' } });
  });

  it('recusa robô, token inválido, ação trocada e falha do Google', async () => {
    expect(interpretarAvaliacao({ tokenProperties: { valid: true, action: 'LOGIN' }, riskAnalysis: { score: 0.1 } }, 'LOGIN', 0.5).ok).toBe(false);
    expect(interpretarAvaliacao({ tokenProperties: { valid: false, invalidReason: 'EXPIRED' } }, 'LOGIN', 0.5)).toMatchObject({ ok: false, motivo: /EXPIRED/ });
    expect(interpretarAvaliacao({ tokenProperties: { valid: true, action: 'OUTRA' }, riskAnalysis: { score: 0.9 } }, 'LOGIN', 0.5).ok).toBe(false);
    expect((await verificarRecaptcha(token, 'LOGIN', cfg, respostaGoogle({}, 403))).ok).toBe(false);
    const caiu = vi.fn(async () => {
      throw new Error('sem rede');
    });
    expect(await verificarRecaptcha(token, 'LOGIN', cfg, caiu)).toMatchObject({ ok: false, motivo: /sem rede/ });
  });

  it('o motivo da recusa nunca expõe a chave de API', async () => {
    const r = await verificarRecaptcha(token, 'LOGIN', cfg, respostaGoogle({}, 500));
    expect(r.motivo).not.toContain('api-secreta');
  });
});
