import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const { configRecaptcha, interpretarResposta, verificarRecaptcha } = await import('@/lib/recaptcha');

const cfg = { siteKey: 'chave-site', secreta: 'chave-secreta', dominio: 'casa.example' };
const resposta = 'r'.repeat(40);
const respostaGoogle = (corpo: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(corpo), { status }));

describe('reCAPTCHA do login (caixinha)', () => {
  it('só liga com a chave do site e a chave secreta', () => {
    expect(configRecaptcha({ RECAPTCHA_SITE_KEY: 'a' })).toBeNull();
    expect(configRecaptcha({ RECAPTCHA_SECRET_KEY: 'b' })).toBeNull();
    expect(configRecaptcha({ RECAPTCHA_SITE_KEY: 'a', RECAPTCHA_SECRET_KEY: 'b', NEXT_PUBLIC_SITE_URL: 'https://casa.example/' })).toEqual({
      siteKey: 'a',
      secreta: 'b',
      dominio: 'casa.example',
    });
  });

  it('desligado: não bloqueia o login', async () => {
    expect(await verificarRecaptcha(undefined, null)).toEqual({ ok: true });
  });

  it('caixinha não marcada é recusada sem nem chamar o Google', async () => {
    const buscar = vi.fn();
    expect(await verificarRecaptcha('', cfg, buscar)).toMatchObject({ ok: false, motivo: 'caixinha não marcada' });
    expect(buscar).not.toHaveBeenCalled();
  });

  it('aceita a caixinha resolvida no domínio do portal e manda a chave secreta só para o Google', async () => {
    const buscar = respostaGoogle({ success: true, hostname: 'casa.example' });
    expect(await verificarRecaptcha(resposta, cfg, buscar)).toEqual({ ok: true });
    const [url, init] = buscar.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://www.google.com/recaptcha/api/siteverify');
    expect(Object.fromEntries(new URLSearchParams(String(init.body)))).toEqual({ secret: 'chave-secreta', response: resposta });
  });

  it('recusa resposta inválida, outro domínio e falha do Google', async () => {
    expect(interpretarResposta({ success: false, 'error-codes': ['timeout-or-duplicate'] }, 'casa.example')).toMatchObject({ ok: false, motivo: /timeout-or-duplicate/ });
    expect(interpretarResposta({ success: true, hostname: 'site-malicioso.example' }, 'casa.example').ok).toBe(false);
    expect((await verificarRecaptcha(resposta, cfg, respostaGoogle({}, 500))).ok).toBe(false);
    const caiu = vi.fn(async () => {
      throw new Error('sem rede');
    });
    expect(await verificarRecaptcha(resposta, cfg, caiu)).toMatchObject({ ok: false, motivo: /sem rede/ });
  });

  it('o motivo da recusa nunca expõe a chave secreta', async () => {
    const r = await verificarRecaptcha(resposta, cfg, respostaGoogle({ success: false }, 200));
    expect(r.motivo).not.toContain('chave-secreta');
  });
});
