import { alternarLocal } from '@/app/app/admin/acoes';

type Local = { local_id: string; concluido_em: string | null; local: { nome: string; restrito: boolean; ordem: number } | null };

/** Lista de locais com caixinha para o admin marcar/desmarcar como concluído. */
export function LocaisRodada({ rodadaId, locais, voltar }: { rodadaId: string; locais: Local[]; voltar: string }) {
  return (
    <>
      {[...locais]
        .sort((a, b) => (a.local?.ordem ?? 0) - (b.local?.ordem ?? 0))
        .map((l) => (
          <form action={alternarLocal} className="local" key={l.local_id}>
            <input type="hidden" name="rodada" value={rodadaId} />
            <input type="hidden" name="local" value={l.local_id} />
            <input type="hidden" name="concluido" value={l.concluido_em ? '1' : '0'} />
            <input type="hidden" name="voltar" value={voltar} />
            <button type="submit" className={`check${l.concluido_em ? ' done' : ''}`} aria-label={`Marcar ${l.local?.nome}`}>
              {l.concluido_em ? '✓' : ''}
            </button>
            <span style={{ flex: 1 }}>
              {l.local?.nome} {l.local?.restrito ? <span className="pill gold">restrito</span> : null}
            </span>
          </form>
        ))}
    </>
  );
}
