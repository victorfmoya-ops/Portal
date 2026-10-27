import { notFound } from 'next/navigation';
import { z } from 'zod';
import { FormMembro } from '../FormMembro';
import { AppShell } from '@/components/AppShell';
import { exigirAdmin } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

export default async function FichaFilho({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await exigirAdmin();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const [{ data: membro }, { data: ficha }, { data: grupos }] = await Promise.all([
    supabase.from('membros').select('*').eq('id', id.data).maybeSingle(),
    supabase.from('fichas').select('*').eq('membro_id', id.data).maybeSingle(),
    supabase.from('grupos').select('id, numero').order('numero'),
  ]);
  if (!membro) notFound();
  return (
    <AppShell titulo="Administração" papel="admin" voltar="/app/admin/filhos" ativo="/app/admin">
      <FormMembro membro={membro} ficha={ficha} grupos={grupos ?? []} />
    </AppShell>
  );
}
