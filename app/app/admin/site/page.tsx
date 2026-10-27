import Link from 'next/link';
import { salvarSite } from '../acoes';
import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { SITE_PADRAO } from '@/lib/publico';
import { exigirAdmin } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

export default async function Aparencia() {
  const { supabase } = await exigirAdmin();
  const { data: s } = await supabase.from('site_config').select('*').maybeSingle();
  return (
    <AppShell titulo="Administração" papel="admin" voltar="/app/admin" ativo="/app/admin">
      <form action={salvarSite} className="card">
        <h3>🎨 Aparência do site</h3>
        <label className="f">
          <span>Título do topo</span>
          <input name="hero_titulo" maxLength={80} defaultValue={s?.hero_titulo ?? SITE_PADRAO.hero_titulo} required />
        </label>
        <label className="f">
          <span>Subtítulo</span>
          <input name="hero_subtitulo" maxLength={160} defaultValue={s?.hero_subtitulo ?? SITE_PADRAO.hero_subtitulo} />
        </label>
        <label className="f">
          <span>Texto “Sobre a casa” (história)</span>
          <textarea name="sobre" rows={6} maxLength={2000} defaultValue={s?.sobre ?? SITE_PADRAO.sobre} />
        </label>
        <label className="f">
          <span>Cor principal do site</span>
          <input type="color" name="cor" defaultValue={s?.cor ?? SITE_PADRAO.cor} style={{ width: 64, height: 40, padding: 2 }} />
        </label>
        <label className="f">
          <span>Link da Loja virtual (vazio = “em manutenção”)</span>
          <input name="loja_url" type="url" maxLength={500} defaultValue={s?.loja_url ?? ''} placeholder="https://..." />
        </label>
        <label className="f">
          <span>WhatsApp da casa (só números, com 55 e DDD)</span>
          <input name="whatsapp" inputMode="numeric" maxLength={15} defaultValue={s?.whatsapp ?? SITE_PADRAO.whatsapp} />
        </label>
        <label className="f">
          <span>Endereço</span>
          <input name="endereco" maxLength={200} defaultValue={s?.endereco ?? SITE_PADRAO.endereco} />
        </label>
        <div className="note" style={{ marginBottom: 10 }}>
          <b>Regras da casa</b>
        </div>
        <div className="two">
          <label className="f">
            <span>Mensalidade (R$)</span>
            <input name="valor_mensalidade" type="number" step="0.01" min="0" defaultValue={s?.valor_mensalidade ?? 60} required />
          </label>
          <label className="f">
            <span>Meta de limpezas/ano</span>
            <input name="meta_limpezas_ano" type="number" min={0} max={52} defaultValue={s?.meta_limpezas_ano ?? 5} required />
          </label>
        </div>
        <BotaoEnviar>Salvar aparência</BotaoEnviar>
      </form>
      <Link className="btn ghost" href="/" target="_blank">
        Abrir o site para conferir ↗
      </Link>
    </AppShell>
  );
}
