import { redirect } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';

export default async function App() {
  const { membro } = await exigirMembro();
  redirect(membro.papel === 'admin' ? '/app/admin' : '/app/filho');
}
