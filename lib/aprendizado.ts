/** Categorias do espaço de aprendizado e cargos da casa (mesmos valores do banco). */
export const CATEGORIAS = {
  cantigas: { rotulo: 'Cantigas', icone: '🎶' },
  rezas: { rotulo: 'Rezas', icone: '🙏' },
  regras: { rotulo: 'Regras da casa', icone: '📜' },
  fundamentos: { rotulo: 'Fundamentos', icone: '🌿' },
  orixas: { rotulo: 'Orixás', icone: '✨' },
  outros: { rotulo: 'Outros', icone: '📚' },
} as const;
export type Categoria = keyof typeof CATEGORIAS;
export const LISTA_CATEGORIAS = Object.keys(CATEGORIAS) as [Categoria, ...Categoria[]];

export const CARGOS = {
  pai_de_santo: 'Pai de santo',
  mae_de_santo: 'Mãe de santo',
  oga: 'Ogã',
  ekedi: 'Ekedi',
  ebomi: 'Ebomi',
} as const;
export type Cargo = keyof typeof CARGOS;
export const LISTA_CARGOS = Object.keys(CARGOS) as [Cargo, ...Cargo[]];

/** Cargos que publicam lições (o administrador também publica). */
export const CARGOS_QUE_ENSINAM: Cargo[] = ['pai_de_santo', 'mae_de_santo', 'oga', 'ebomi'];

export function podeEnsinar(m: { papel: string; cargo?: string | null }): boolean {
  return m.papel === 'admin' || CARGOS_QUE_ENSINAM.includes(m.cargo as Cargo);
}

export function rotuloCargo(c: string | null | undefined): string | null {
  return c && c in CARGOS ? CARGOS[c as Cargo] : null;
}
