import 'server-only';
import client from '@prometheus-io/client';

/** Métricas do portal para o Prometheus (um registro único por processo). */
const global = globalThis as unknown as { __metricasPortal?: ReturnType<typeof criar> };

function criar() {
  const registro = new client.Registry();
  registro.setDefaultLabels({ app: 'portal-ase' });
  client.collectDefaultMetrics({ register: registro, prefix: 'portal_' });
  const rotinas = new client.Counter({
    name: 'portal_rotinas_total',
    help: 'Execuções das rotinas automáticas (cron) por tarefa e resultado',
    labelNames: ['tarefa', 'resultado'] as const,
    registers: [registro],
  });
  const comprovantesRemovidos = new client.Counter({
    name: 'portal_comprovantes_removidos_total',
    help: 'Comprovantes apagados (recusados, substituídos ou com mais de 6 meses)',
    registers: [registro],
  });
  const bancoOk = new client.Gauge({
    name: 'portal_banco_disponivel',
    help: '1 se o banco (Supabase) respondeu no último health check',
    registers: [registro],
  });
  return { registro, rotinas, comprovantesRemovidos, bancoOk };
}

export const metricas = (global.__metricasPortal ??= criar());
