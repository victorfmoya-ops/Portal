import { z } from 'zod';
import { LISTA_CARGOS, LISTA_CATEGORIAS } from '@/lib/aprendizado';

/** Validação de tudo que chega dos formulários (no servidor, antes de gravar). */
const texto = (max: number) => z.string().trim().max(max, `Máximo de ${max} caracteres`);
const textoOpcional = (max: number) =>
  z.string().trim().max(max, `Máximo de ${max} caracteres`).transform((v) => (v === '' ? null : v));
const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida');
const dataOpcional = z
  .string()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Data inválida')
  .transform((v) => (v === '' ? null : v));
const horaOpcional = z
  .string()
  .regex(/^(\d{2}:\d{2})?$/, 'Hora inválida')
  .transform((v) => (v === '' ? null : v));
const uuid = z.uuid('Identificador inválido');
const checkbox = z
  .union([z.literal('on'), z.literal('true'), z.literal('')])
  .optional()
  .transform((v) => v === 'on' || v === 'true');
const urlHttps = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https:\/\/[^\s<>"']+$/.test(v), 'Use um link que comece com https://')
  .transform((v) => (v === '' ? null : v));
const dinheiro = z.coerce.number({ message: 'Valor inválido' }).min(0, 'Valor inválido').max(1_000_000, 'Valor muito alto');

export const senhaForte = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres')
  .max(72, 'Senha longa demais')
  .regex(/[A-Za-z]/, 'A senha precisa ter letras')
  .regex(/\d/, 'A senha precisa ter números');

export const loginSchema = z.object({
  email: z.email('E-mail inválido').max(254),
  senha: z.string().min(1, 'Informe a senha').max(72),
});

export const primeiroAcessoSchema = z
  .object({ email: z.email('E-mail inválido').max(254), senha: senhaForte, confirmar: z.string() })
  .refine((v) => v.senha === v.confirmar, { message: 'As senhas não conferem', path: ['confirmar'] });

export const emailSchema = z.object({ email: z.email('E-mail inválido').max(254) });

export const novaSenhaSchema = z
  .object({ senha: senhaForte, confirmar: z.string() })
  .refine((v) => v.senha === v.confirmar, { message: 'As senhas não conferem', path: ['confirmar'] });

export const membroSchema = z.object({
  nome: texto(120).min(2, 'Informe o nome'),
  email: z.email('E-mail inválido').max(254),
  papel: z.enum(['filho', 'admin']),
  cargo: z.union([z.enum(LISTA_CARGOS), z.literal('')]).optional().transform((v) => (v ? v : null)),
  status: z.enum(['ativo', 'bloqueado']),
  equipe_id: z.union([uuid, z.literal('')]).optional().transform((v) => (v ? v : null)),
  grupo_id: z.union([uuid, z.literal('')]).transform((v) => (v === '' ? null : v)),
  aniversario_dia: z.union([z.coerce.number().int().min(1).max(31), z.literal('')]).transform((v) => (v === '' ? null : v)),
  aniversario_mes: z.union([z.coerce.number().int().min(1).max(12), z.literal('')]).transform((v) => (v === '' ? null : v)),
});

export const fichaSchema = z.object({
  data_cadastro: dataOpcional,
  endereco: textoOpcional(200),
  whatsapp: textoOpcional(30),
  telefone_emergencia: textoOpcional(30),
  zelador: textoOpcional(120),
  orisa: textoOpcional(80),
  ere: textoOpcional(80),
  iniciado: checkbox,
  dt_iniciacao: dataOpcional,
  dt_1ano: dataOpcional,
  dt_3anos: dataOpcional,
  dt_5anos: dataOpcional,
  dt_7anos: dataOpcional,
});

export const eventoSchema = z.object({
  titulo: texto(120).min(2, 'Informe o título'),
  data,
  hora: horaOpcional,
  observacao: textoOpcional(300),
  publico: checkbox,
});

export const funcaoSchema = z.object({
  titulo: texto(120).min(2, 'Informe o título'),
  data,
  hora: horaOpcional,
  referencia: textoOpcional(200),
  obrigatorio: checkbox,
});

export const festaSchema = z.object({
  nome: texto(120).min(2, 'Informe o nome da festa'),
  data,
  valor: dinheiro,
});

export const caixaSchema = z.object({
  tipo: z.enum(['receita', 'despesa']),
  descricao: texto(160).min(2, 'Descreva o lançamento'),
  categoria: textoOpcional(60),
  valor: dinheiro.refine((v) => v > 0, 'O valor precisa ser maior que zero'),
  data,
});

export const siteSchema = z.object({
  hero_titulo: texto(80).min(2, 'Informe o título'),
  hero_subtitulo: texto(160),
  sobre: texto(2000),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
  loja_url: urlHttps,
  whatsapp: z
    .string()
    .trim()
    .regex(/^(\d{10,15})?$/, 'WhatsApp: só números com DDI e DDD (ex.: 5511999999999)')
    .transform((v) => (v === '' ? null : v)),
  endereco: textoOpcional(200),
  valor_mensalidade: dinheiro,
  meta_limpezas_ano: z.coerce.number().int().min(0).max(52),
});

export const videoSchema = z.object({
  titulo: texto(120).min(2, 'Informe o título'),
  url: z
    .string()
    .trim()
    .max(500)
    .regex(/^https:\/\/[^\s<>"']+$/, 'Use um link que comece com https://'),
});

export const escolhaDiaSchema = z.object({ rodada: uuid, dia: data });

export const rejeicaoSchema = z.object({ motivo: texto(300).min(3, 'Explique o motivo para o filho') });

export const rodizioSchema = z.object({
  inicio: data,
  quantidade: z.coerce.number().int().min(1).max(60),
});

/** Converte FormData em objeto validado; devolve a primeira mensagem de erro em português. */
export function validar<T extends z.ZodType>(schema: T, fd: FormData | Record<string, unknown>):
  | { ok: true; dados: z.output<T> }
  | { ok: false; erro: string } {
  const bruto = fd instanceof FormData ? Object.fromEntries(fd.entries()) : fd;
  const r = schema.safeParse(bruto);
  if (r.success) return { ok: true, dados: r.data };
  return { ok: false, erro: r.error.issues[0]?.message ?? 'Dados inválidos' };
}

export const licaoSchema = z.object({
  categoria: z.enum(LISTA_CATEGORIAS, 'Escolha a categoria'),
  titulo: texto(140).min(3, 'Informe o título'),
  conteudo: z.string().trim().min(1, 'Escreva o conteúdo').max(20000, 'Máximo de 20000 caracteres'),
  midia_url: urlHttps,
});

export const equipeSchema = z.object({
  nome: texto(60).min(2, 'Informe o nome da equipe'),
  descricao: textoOpcional(300),
  coordenador_id: z.union([uuid, z.literal('')]).transform((v) => (v === '' ? null : v)),
  arrecadacao: checkbox,
});

export const tarefaSchema = z.object({
  festa_id: uuid,
  equipe_id: uuid,
  descricao: texto(200).min(2, 'Descreva a tarefa'),
});

export const compraSchema = z.object({
  festa_id: uuid,
  item: texto(120).min(2, 'Informe o item'),
  quantidade: z.coerce.number({ message: 'Quantidade inválida' }).gt(0, 'Quantidade inválida').max(100_000, 'Quantidade muito alta'),
  valor_unitario: dinheiro,
});
