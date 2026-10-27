variable "supabase_organizacao" {
  description = "ID da organização no Supabase (painel → Organization settings)"
  type        = string
}

variable "senha_banco" {
  description = "Senha forte do banco Postgres (guarde num cofre de senhas)"
  type        = string
  sensitive   = true
}

variable "url_site" {
  description = "Endereço público do portal (ex.: https://portal.seudominio.com.br)"
  type        = string
  validation {
    condition     = startswith(var.url_site, "https://")
    error_message = "Em produção o site precisa ser https://."
  }
}

variable "google_client_id" {
  description = "Client ID do Google OAuth (vazio = login Google desligado)"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Client Secret do Google OAuth"
  type        = string
  default     = ""
  sensitive   = true
}
