variable "docker_host" {
  description = "Endereço do Docker (Windows/Docker Desktop: npipe:////./pipe/docker_engine; Linux: unix:///var/run/docker.sock)"
  type        = string
  default     = "unix:///var/run/docker.sock"
}

variable "org_slug" {
  description = "Identificador da casa no banco"
  type        = string
  default     = "omos-ode"
}

variable "supabase_url_publica" {
  description = "URL do Supabase vista pelo navegador"
  type        = string
  default     = "http://127.0.0.1:55421"
}

variable "supabase_url_interna" {
  description = "URL do Supabase vista de dentro do container"
  type        = string
  default     = "http://host.docker.internal:55421"
}

variable "supabase_anon_key" {
  description = "Chave pública (anon) do Supabase"
  type        = string
  sensitive   = true
}

variable "supabase_service_role_key" {
  description = "Chave de serviço do Supabase (segredo)"
  type        = string
  sensitive   = true
}

variable "cron_secret" {
  description = "Token das rotinas automáticas (mín. 16 caracteres)"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.cron_secret) >= 16
    error_message = "O cron_secret precisa ter pelo menos 16 caracteres."
  }
}

variable "metrics_token" {
  description = "Token do Prometheus para ler /api/metrics"
  type        = string
  sensitive   = true
}

variable "grafana_senha" {
  description = "Senha do admin do Grafana"
  type        = string
  sensitive   = true
}

variable "porta_web" {
  type    = number
  default = 3020
}

variable "porta_prometheus" {
  type    = number
  default = 9096
}

variable "porta_grafana" {
  type    = number
  default = 3006
}
