import { FormMembro } from '../FormMembro';
import { AppShell } from '@/components/AppShell';
import { exigirAdmin } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

export default async function NovoFilho() {
  const { supabase } = await exigirAdmin();
  const [{ data: grupos }, { data: equipes }] = await Promise.all([
    supabase.from('grupos').select('id, numero').order('numero'),
    supabase.from('equipes').select('id, nome').order('nome'),
  ]);
  return (
    <AppShell titulo="Administração" papel="admin" voltar="/app/admin/filhos" ativo="/app/admin">
      <FormMembro grupos={grupos ?? []} equipes={equipes ?? []} />
    </AppShell>
  );
}
