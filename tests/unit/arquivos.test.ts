import { describe, expect, it } from 'vitest';
import { MIMES_COMPROVANTE, MIMES_FOTO, TAMANHO_MAX_COMPROVANTE, validarArquivo } from '@/lib/arquivos';

const bytes = (...n: number[]) => new Uint8Array(n);
const PDF = new TextEncoder().encode('%PDF-1.4 conteudo');
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0);
const JPG = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0);
const opcComp = { tamanhoMax: TAMANHO_MAX_COMPROVANTE, permitidos: MIMES_COMPROVANTE };

describe('validação de comprovantes', () => {
  it('aceita PDF, PNG e JPG verdadeiros', () => {
    expect(validarArquivo('recibo.pdf', PDF, opcComp)).toMatchObject({ ok: true, mime: 'application/pdf' });
    expect(validarArquivo('foto.PNG', PNG, opcComp)).toMatchObject({ ok: true, mime: 'image/png' });
    expect(validarArquivo('foto.jpeg', JPG, opcComp)).toMatchObject({ ok: true, mime: 'image/jpeg', ext: 'jpg' });
  });

  it('recusa arquivo disfarçado (extensão não bate com o conteúdo)', () => {
    const r = validarArquivo('virus.pdf', new TextEncoder().encode('MZ executavel'), opcComp);
    expect(r.ok).toBe(false);
  });

  it('recusa extensões não permitidas', () => {
    expect(validarArquivo('script.exe', PDF, opcComp).ok).toBe(false);
    expect(validarArquivo('pagina.html', PDF, opcComp).ok).toBe(false);
    expect(validarArquivo('sem-extensao', PDF, opcComp).ok).toBe(false);
  });

  it('recusa vazio e acima de 10 MB', () => {
    expect(validarArquivo('a.pdf', new Uint8Array(0), opcComp).ok).toBe(false);
    const grande = new Uint8Array(TAMANHO_MAX_COMPROVANTE + 1);
    grande.set(PDF);
    expect(validarArquivo('a.pdf', grande, opcComp)).toMatchObject({ ok: false });
  });

  it('fotos da galeria não aceitam PDF', () => {
    expect(validarArquivo('a.pdf', PDF, { tamanhoMax: 5e6, permitidos: MIMES_FOTO }).ok).toBe(false);
    expect(validarArquivo('a.png', PNG, { tamanhoMax: 5e6, permitidos: MIMES_FOTO }).ok).toBe(true);
  });
});
