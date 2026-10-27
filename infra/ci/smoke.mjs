// Teste de fumaça do ambiente de revisão (roda dentro da rede da esteira).
// Confere: site no ar, banco ligado, área restrita protegida, rotas técnicas fechadas e cabeçalhos de segurança.
const BASE = process.env.BASE || 'http://127.0.0.1:3020';
let falhas = 0;

async function checar(nome, fn) {
  try {
    await fn();
    console.log(`✔ ${nome}`);
  } catch (e) {
    falhas++;
    console.log(`✘ ${nome}: ${e.message}`);
  }
}
const esperar = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

await checar('health: portal e banco no ar', async () => {
  const r = await fetch(`${BASE}/api/health`);
  const j = await r.json();
  esperar(r.status === 200 && j.banco === 'up', `status ${r.status} ${JSON.stringify(j)}`);
});

await checar('página inicial com as seções do protótipo', async () => {
  const r = await fetch(`${BASE}/`);
  const html = await r.text();
  esperar(r.status === 200, `status ${r.status}`);
  for (const t of ['fé, axé e tradição', 'ORIXÁS', 'TOQUES', 'JOGO DE BÚZIOS', 'ESTAMOS']) esperar(html.includes(t), `faltou "${t}"`);
});

await checar('calendário público de toques', async () => {
  const r = await fetch(`${BASE}/agenda?mes=2026-11`);
  esperar(r.status === 200 && (await r.text()).includes('Toque de Exu'), `status ${r.status}`);
});

await checar('área restrita redireciona para o login', async () => {
  const r = await fetch(`${BASE}/app/admin`, { redirect: 'manual' });
  esperar([302, 303, 307].includes(r.status) && (r.headers.get('location') || '').includes('/entrar'), `status ${r.status}`);
});

await checar('métricas exigem token', async () => {
  const r = await fetch(`${BASE}/api/metrics`);
  esperar(r.status === 401, `status ${r.status}`);
});

await checar('rotinas automáticas exigem token', async () => {
  const r = await fetch(`${BASE}/api/cron/limpar-comprovantes`, { method: 'POST' });
  esperar(r.status === 401, `status ${r.status}`);
});

await checar('cabeçalhos de segurança', async () => {
  const r = await fetch(`${BASE}/`);
  for (const h of ['content-security-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy', 'strict-transport-security']) {
    esperar(r.headers.get(h), `faltou ${h}`);
  }
  esperar(!r.headers.get('x-powered-by'), 'x-powered-by exposto');
});

console.log(falhas ? `\n${falhas} verificação(ões) falharam` : '\nTodas as verificações passaram');
process.exit(falhas ? 1 : 0);
