import { AppShell } from '@/components/AppShell';
import { exigirAdmin } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

const ACOES: Record<string, string> = {
  'conta.vinculada': 'Primeiro acesso (conta ligada ao cadastro)',
  'consentimento.aceito': 'Aceitou o termo de uso dos dados',
  'limpeza.dia_escolhido': 'Escolheu o dia da limpeza',
  'comprovante.enviado': 'Enviou comprovante',
  'pagamento.confirmado': 'Confirmou pagamento',
  'pagamento.rejeitado': 'Recusou comprovante',
  'pagamento.aberta': 'Desfez decisão de pagamento',
  'rodizio.gerado': 'Gerou rodadas do rodízio',
};

export default async function Auditoria() {
  const { supabase } = await exigirAdmin();
  const { data: logs } = await supabase
    .from('log_auditoria')
    .select('id, acao, alvo, criado_em, membro:membros(nome)')
    .order('criado_em', { ascending: false })
    .limit(100);
  const fmtHora = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });

  return (
    <AppShell titulo="Administração" papel="admin" voltar="/app/admin" ativo="/app/admin">
      <div className="card">
        <h3>🧾 Auditoria — últimas 100 ações</h3>
        {(logs ?? []).map((l) => (
          <div className="item" key={l.id}>
            <div className="t">{ACOES[l.acao] ?? l.acao}</div>
            <div className="s">
              {fmtHora.format(new Date(l.criado_em))} · {l.membro?.nome ?? 'sistema'}
            </div>
          </div>
        ))}
        {!logs?.length ? <div className="muted">Nada registrado ainda.</div> : null}
        <div className="note">Registro automático e somente leitura: ninguém consegue apagar ou alterar pela tela.</div>
      </div>
    </AppShell>
  );
}
