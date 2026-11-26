
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "area_restrita_pessoas": {
                  Row: {
                    "area_id": string,"membro_id": string,"org_id": string,"papel": string
                  }
                  ComputedFields: never
                  Insert: {
                    "area_id": string,"membro_id": string,"org_id": string,"papel": string
                  }
                  Update: {
                    "area_id"?: string,"membro_id"?: string,"org_id"?: string,"papel"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "area_restrita_pessoas_area_id_fkey"
      columns: ["area_id"]
isOneToOne: false
      referencedRelation: "areas_restritas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "area_restrita_pessoas_membro_id_fkey"
      columns: ["membro_id"]
isOneToOne: false
      referencedRelation: "membros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "area_restrita_pessoas_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"areas_restritas": {
                  Row: {
                    "id": string,"nome": string,"org_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"nome": string,"org_id": string
                  }
                  Update: {
                    "id"?: string,"nome"?: string,"org_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "areas_restritas_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"caixa_lancamentos": {
                  Row: {
                    "categoria": string | null,"criado_em": string,"criado_por": string | null,"data": string,"descricao": string,"id": string,"org_id": string,"tipo": string,"valor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "categoria"?: string | null,"criado_em"?: string,"criado_por"?: string | null,"data"?: string,"descricao": string,"id"?: string,"org_id": string,"tipo": string,"valor": number
                  }
                  Update: {
                    "categoria"?: string | null,"criado_em"?: string,"criado_por"?: string | null,"data"?: string,"descricao"?: string,"id"?: string,"org_id"?: string,"tipo"?: string,"valor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "caixa_lancamentos_criado_por_fkey"
      columns: ["criado_por"]
isOneToOne: false
      referencedRelation: "membros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "caixa_lancamentos_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"comprovantes": {
                  Row: {
                    "enviado_em": string,"id": string,"membro_id": string,"mime": string,"org_id": string,"referencia_id": string,"remover_em": string,"storage_path": string,"tamanho": number,"tipo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "enviado_em"?: string,"id"?: string,"membro_id": string,"mime": string,"org_id": string,"referencia_id": string,"remover_em"?: string,"storage_path": string,"tamanho": number,"tipo": string
                  }
                  Update: {
                    "enviado_em"?: string,"id"?: string,"membro_id"?: string,"mime"?: string,"org_id"?: string,"referencia_id"?: string,"remover_em"?: string,"storage_path"?: string,"tamanho"?: number,"tipo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comprovantes_membro_id_fkey"
      columns: ["membro_id"]
isOneToOne: false
      referencedRelation: "membros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comprovantes_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"consentimentos": {
                  Row: {
                    "aceito_em": string,"id": string,"membro_id": string,"org_id": string,"versao": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aceito_em"?: string,"id"?: string,"membro_id": string,"org_id": string,"versao": string
                  }
                  Update: {
                    "aceito_em"?: string,"id"?: string,"membro_id"?: string,"org_id"?: string,"versao"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "consentimentos_membro_id_fkey"
      columns: ["membro_id"]
isOneToOne: false
      referencedRelation: "membros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consentimentos_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"contribuicoes_festa": {
                  Row: {
                    "data_pagamento": string | null,"decidido_em": string | null,"decidido_por": string | null,"festa_id": string,"id": string,"membro_id": string,"motivo_rejeicao": string | null,"org_id": string,"status": string,"valor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "data_pagamento"?: string | null,"decidido_em"?: string | null,"decidido_por"?: string | null,"festa_id": string,"id"?: string,"membro_id": string,"motivo_rejeicao"?: string | null,"org_id": string,"status"?: string,"valor": number
                  }
                  Update: {
                    "data_pagamento"?: string | null,"decidido_em"?: string | null,"decidido_por"?: string | null,"festa_id"?: string,"id"?: string,"membro_id"?: string,"motivo_rejeicao"?: string | null,"org_id"?: string,"status"?: string,"valor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "contribuicoes_festa_decidido_por_fkey"
      columns: ["decidido_por"]
isOneToOne: false
      referencedRelation: "membros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contribuicoes_festa_festa_id_fkey"
      columns: ["festa_id"]
isOneToOne: false
      referencedRelation: "festas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contribuicoes_festa_membro_id_fkey"
      columns: ["membro_id"]
isOneToOne: false
      referencedRelation: "membros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contribuicoes_festa_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"equipes": {
                  Row: {
                    "arrecadacao": boolean,"coordenador_id": string | null,"criado_em": string,"descricao": string | null,"id": string,"nome": string,"org_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "arrecadacao"?: boolean,"coordenador_id"?: string | null,"criado_em"?: string,"descricao"?: string | null,"id"?: string,"nome": string,"org_id": string
                  }
                  Update: {
                    "arrecadacao"?: boolean,"coordenador_id"?: string | null,"criado_em"?: string,"descricao"?: string | null,"id"?: string,"nome"?: string,"org_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "equipes_coordenador_id_fkey"
      columns: ["coordenador_id"]
isOneToOne: false
      referencedRelation: "membros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "equipes_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"escolhas_limpeza": {
                  Row: {
                    "dia": string,"escolhido_em": string,"id": string,"membro_id": string,"org_id": string,"rodada_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "dia": string,"escolhido_em"?: string,"id"?: string,"membro_id": string,"org_id": string,"rodada_id": string
                  }
                  Update: {
                    "dia"?: string,"escolhido_em"?: string,"id"?: string,"membro_id"?: string,"org_id"?: string,"rodada_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "escolhas_limpeza_membro_id_fkey"
      columns: ["membro_id"]
isOneToOne: false
      referencedRelation: "membros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "escolhas_limpeza_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "escolhas_limpeza_rodada_id_fkey"
      columns: ["rodada_id"]
isOneToOne: false
      referencedRelation: "rodadas"
      referencedColumns: ["id"]
    }
                  ]
                },"eventos": {
                  Row: {
                    "criado_em": string,"data": string,"hora": string | null,"id": string,"observacao": string | null,"org_id": string,"publico": boolean,"titulo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"data": string,"hora"?: string | null,"id"?: string,"observacao"?: string | null,"org_id": string,"publico"?: boolean,"titulo": string
                  }
                  Update: {
                    "criado_em"?: string,"data"?: string,"hora"?: string | null,"id"?: string,"observacao"?: string | null,"org_id"?: string,"publico"?: boolean,"titulo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "eventos_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"festa_compras": {
                  Row: {
                    "comprado": boolean,"criado_em": string,"festa_id": string,"id": string,"item": string,"org_id": string,"quantidade": number,"valor_unitario": number
                  }
                  ComputedFields: never
                  Insert: {
                    "comprado"?: boolean,"criado_em"?: string,"festa_id": string,"id"?: string,"item": string,"org_id": string,"quantidade"?: number,"valor_unitario": number
                  }
                  Update: {
                    "comprado"?: boolean,"criado_em"?: string,"festa_id"?: string,"id"?: string,"item"?: string,"org_id"?: string,"quantidade"?: number,"valor_unitario"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "festa_compras_festa_id_fkey"
      columns: ["festa_id"]
isOneToOne: false
      referencedRelation: "festas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "festa_compras_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"festa_tarefas": {
                  Row: {
                    "criado_em": string,"descricao": string,"equipe_id": string,"feito": boolean,"feito_em": string | null,"festa_id": string,"id": string,"org_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"descricao": string,"equipe_id": string,"feito"?: boolean,"feito_em"?: string | null,"festa_id": string,"id"?: string,"org_id": string
                  }
                  Update: {
                    "criado_em"?: string,"descricao"?: string,"equipe_id"?: string,"feito"?: boolean,"feito_em"?: string | null,"festa_id"?: string,"id"?: string,"org_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "festa_tarefas_equipe_id_fkey"
      columns: ["equipe_id"]
isOneToOne: false
      referencedRelation: "equipes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "festa_tarefas_festa_id_fkey"
      columns: ["festa_id"]
isOneToOne: false
      referencedRelation: "festas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "festa_tarefas_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"festas": {
                  Row: {
                    "criado_em": string,"data": string,"id": string,"nome": string,"org_id": string,"valor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"data": string,"id"?: string,"nome": string,"org_id": string,"valor": number
                  }
                  Update: {
                    "criado_em"?: string,"data"?: string,"id"?: string,"nome"?: string,"org_id"?: string,"valor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "festas_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"fichas": {
                  Row: {
                    "atualizado_em": string,"data_cadastro": string | null,"dt_1ano": string | null,"dt_3anos": string | null,"dt_5anos": string | null,"dt_7anos": string | null,"dt_iniciacao": string | null,"endereco": string | null,"ere": string | null,"iniciado": boolean,"membro_id": string,"org_id": string,"orisa": string | null,"telefone_emergencia": string | null,"whatsapp": string | null,"zelador": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "atualizado_em"?: string,"data_cadastro"?: string | null,"dt_1ano"?: string | null,"dt_3anos"?: string | null,"dt_5anos"?: string | null,"dt_7anos"?: string | null,"dt_iniciacao"?: string | null,"endereco"?: string | null,"ere"?: string | null,"iniciado"?: boolean,"membro_id": string,"org_id": string,"orisa"?: string | null,"telefone_emergencia"?: string | null,"whatsapp"?: string | null,"zelador"?: string | null
                  }
                  Update: {
                    "atualizado_em"?: string,"data_cadastro"?: string | null,"dt_1ano"?: string | null,"dt_3anos"?: string | null,"dt_5anos"?: string | null,"dt_7anos"?: string | null,"dt_iniciacao"?: string | null,"endereco"?: string | null,"ere"?: string | null,"iniciado"?: boolean,"membro_id"?: string,"org_id"?: string,"orisa"?: string | null,"telefone_emergencia"?: string | null,"whatsapp"?: string | null,"zelador"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "fichas_membro_id_fkey"
      columns: ["membro_id"]
isOneToOne: true
      referencedRelation: "membros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fichas_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"funcao_responsaveis": {
                  Row: {
                    "funcao_id": string,"membro_id": string,"org_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "funcao_id": string,"membro_id": string,"org_id": string
                  }
                  Update: {
                    "funcao_id"?: string,"membro_id"?: string,"org_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "funcao_responsaveis_funcao_id_fkey"
      columns: ["funcao_id"]
isOneToOne: false
      referencedRelation: "funcoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "funcao_responsaveis_membro_id_fkey"
      columns: ["membro_id"]
isOneToOne: false
      referencedRelation: "membros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "funcao_responsaveis_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"funcoes": {
                  Row: {
                    "criado_em": string,"data": string,"hora": string | null,"id": string,"obrigatorio": boolean,"org_id": string,"referencia": string | null,"titulo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"data": string,"hora"?: string | null,"id"?: string,"obrigatorio"?: boolean,"org_id": string,"referencia"?: string | null,"titulo": string
                  }
                  Update: {
                    "criado_em"?: string,"data"?: string,"hora"?: string | null,"id"?: string,"obrigatorio"?: boolean,"org_id"?: string,"referencia"?: string | null,"titulo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "funcoes_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"grupos": {
                  Row: {
                    "id": string,"nome": string | null,"numero": number,"org_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"nome"?: string | null,"numero": number,"org_id": string
                  }
                  Update: {
                    "id"?: string,"nome"?: string | null,"numero"?: number,"org_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "grupos_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"licoes": {
                  Row: {
                    "atualizado_em": string,"autor_cargo": string | null,"autor_id": string | null,"autor_nome": string,"categoria": string,"conteudo": string,"criado_em": string,"id": string,"midia_url": string | null,"org_id": string,"titulo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "atualizado_em"?: string,"autor_cargo"?: string | null,"autor_id"?: string | null,"autor_nome": string,"categoria": string,"conteudo": string,"criado_em"?: string,"id"?: string,"midia_url"?: string | null,"org_id": string,"titulo": string
                  }
                  Update: {
                    "atualizado_em"?: string,"autor_cargo"?: string | null,"autor_id"?: string | null,"autor_nome"?: string,"categoria"?: string,"conteudo"?: string,"criado_em"?: string,"id"?: string,"midia_url"?: string | null,"org_id"?: string,"titulo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "licoes_autor_id_fkey"
      columns: ["autor_id"]
isOneToOne: false
      referencedRelation: "membros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "licoes_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"locais": {
                  Row: {
                    "ativo": boolean,"id": string,"nome": string,"ordem": number,"org_id": string,"restrito": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"id"?: string,"nome": string,"ordem"?: number,"org_id": string,"restrito"?: boolean
                  }
                  Update: {
                    "ativo"?: boolean,"id"?: string,"nome"?: string,"ordem"?: number,"org_id"?: string,"restrito"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "locais_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"log_auditoria": {
                  Row: {
                    "acao": string,"alvo": string | null,"criado_em": string,"detalhes": NonNullable<Json>,"id": number,"membro_id": string | null,"org_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "acao": string,"alvo"?: string | null,"criado_em"?: string,"detalhes"?: NonNullable<Json>,"id"?: never,"membro_id"?: string | null,"org_id"?: string | null
                  }
                  Update: {
                    "acao"?: string,"alvo"?: string | null,"criado_em"?: string,"detalhes"?: NonNullable<Json>,"id"?: never,"membro_id"?: string | null,"org_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "log_auditoria_membro_id_fkey"
      columns: ["membro_id"]
isOneToOne: false
      referencedRelation: "membros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "log_auditoria_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"membros": {
                  Row: {
                    "aniversario_dia": number | null,"aniversario_mes": number | null,"atualizado_em": string,"cargo": string | null,"criado_em": string,"email": string,"equipe_id": string | null,"grupo_id": string | null,"id": string,"nome": string,"org_id": string,"papel": string,"status": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "aniversario_dia"?: number | null,"aniversario_mes"?: number | null,"atualizado_em"?: string,"cargo"?: string | null,"criado_em"?: string,"email": string,"equipe_id"?: string | null,"grupo_id"?: string | null,"id"?: string,"nome": string,"org_id": string,"papel"?: string,"status"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "aniversario_dia"?: number | null,"aniversario_mes"?: number | null,"atualizado_em"?: string,"cargo"?: string | null,"criado_em"?: string,"email"?: string,"equipe_id"?: string | null,"grupo_id"?: string | null,"id"?: string,"nome"?: string,"org_id"?: string,"papel"?: string,"status"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "membros_equipe_id_fkey"
      columns: ["equipe_id"]
isOneToOne: false
      referencedRelation: "equipes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membros_grupo_id_fkey"
      columns: ["grupo_id"]
isOneToOne: false
      referencedRelation: "grupos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membros_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"mensalidades": {
                  Row: {
                    "competencia": string,"criado_em": string,"data_pagamento": string | null,"decidido_em": string | null,"decidido_por": string | null,"id": string,"membro_id": string,"motivo_rejeicao": string | null,"org_id": string,"status": string,"valor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "competencia": string,"criado_em"?: string,"data_pagamento"?: string | null,"decidido_em"?: string | null,"decidido_por"?: string | null,"id"?: string,"membro_id": string,"motivo_rejeicao"?: string | null,"org_id": string,"status"?: string,"valor": number
                  }
                  Update: {
                    "competencia"?: string,"criado_em"?: string,"data_pagamento"?: string | null,"decidido_em"?: string | null,"decidido_por"?: string | null,"id"?: string,"membro_id"?: string,"motivo_rejeicao"?: string | null,"org_id"?: string,"status"?: string,"valor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "mensalidades_decidido_por_fkey"
      columns: ["decidido_por"]
isOneToOne: false
      referencedRelation: "membros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mensalidades_membro_id_fkey"
      columns: ["membro_id"]
isOneToOne: false
      referencedRelation: "membros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mensalidades_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"midia": {
                  Row: {
                    "criado_em": string,"id": string,"org_id": string,"publicado": boolean,"storage_path": string | null,"tipo": string,"titulo": string | null,"url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"id"?: string,"org_id": string,"publicado"?: boolean,"storage_path"?: string | null,"tipo": string,"titulo"?: string | null,"url"?: string | null
                  }
                  Update: {
                    "criado_em"?: string,"id"?: string,"org_id"?: string,"publicado"?: boolean,"storage_path"?: string | null,"tipo"?: string,"titulo"?: string | null,"url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "midia_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"organizacoes": {
                  Row: {
                    "criado_em": string,"id": string,"nome": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"id"?: string,"nome": string,"slug": string
                  }
                  Update: {
                    "criado_em"?: string,"id"?: string,"nome"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"rodada_locais": {
                  Row: {
                    "concluido_em": string | null,"concluido_por": string | null,"local_id": string,"org_id": string,"rodada_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "concluido_em"?: string | null,"concluido_por"?: string | null,"local_id": string,"org_id": string,"rodada_id": string
                  }
                  Update: {
                    "concluido_em"?: string | null,"concluido_por"?: string | null,"local_id"?: string,"org_id"?: string,"rodada_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rodada_locais_concluido_por_fkey"
      columns: ["concluido_por"]
isOneToOne: false
      referencedRelation: "membros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rodada_locais_local_id_fkey"
      columns: ["local_id"]
isOneToOne: false
      referencedRelation: "locais"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rodada_locais_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rodada_locais_rodada_id_fkey"
      columns: ["rodada_id"]
isOneToOne: false
      referencedRelation: "rodadas"
      referencedColumns: ["id"]
    }
                  ]
                },"rodadas": {
                  Row: {
                    "fim": string,"grupo_id": string,"id": string,"inicio": string,"numero": number,"org_id": string,"prazo_escolha": string
                  }
                  ComputedFields: never
                  Insert: {
                    "fim": string,"grupo_id": string,"id"?: string,"inicio": string,"numero": number,"org_id": string,"prazo_escolha": string
                  }
                  Update: {
                    "fim"?: string,"grupo_id"?: string,"id"?: string,"inicio"?: string,"numero"?: number,"org_id"?: string,"prazo_escolha"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rodadas_grupo_id_fkey"
      columns: ["grupo_id"]
isOneToOne: false
      referencedRelation: "grupos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rodadas_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"site_config": {
                  Row: {
                    "atualizado_em": string,"cor": string,"endereco": string | null,"hero_subtitulo": string,"hero_titulo": string,"loja_url": string | null,"meta_limpezas_ano": number,"org_id": string,"sobre": string,"valor_mensalidade": number,"whatsapp": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "atualizado_em"?: string,"cor"?: string,"endereco"?: string | null,"hero_subtitulo"?: string,"hero_titulo"?: string,"loja_url"?: string | null,"meta_limpezas_ano"?: number,"org_id": string,"sobre"?: string,"valor_mensalidade"?: number,"whatsapp"?: string | null
                  }
                  Update: {
                    "atualizado_em"?: string,"cor"?: string,"endereco"?: string | null,"hero_subtitulo"?: string,"hero_titulo"?: string,"loja_url"?: string | null,"meta_limpezas_ano"?: number,"org_id"?: string,"sobre"?: string,"valor_mensalidade"?: number,"whatsapp"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "site_config_org_id_fkey"
      columns: ["org_id"]
isOneToOne: true
      referencedRelation: "organizacoes"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "alternar_compra":
{ Args: { "p_id": string }; Returns: undefined
                           },
"alternar_tarefa":
{ Args: { "p_id": string }; Returns: undefined
                           },
"aniversariantes":
{ Args: Record<PropertyKey, never>; Returns: {
              "dia": number,"mes": number,"nome": string
            }[]
                           },
"aplicar_rateio":
{ Args: { "p_arredondar"?: boolean,"p_festa": string }; Returns: Json
                           },
"auditar":
{ Args: { "p_acao": string,"p_alvo": string,"p_detalhes"?: Json }; Returns: undefined
                           },
"colegas_do_grupo":
{ Args: Record<PropertyKey, never>; Returns: {
              "nome": string,"sou_eu": boolean
            }[]
                           },
"decidir_pagamento":
{ Args: { "p_decisao": string,"p_id": string,"p_motivo"?: string,"p_tipo": string }; Returns: undefined
                           },
"eh_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"eh_admin_da":
{ Args: { "p_org": string }; Returns: boolean
                           },
"eh_coordenador":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"eh_coordenador_arrecadacao":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"eh_coordenador_da":
{ Args: { "p_equipe": string }; Returns: boolean
                           },
"enviar_comprovante":
{ Args: { "p_data_pagamento": string,"p_referencia": string,"p_storage_path": string,"p_tipo": string }; Returns: undefined
                           },
"equipes_visao":
{ Args: { "p_festa"?: string }; Returns: {
              "arrecadacao": boolean,"coordenador_id": string,"coordenador_nome": string,"descricao": string,"feitas": number,"id": string,"membros": number,"nome": string,"tarefas": number
            }[]
                           },
"escolhas_da_rodada":
{ Args: { "p_rodada": string }; Returns: {
              "dia": string,"nome": string
            }[]
                           },
"escolher_dia_limpeza":
{ Args: { "p_dia": string,"p_rodada": string }; Returns: undefined
                           },
"excluir_compra":
{ Args: { "p_id": string }; Returns: undefined
                           },
"excluir_licao":
{ Args: { "p_id": string }; Returns: undefined
                           },
"excluir_tarefa":
{ Args: { "p_id": string }; Returns: undefined
                           },
"filhos_ativos":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"gerar_mensalidades":
{ Args: { "p_competencia"?: string }; Returns: number
                           },
"gerar_rodizio":
{ Args: { "p_inicio": string,"p_intervalo"?: number,"p_quantidade"?: number }; Returns: number
                           },
"limpezas_por_filho":
{ Args: { "p_ano"?: number }; Returns: {
              "grupo": number,"membro_id": string,"meta": number,"nome": string,"total": number
            }[]
                           },
"membro_atual_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"meu_grupo":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"minha_org":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"minhas_limpezas_no_ano":
{ Args: { "p_ano"?: number }; Returns: number
                           },
"pessoas_da_equipe":
{ Args: { "p_equipe": string }; Returns: {
              "id": string,"nome": string
            }[]
                           },
"pode_arrecadar":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"pode_ensinar":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"registrar_consentimento":
{ Args: { "p_versao": string }; Returns: undefined
                           },
"salvar_compra":
{ Args: { "p_festa": string,"p_item": string,"p_quantidade": number,"p_valor_unitario": number }; Returns: string
                           },
"salvar_licao":
{ Args: { "p_categoria": string,"p_conteudo": string,"p_id": string,"p_midia_url"?: string,"p_titulo": string }; Returns: string
                           },
"salvar_tarefa":
{ Args: { "p_descricao": string,"p_equipe": string,"p_festa": string }; Returns: string
                           },
"vincular_meu_cadastro":
{ Args: Record<PropertyKey, never>; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
