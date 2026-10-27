# =====================================================================
# Receita Terraform — PRODUÇÃO (Supabase na nuvem).
# ⚠️ NÃO FOI APLICADA. Criar recursos na nuvem exige a autorização do
#    responsável (pode gerar custo). Só "terraform validate" foi executado.
#
# O que ela cria quando aplicada:
#   - o projeto Supabase (banco + login + arquivos) na região de São Paulo;
#   - as configurações de login: URL do site, redirecionamentos, confirmação
#     de e-mail e o provedor Google.
# As migrations (supabase/migrations) são aplicadas depois com:
#   npx supabase link --project-ref <ref> ; npx supabase db push
# =====================================================================
terraform {
  required_version = ">= 1.6"
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.5"
    }
  }
}

provider "supabase" {
  # token pessoal do Supabase (Account → Access Tokens), via variável de ambiente
  # SUPABASE_ACCESS_TOKEN — nunca escreva o token neste arquivo.
}

resource "supabase_project" "portal" {
  organization_id   = var.supabase_organizacao
  name              = "portal-familia-ase"
  database_password = var.senha_banco
  region            = "sa-east-1"

  lifecycle {
    # o Terraform não deve recriar (apagar!) o banco por mudança de senha
    ignore_changes  = [database_password]
    prevent_destroy = true
  }
}

resource "supabase_settings" "portal" {
  project_ref = supabase_project.portal.id

  auth = jsonencode({
    site_url                                          = var.url_site
    uri_allow_list                                    = "${var.url_site}/**"
    mailer_autoconfirm                                = false # exige confirmação de e-mail (segurança do vínculo)
    password_min_length                               = 8
    password_required_characters                      = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789"
    external_google_enabled                           = var.google_client_id != ""
    external_google_client_id                         = var.google_client_id
    external_google_secret                            = var.google_client_secret
    security_update_password_require_reauthentication = true
  })

  api = jsonencode({
    db_schema            = "public"
    db_extra_search_path = "public,extensions"
    max_rows             = 1000
  })
}
