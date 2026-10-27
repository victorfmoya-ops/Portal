/**
 * Valor de cada filho na festa: total das compras ÷ filhos ativos, sempre para cima
 * (em reais inteiros ou em centavos). Mesma conta da função aplicar_rateio do banco.
 */
export function calcularRateio(total: number, filhos: number, arredondar: boolean): number {
  if (filhos <= 0 || total <= 0) return 0;
  const centavos = Math.round(total * 100);
  return arredondar ? Math.ceil(centavos / filhos / 100) : Math.ceil(centavos / filhos) / 100;
}

export function totalCompras(compras: { quantidade: number | string; valor_unitario: number | string }[]): number {
  return Math.round(compras.reduce((s, c) => s + Number(c.quantidade) * Number(c.valor_unitario) * 100, 0)) / 100;
}
