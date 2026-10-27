import 'server-only';
import { envPublico } from '@/lib/env';
import { hojeISO } from '@/lib/datas';
import { criarClientePublico } from '@/lib/supabase/servico';

export const SITE_PADRAO = {
  nome: 'Centro Cultural Família Àṣẹ Omos Odé',
  hero_titulo: 'fé, axé e tradição',
  hero_subtitulo: 'Centro Cultural Família Àṣẹ Omos Odé · desde 1980',
  sobre:
    'Fundado em 25 de abril de 1980, o Centro Cultural Família Àṣẹ Omos Odé é uma casa de axé dedicada a Odé/Oxóssi, Oxum e Obaluaê (Azauani). São 45 anos de história, acolhimento e respeito à ancestralidade — um espaço de fé, comunidade e tradição.',
  cor: '#1f66c2',
  loja_url: null as string | null,
  whatsapp: '5511976831500',
  endereco: 'Rua Cascata Alegre, 23 — Vila Espanhola, São Paulo — SP',
};

export function urlFotoGaleria(caminho: string): string {
  return `${envPublico.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/galeria/${caminho.split('/').map(encodeURIComponent).join('/')}`;
}

/** Dados da página inicial. Se o banco estiver fora do ar, o site abre com o conteúdo padrão. */
export async function carregarSite() {
  const db = criarClientePublico();
  try {
    const { data: org, error } = await db
      .from('organizacoes')
      .select('id, nome')
      .eq('slug', envPublico.NEXT_PUBLIC_ORG_SLUG)
      .single();
    if (error || !org) throw error ?? new Error('organização não encontrada');

    const [site, eventos, midia] = await Promise.all([
      db.from('site_config').select('*').eq('org_id', org.id).maybeSingle(),
      db.from('eventos').select('id, titulo, data, hora, observacao').eq('org_id', org.id).gte('data', hojeISO()).order('data').limit(8),
      db.from('midia').select('id, tipo, titulo, storage_path, url').eq('org_id', org.id).order('criado_em', { ascending: false }).limit(30),
    ]);
    const s = site.data;
    return {
      ok: true as const,
      orgId: org.id,
      site: {
        nome: org.nome,
        hero_titulo: s?.hero_titulo || SITE_PADRAO.hero_titulo,
        hero_subtitulo: s?.hero_subtitulo || SITE_PADRAO.hero_subtitulo,
        sobre: s?.sobre || SITE_PADRAO.sobre,
        cor: s?.cor || SITE_PADRAO.cor,
        loja_url: s?.loja_url ?? null,
        whatsapp: s?.whatsapp || SITE_PADRAO.whatsapp,
        endereco: s?.endereco || SITE_PADRAO.endereco,
      },
      eventos: eventos.data ?? [],
      fotos: (midia.data ?? []).filter((m) => m.tipo === 'foto' && m.storage_path),
      videos: (midia.data ?? []).filter((m) => m.tipo === 'video' && m.url),
    };
  } catch (e) {
    console.error('[site] banco indisponível, usando conteúdo padrão:', (e as Error)?.message);
    return { ok: false as const, orgId: null, site: SITE_PADRAO, eventos: [], fotos: [], videos: [] };
  }
}
