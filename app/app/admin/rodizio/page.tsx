import Link from 'next/link';
import { alternarLocal, gerarRodizio } from '../acoes';
import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { StatusRodada } from '@/components/Status';
import { fmt, hojeISO, somarDias } from '@/lib/datas';
import { exigirAdmin } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

export default async function Rodizio({ searchParams }: { searchParams: Promise<{ todas?: string }> }) {
  const { supabase } = await exigirAdmin();
  const todas = (await searchParams).todas === '1';
  const hoje = hojeISO();
  let consulta = supabase
    .from('rodadas')
    .select('id, numero, inicio, fim, prazo_escolha, grupo:grupos(numero), rodada_locais(local_id, concluido_em, local:locais(nome, ordem))')
    .order('inicio');
  if (!todas) consulta = consulta.gte('fim', somarDias(hoje, -28));
  const [{ data: rodadas }, { data: metas }, { data: ultima }] = await Promise.all([
    consulta.limit(60),
    supabase.rpc('limpezas_por_filho', {}),
    supabase.from('rodadas').select('inicio').order('inicio', { ascending: false }).limit(1).maybeSingle(),
  ]);
  const abaixo = (metas ?? []).filter((m) => m.total < m.meta);
  const proximaSegunda = ultima ? somarDias(ultima.inicio, 14) : hoje;

  return (
    <AppShell titulo="Administração" papel="admin" voltar="/app/admin" ativo="/app/admin/rodizio">
      <div className="card">
        <h3>🎯 Meta de limpezas no ano</h3>
        {metas?.length ? (
          abaixo.length ? (
            <>
              <p className="muted">Filhos que ainda não chegaram à meta ({abaixo[0].meta} por ano):</p>
              {abaixo.map((m) => (
                <div className="item" key={m.membro_id}>
                  <div className="row between">
                    <span className="t">{m.nome}</span>
                    <span className="pill no">{`${m.total}/${m.meta}${m.grupo ? ` · G${m.grupo}` : ''}`}</span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="note">Todos os filhos já atingiram a meta deste ano. Axé! 🙏</div>
          )
        ) : (
          <div className="muted">Nenhum filho cadastrado.</div>
        )}
        <div className="note">Conta os dias escolhidos (por eles ou pela administração) dentro do ano.</div>
      </div>

      <div className="card">
        <h3>🧹 Rodízio quinzenal ({rodadas?.length ?? 0} rodadas)</h3>
        {(rodadas ?? []).map((r) => {
          const feitos = r.rodada_locais.filter((l) => l.concluido_em).length;
          const atual = r.inicio <= hoje && r.fim >= hoje;
          return (
            <div className="item" key={r.id}>
              <div className="row between">
                <div>
                  <div className="t">
                    <Link href={`/app/admin/rodizio/${r.id}`} style={{ color: 'inherit' }}>
                      Rodada {r.numero} — Grupo {r.grupo?.numero}
                    </Link>{' '}
                    {atual ? <span className="pill now">atual</span> : null}
                  </div>
                  <div className="s">
                    {fmt(r.inicio)} a {fmt(r.fim)} · escolha até {fmt(r.prazo_escolha)}
                  </div>
                </div>
                <StatusRodada feitos={feitos} total={r.rodada_locais.length} passou={r.fim < hoje} />
              </div>
              <div className="chips">
                {[...r.rodada_locais]
                  .sort((a, b) => (a.local?.ordem ?? 0) - (b.local?.ordem ?? 0))
                  .map((l) => (
                    <form action={alternarLocal} key={l.local_id}>
                      <input type="hidden" name="rodada" value={r.id} />
                      <input type="hidden" name="local" value={l.local_id} />
                      <input type="hidden" name="concluido" value={l.concluido_em ? '1' : '0'} />
                      <input type="hidden" name="voltar" value="/app/admin/rodizio" />
                      <button type="submit" className="chip">
                        {l.concluido_em ? '✓ ' : ''}
                        {(l.local?.nome ?? '').split(' / ')[0]}
                      </button>
                    </form>
                  ))}
              </div>
            </div>
          );
        })}
        <div className="note">Toque num local para marcar/desmarcar como concluído. Toque no nome da rodada para ver os dias escolhidos.</div>
        <div className="actions">
          <Link className="btn ghost small" href={todas ? '/app/admin/rodizio' : '/app/admin/rodizio?todas=1'}>
            {todas ? 'Mostrar só as próximas' : 'Mostrar também as antigas'}
          </Link>
        </div>
      </div>

      <div className="card">
        <h3>➕ Gerar novas rodadas</h3>
        <p className="muted">
          Cria rodadas a cada 2 semanas, alternando os grupos em ordem (continua do grupo seguinte ao da última rodada). Com 5 grupos e 26
          rodadas por ano, cada grupo faz pelo menos 5 limpezas.
        </p>
        <form action={gerarRodizio}>
          <div className="two">
            <label className="f">
              <span>Primeira segunda-feira</span>
              <input type="date" name="inicio" defaultValue={proximaSegunda} required />
            </label>
            <label className="f">
              <span>Quantidade</span>
              <input type="number" name="quantidade" defaultValue={26} min={1} max={60} required />
            </label>
          </div>
          <BotaoEnviar>Gerar rodadas</BotaoEnviar>
        </form>
      </div>
    </AppShell>
  );
}
