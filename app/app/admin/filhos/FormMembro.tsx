import Link from 'next/link';
import { salvarMembro } from '../acoes';
import { BotaoEnviar } from '@/components/BotaoEnviar';
import type { Database } from '@/lib/database.types';

type MembroLinha = Database['public']['Tables']['membros']['Row'];
type FichaLinha = Database['public']['Tables']['fichas']['Row'];

/** Ficha completa (Cadastro Geral + Cadastro de filho), igual ao protótipo. */
export function FormMembro({
  membro,
  ficha,
  grupos,
}: {
  membro?: MembroLinha | null;
  ficha?: FichaLinha | null;
  grupos: { id: string; numero: number }[];
}) {
  const v = (x: string | number | null | undefined) => (x == null ? '' : String(x));
  return (
    <form action={salvarMembro} className="card">
      <h3>{membro ? `Ficha — ${membro.nome}` : 'Novo cadastro'}</h3>
      {membro ? <input type="hidden" name="id" value={membro.id} /> : null}

      <div className="note" style={{ marginTop: 0, marginBottom: 10 }}>
        <b>Acesso ao portal</b>
      </div>
      <label className="f">
        <span>Nome</span>
        <input name="nome" defaultValue={v(membro?.nome)} maxLength={120} required />
      </label>
      <label className="f">
        <span>E-mail (o mesmo que a pessoa usa no Google ou no primeiro acesso)</span>
        <input name="email" type="email" defaultValue={v(membro?.email)} maxLength={254} required />
      </label>
      <div className="two">
        <label className="f">
          <span>Grupo</span>
          <select name="grupo_id" defaultValue={v(membro?.grupo_id)}>
            <option value="">— sem grupo —</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                Grupo {g.numero}
              </option>
            ))}
          </select>
        </label>
        <label className="f">
          <span>Papel</span>
          <select name="papel" defaultValue={membro?.papel ?? 'filho'}>
            <option value="filho">Filho(a)</option>
            <option value="admin">Administrador(a)</option>
          </select>
        </label>
      </div>
      <div className="two">
        <label className="f">
          <span>Situação</span>
          <select name="status" defaultValue={membro?.status ?? 'ativo'}>
            <option value="ativo">Ativo</option>
            <option value="bloqueado">Bloqueado (sem acesso)</option>
          </select>
        </label>
        <label className="f">
          <span>Aniversário (dia/mês)</span>
          <span style={{ display: 'flex', gap: 6, fontWeight: 400 }}>
            <input name="aniversario_dia" type="number" min={1} max={31} placeholder="dia" defaultValue={v(membro?.aniversario_dia)} />
            <input name="aniversario_mes" type="number" min={1} max={12} placeholder="mês" defaultValue={v(membro?.aniversario_mes)} />
          </span>
        </label>
      </div>

      <div className="note" style={{ marginBottom: 10 }}>
        <b>Cadastro Geral</b>
      </div>
      <label className="f">
        <span>Data do cadastro</span>
        <input type="date" name="data_cadastro" defaultValue={v(ficha?.data_cadastro)} />
      </label>
      <label className="f">
        <span>Endereço</span>
        <input name="endereco" maxLength={200} defaultValue={v(ficha?.endereco)} />
      </label>
      <div className="two">
        <label className="f">
          <span>WhatsApp</span>
          <input name="whatsapp" maxLength={30} defaultValue={v(ficha?.whatsapp)} />
        </label>
        <label className="f">
          <span>Telefone de emergência</span>
          <input name="telefone_emergencia" maxLength={30} defaultValue={v(ficha?.telefone_emergencia)} />
        </label>
      </div>

      <div className="note" style={{ marginBottom: 10 }}>
        <b>Cadastro de filho</b>
      </div>
      <label className="f">
        <span>Zelador(a)</span>
        <input name="zelador" maxLength={120} defaultValue={v(ficha?.zelador)} />
      </label>
      <div className="two">
        <label className="f">
          <span>Òrìṣà</span>
          <input name="orisa" maxLength={80} defaultValue={v(ficha?.orisa)} />
        </label>
        <label className="f">
          <span>Erê (se tiver)</span>
          <input name="ere" maxLength={80} defaultValue={v(ficha?.ere)} />
        </label>
      </div>
      <label className="inline">
        <input type="checkbox" name="iniciado" defaultChecked={Boolean(ficha?.iniciado)} /> Iniciado(a)
      </label>
      <label className="f">
        <span>Data de iniciação</span>
        <input type="date" name="dt_iniciacao" defaultValue={v(ficha?.dt_iniciacao)} />
      </label>
      <div className="two">
        <label className="f">
          <span>01 ano</span>
          <input type="date" name="dt_1ano" defaultValue={v(ficha?.dt_1ano)} />
        </label>
        <label className="f">
          <span>03 anos</span>
          <input type="date" name="dt_3anos" defaultValue={v(ficha?.dt_3anos)} />
        </label>
      </div>
      <div className="two">
        <label className="f">
          <span>05 anos</span>
          <input type="date" name="dt_5anos" defaultValue={v(ficha?.dt_5anos)} />
        </label>
        <label className="f">
          <span>07 anos</span>
          <input type="date" name="dt_7anos" defaultValue={v(ficha?.dt_7anos)} />
        </label>
      </div>
      <div className="btn-row">
        <Link className="btn ghost" href="/app/admin/filhos">
          Cancelar
        </Link>
        <BotaoEnviar>Salvar</BotaoEnviar>
      </div>
    </form>
  );
}
