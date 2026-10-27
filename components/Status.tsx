/** Selos de situação (mesmas cores do protótipo). */
export function StatusPagamento({ status }: { status: string }) {
  if (status === 'confirmado') return <span className="pill ok">em dia</span>;
  if (status === 'pendente') return <span className="pill wait">em análise</span>;
  if (status === 'rejeitado') return <span className="pill no">recusado</span>;
  return <span className="pill no">a pagar</span>;
}

export function StatusRodada({ feitos, total, passou }: { feitos: number; total: number; passou: boolean }) {
  if (total > 0 && feitos >= total) return <span className="pill ok">concluída</span>;
  if (feitos > 0) return <span className="pill wait">{`${feitos}/${total}`}</span>;
  return passou ? <span className="pill no">pendente</span> : <span className="pill open">planejada</span>;
}
