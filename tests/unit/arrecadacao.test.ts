import { describe, expect, it } from 'vitest';
import { calcularRateio, totalCompras } from '@/lib/arrecadacao';

describe('arrecadação da festa', () => {
  it('soma a lista de compras sem erro de centavos', () => {
    expect(totalCompras([{ quantidade: 3, valor_unitario: '0.10' }, { quantidade: '2', valor_unitario: 19.9 }])).toBe(40.1);
    expect(totalCompras([])).toBe(0);
  });

  it('divide pelos 42 filhos sempre para cima', () => {
    expect(calcularRateio(2100, 42, true)).toBe(50);
    expect(calcularRateio(2101, 42, true)).toBe(51);
    expect(calcularRateio(2101, 42, false)).toBe(50.03);
    expect(calcularRateio(100, 3, false)).toBe(33.34);
  });

  it('sem compras ou sem filhos não há cobrança', () => {
    expect(calcularRateio(0, 42, true)).toBe(0);
    expect(calcularRateio(500, 0, true)).toBe(0);
  });
});
