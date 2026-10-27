import { describe, expect, it } from 'vitest';
import {
  caixaSchema,
  funcaoSchema,
  licaoSchema,
  membroSchema,
  primeiroAcessoSchema,
  siteSchema,
  validar,
  videoSchema,
} from '@/lib/validacao';
import { podeEnsinar } from '@/lib/aprendizado';

describe('validação dos formulários', () => {
  it('senha do primeiro acesso: 8+ caracteres com letras e números e confirmação igual', () => {
    expect(validar(primeiroAcessoSchema, { email: 'a@exemplo.test', senha: 'abc12345', confirmar: 'abc12345' }).ok).toBe(true);
    expect(validar(primeiroAcessoSchema, { email: 'a@exemplo.test', senha: 'abcdefgh', confirmar: 'abcdefgh' })).toMatchObject({ ok: false, erro: /números/ });
    expect(validar(primeiroAcessoSchema, { email: 'a@exemplo.test', senha: 'abc12345', confirmar: 'outra123' })).toMatchObject({ ok: false, erro: /não conferem/ });
  });

  it('cadastro de membro converte campos vazios', () => {
    const r = validar(membroSchema, { nome: 'Fulano (exemplo)', email: 'f@exemplo.test', papel: 'filho', status: 'ativo', grupo_id: '', aniversario_dia: '', aniversario_mes: '' });
    expect(r).toMatchObject({ ok: true, dados: { grupo_id: null, aniversario_dia: null } });
    expect(validar(membroSchema, { nome: 'X', email: 'ruim', papel: 'filho', status: 'ativo', grupo_id: '', aniversario_dia: '', aniversario_mes: '' }).ok).toBe(false);
    expect(validar(membroSchema, { nome: 'Fulano', email: 'f@exemplo.test', papel: 'dono', status: 'ativo', grupo_id: '', aniversario_dia: '', aniversario_mes: '' }).ok).toBe(false);
  });

  it('caixa: valor maior que zero e tipo válido', () => {
    expect(validar(caixaSchema, { tipo: 'receita', descricao: 'Doação', categoria: '', valor: '50.5', data: '2026-10-27' })).toMatchObject({ ok: true, dados: { valor: 50.5, categoria: null } });
    expect(validar(caixaSchema, { tipo: 'receita', descricao: 'Doação', categoria: '', valor: '0', data: '2026-10-27' }).ok).toBe(false);
    expect(validar(caixaSchema, { tipo: 'roubo', descricao: 'x', categoria: '', valor: '1', data: '2026-10-27' }).ok).toBe(false);
  });

  it('função: checkbox e hora opcional', () => {
    expect(validar(funcaoSchema, { titulo: 'Oro', data: '2026-12-20', hora: '', referencia: '', obrigatorio: 'on' })).toMatchObject({ ok: true, dados: { obrigatorio: true, hora: null } });
  });

  it('links só https (bloqueia javascript: e http)', () => {
    expect(validar(videoSchema, { titulo: 'Toque', url: 'https://www.youtube.com/watch?v=1' }).ok).toBe(true);
    expect(validar(videoSchema, { titulo: 'Toque', url: 'javascript:alert(1)' }).ok).toBe(false);
    expect(validar(videoSchema, { titulo: 'Toque', url: 'http://site.com' }).ok).toBe(false);
    expect(validar(videoSchema, { titulo: 'Toque', url: 'https://x.com/"><script>' }).ok).toBe(false);
  });

  it('aparência do site: cor hexadecimal e WhatsApp só números', () => {
    const base = { hero_titulo: 'fé', hero_subtitulo: '', sobre: '', cor: '#1f66c2', loja_url: '', whatsapp: '5511976831500', endereco: '', valor_mensalidade: '60', meta_limpezas_ano: '5' };
    expect(validar(siteSchema, base)).toMatchObject({ ok: true, dados: { loja_url: null, meta_limpezas_ano: 5 } });
    expect(validar(siteSchema, { ...base, cor: 'red' }).ok).toBe(false);
    expect(validar(siteSchema, { ...base, whatsapp: '+55 (11) 9' }).ok).toBe(false);
  });
});

describe('espaço de aprendizado', () => {
  it('só quem tem cargo de ensino (ou admin) publica', () => {
    expect(podeEnsinar({ papel: 'admin', cargo: null })).toBe(true);
    expect(podeEnsinar({ papel: 'filho', cargo: 'oga' })).toBe(true);
    expect(podeEnsinar({ papel: 'filho', cargo: 'ebomi' })).toBe(true);
    expect(podeEnsinar({ papel: 'filho', cargo: 'ekedi' })).toBe(false);
    expect(podeEnsinar({ papel: 'filho', cargo: null })).toBe(false);
  });

  it('valida a lição', () => {
    expect(validar(licaoSchema, { categoria: 'cantigas', titulo: 'Cantiga de Oxóssi', conteudo: 'letra', midia_url: '' }).ok).toBe(true);
    expect(validar(licaoSchema, { categoria: 'segredo', titulo: 'Cantiga', conteudo: 'letra', midia_url: '' }).ok).toBe(false);
    expect(validar(licaoSchema, { categoria: 'rezas', titulo: 'Reza', conteudo: 'texto', midia_url: 'http://inseguro' })).toMatchObject({ ok: false });
  });
});
