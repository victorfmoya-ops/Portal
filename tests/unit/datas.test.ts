import { describe, expect, it } from 'vitest';
import { brl, diaSemana, diasDaRodada, fmt, gradeDoMes, hojeISO, limitesDoMes, mesAnterior, mesSeguinte, mesValido, nomeMes, somarDias } from '@/lib/datas';

describe('datas', () => {
  it('formata datas no padrão brasileiro', () => {
    expect(fmt('2026-10-17')).toBe('17/10/2026');
    expect(fmt(null)).toBe('—');
  });

  it('calcula o dia da semana sem erro de fuso', () => {
    expect(diaSemana('2026-10-17')).toBe('sábado');
    expect(diaSemana('2026-09-07')).toBe('segunda-feira');
  });

  it('usa o fuso de São Paulo para "hoje"', () => {
    // 02:00 UTC de 28/10 ainda é 27/10 em São Paulo (UTC-3)
    expect(hojeISO(new Date('2026-10-28T02:00:00Z'))).toBe('2026-10-27');
  });

  it('lista os 7 dias da rodada (segunda a domingo)', () => {
    const dias = diasDaRodada('2026-11-16');
    expect(dias).toHaveLength(7);
    expect(dias[0]).toBe('2026-11-16');
    expect(dias[6]).toBe('2026-11-22');
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('navega entre meses e valida o parâmetro', () => {
    expect(mesAnterior('2026-01')).toBe('2025-12');
    expect(mesSeguinte('2026-12')).toBe('2027-01');
    expect(mesValido('2026-13', '2026-10-27')).toBe('2026-10');
    expect(mesValido("2026-10'; drop", '2026-10-27')).toBe('2026-10');
    expect(nomeMes('2026-10')).toBe('outubro de 2026');
    expect(limitesDoMes('2026-02')).toEqual({ de: '2026-02-01', ate: '2026-02-28' });
  });

  it('monta a grade do calendário começando no domingo', () => {
    const grade = gradeDoMes('2026-11'); // 01/11/2026 é domingo
    expect(grade[0][0]).toBe('2026-11-01');
    expect(grade.flat().filter(Boolean)).toHaveLength(30);
    expect(grade.every((s) => s.length === 7)).toBe(true);
  });

  it('formata dinheiro em reais', () => {
    expect(brl(60)).toMatch(/R\$\s?60,00/);
  });
});
