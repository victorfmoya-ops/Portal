import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({
  envPublico: { NEXT_PUBLIC_SUPABASE_ANON_KEY: 'chave-publica' },
  urlSupabaseServidor: () => 'http://supabase.test',
}));
const { googleAtivo } = await import('@/lib/provedores');

const responder = (corpo: unknown, status = 200) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(corpo), { status }));

describe('botão "Entrar com Google"', () => {
  afterEach(() => vi.restoreAllMocks());

  it('aparece quando o Supabase diz que o Google está ligado', async () => {
    const f = responder({ external: { email: true, google: true } });
    expect(await googleAtivo()).toBe(true);
    expect(f.mock.calls[0][0]).toBe('http://supabase.test/auth/v1/settings');
  });

  it('some quando o Google está desligado (evita o erro "provider is not enabled")', async () => {
    responder({ external: { email: true, google: false } });
    expect(await googleAtivo()).toBe(false);
  });

  it('some se o Supabase falhar ou não responder', async () => {
    responder({}, 500);
    expect(await googleAtivo()).toBe(false);
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fora do ar'));
    expect(await googleAtivo()).toBe(false);
  });
});
