import { adicionarVideo, enviarFoto, excluirMidia } from '../acoes';
import { AppShell } from '@/components/AppShell';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import { urlFotoGaleria } from '@/lib/publico';
import { exigirAdmin } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

export default async function Galeria() {
  const { supabase } = await exigirAdmin();
  const { data: midia } = await supabase.from('midia').select('id, tipo, titulo, storage_path, url').order('criado_em', { ascending: false });
  const fotos = (midia ?? []).filter((m) => m.tipo === 'foto');
  const videos = (midia ?? []).filter((m) => m.tipo === 'video');

  return (
    <AppShell titulo="Administração" papel="admin" voltar="/app/admin" ativo="/app/admin">
      <div className="card">
        <h3>📸 Fotos ({fotos.length})</h3>
        {fotos.length ? (
          <div className="gal">
            {fotos.map((f) => (
              <div className="ph" key={f.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urlFotoGaleria(f.storage_path!)} alt={f.titulo || 'Foto'} />
                <form action={excluirMidia}>
                  <input type="hidden" name="id" value={f.id} />
                  <BotaoEnviar className="btn red small" confirmar="Excluir esta foto do site?">
                    ×
                  </BotaoEnviar>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <div className="muted">Nenhuma foto publicada.</div>
        )}
        <form action={enviarFoto} style={{ marginTop: 8 }}>
          <label className="f">
            <span>Adicionar foto (JPG, PNG ou WEBP, até 5 MB)</span>
            <input type="file" name="arquivo" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" required />
          </label>
          <label className="f">
            <span>Legenda (opcional)</span>
            <input name="titulo" maxLength={120} placeholder="Ex.: Ipetê da Oxum 2026" />
          </label>
          <BotaoEnviar className="btn small">+ Publicar foto</BotaoEnviar>
        </form>
        <div className="note">Publique só fotos de pessoas que autorizaram aparecer no site.</div>
      </div>

      <div className="card">
        <h3>🎥 Vídeos ({videos.length})</h3>
        {videos.map((v) => (
          <div className="item" key={v.id}>
            <div className="row between">
              <a className="s" href={v.url!} target="_blank" rel="noopener noreferrer">
                ▶ {v.titulo || v.url}
              </a>
              <form action={excluirMidia}>
                <input type="hidden" name="id" value={v.id} />
                <BotaoEnviar className="btn ghost small" confirmar="Excluir este vídeo?">
                  Excluir
                </BotaoEnviar>
              </form>
            </div>
          </div>
        ))}
        <form action={adicionarVideo} style={{ marginTop: 8 }}>
          <label className="f">
            <span>Link do vídeo (YouTube, Instagram etc. — começando com https://)</span>
            <input name="url" type="url" maxLength={500} required placeholder="https://..." />
          </label>
          <label className="f">
            <span>Título</span>
            <input name="titulo" maxLength={120} required placeholder="Ex.: Toque de Exu 2026" />
          </label>
          <BotaoEnviar className="btn small sec">+ Adicionar vídeo</BotaoEnviar>
        </form>
      </div>
      <div className="note">
        O que você publicar aqui aparece na <b>página inicial pública</b> (fotos e vídeos das festas).
      </div>
    </AppShell>
  );
}
