output "portal" {
  description = "Endereço do portal"
  value       = "http://127.0.0.1:${var.porta_web}"
}

output "grafana" {
  description = "Painel de monitoramento"
  value       = "http://127.0.0.1:${var.porta_grafana}"
}

output "prometheus" {
  description = "Métricas e alertas"
  value       = "http://127.0.0.1:${var.porta_prometheus}"
}
