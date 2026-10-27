import { AppShell } from '@/components/AppShell';
import { fmt } from '@/lib/datas';
import { exigirFilho } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

/** Meus dados: SOMENTE LEITURA (regra da casa: alterações só com a administração). */
export default async function MeusDados() {
  const { supabase, membro } = await exigirFilho();
  const { data: f } = await supabase.from('fichas').select('*').eq('membro_id', membro.id).maybeSingle();
  const obrigacoes = (
    [
      ['01 ano', f?.dt_1ano],
      ['03 anos', f?.dt_3anos],
      ['05 anos', f?.dt_5anos],
      ['07 anos', f?.dt_7anos],
    ] as const
  ).filter(([, d]) => d);

  const linha = (rotulo: string, valor: string | null | undefined) => (
    <div className="item">
      <div className="s">
        {rotulo}: <b>{valor || '—'}</b>
      </div>
    </div>
  );

  return (
    <AppShell titulo="Área do filho" papel="filho" voltar="/app/filho" ativo="/app/filho">
      <div className="card">
        <h3>🪪 Meus dados</h3>
        {linha('Nome', membro.nome)}
        {linha('E-mail', membro.email)}
        {linha('Endereço', f?.endereco)}
        {linha('WhatsApp', f?.whatsapp)}
        {linha('Telefone de emergência', f?.telefone_emergencia)}
      </div>
      <div className="card">
        <h3>Meus dados religiosos</h3>
        {linha('Zelador(a)', f?.zelador)}
        {linha('Òrìṣà', f?.orisa ? `${f.orisa}${f.ere ? ` · Erê: ${f.ere}` : ''}` : null)}
        {linha('Iniciado(a)', f ? `${f.iniciado ? 'sim' : 'não'}${f.dt_iniciacao ? ` · desde ${fmt(f.dt_iniciacao)}` : ''}` : null)}
        {obrigacoes.length ? linha('Obrigações', obrigacoes.map(([r, d]) => `${r} (${fmt(d)})`).join(' · ')) : null}
      </div>
      <div className="note">
        Seus dados são <b>somente leitura</b>. Para corrigir qualquer informação, fale com a administração da casa.
      </div>
    </AppShell>
  );
}
