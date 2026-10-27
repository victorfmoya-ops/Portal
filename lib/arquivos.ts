/**
 * Validação de comprovantes e fotos: confere extensão, tipo declarado E a
 * assinatura real do arquivo (primeiros bytes). Um .exe renomeado para .pdf é recusado.
 */
export const TAMANHO_MAX_COMPROVANTE = 10 * 1024 * 1024;
export const TAMANHO_MAX_FOTO = 5 * 1024 * 1024;

type Tipo = { mime: string; ext: string[]; confere: (b: Uint8Array) => boolean };

const comeca = (b: Uint8Array, assinatura: number[], deslocamento = 0) =>
  assinatura.every((v, i) => b[deslocamento + i] === v);

const TIPOS: Tipo[] = [
  { mime: 'application/pdf', ext: ['pdf'], confere: (b) => comeca(b, [0x25, 0x50, 0x44, 0x46, 0x2d]) }, // %PDF-
  { mime: 'image/png', ext: ['png'], confere: (b) => comeca(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  { mime: 'image/jpeg', ext: ['jpg', 'jpeg'], confere: (b) => comeca(b, [0xff, 0xd8, 0xff]) },
  { mime: 'image/gif', ext: ['gif'], confere: (b) => comeca(b, [0x47, 0x49, 0x46, 0x38]) },
  { mime: 'image/webp', ext: ['webp'], confere: (b) => comeca(b, [0x52, 0x49, 0x46, 0x46]) && comeca(b, [0x57, 0x45, 0x42, 0x50], 8) },
  {
    mime: 'image/heic',
    ext: ['heic', 'heif'],
    confere: (b) => comeca(b, [0x66, 0x74, 0x79, 0x70], 4) && ['heic', 'heix', 'mif1', 'msf1', 'heif'].includes(String.fromCharCode(...b.slice(8, 12))),
  },
];

export type ResultadoArquivo = { ok: true; mime: string; ext: string } | { ok: false; erro: string };

export function validarArquivo(
  nome: string,
  bytes: Uint8Array,
  opcoes: { tamanhoMax: number; permitidos: string[] },
): ResultadoArquivo {
  if (bytes.length === 0) return { ok: false, erro: 'Anexe o arquivo.' };
  if (bytes.length > opcoes.tamanhoMax) {
    return { ok: false, erro: `Arquivo muito grande (máximo ${Math.round(opcoes.tamanhoMax / 1024 / 1024)} MB).` };
  }
  const ext = (nome.split('.').pop() || '').toLowerCase();
  const tipo = TIPOS.find((t) => opcoes.permitidos.includes(t.mime) && t.ext.includes(ext));
  if (!tipo) return { ok: false, erro: 'Arquivo não permitido. Envie apenas PDF ou imagem.' };
  if (!tipo.confere(bytes)) return { ok: false, erro: 'O conteúdo do arquivo não corresponde à extensão.' };
  return { ok: true, mime: tipo.mime, ext: tipo.ext[0] };
}

export const MIMES_COMPROVANTE = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic'];
export const MIMES_FOTO = ['image/png', 'image/jpeg', 'image/webp'];
