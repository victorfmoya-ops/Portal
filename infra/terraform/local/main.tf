# =====================================================================
# Receita Terraform — ambiente LOCAL do portal (Docker do próprio PC).
# Cria a mesma estrutura do docker-compose.yml: rede, imagem do portal,
# portal, agendador e monitoramento. Nada vai para a internet: portas só
# em 127.0.0.1. O banco (Supabase) continua pelo "npx supabase start".
#
#   cd infra/terraform/local
#   terraform init
#   terraform plan  -var-file=local.tfvars
#   terraform apply -var-file=local.tfvars   (pare o compose antes: mesmas portas)
# =====================================================================
terraform {
  required_version = ">= 1.6"
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.6"
    }
  }
}

provider "docker" {
  host = var.docker_host
}

locals {
  raiz    = abspath("${path.module}/../../..")
  rotulos = { projeto = "portal-ase", gerenciado_por = "terraform" }
}

resource "docker_network" "portal" {
  name = "portal-ase-tf"
  dynamic "labels" {
    for_each = local.rotulos
    content {
      label = labels.key
      value = labels.value
    }
  }
}

resource "docker_volume" "prometheus" {
  name = "portal-ase-tf-prometheus"
}

resource "docker_volume" "grafana" {
  name = "portal-ase-tf-grafana"
}

# ---------- Imagem do portal (build a partir do Dockerfile da raiz) ----------
resource "docker_image" "web" {
  name = "portal-ase-web:tf"
  build {
    context = local.raiz
    build_args = {
      NEXT_PUBLIC_SUPABASE_URL      = var.supabase_url_publica
      NEXT_PUBLIC_SUPABASE_ANON_KEY = var.supabase_anon_key
      NEXT_PUBLIC_SITE_URL          = "http://127.0.0.1:${var.porta_web}"
      NEXT_PUBLIC_ORG_SLUG          = var.org_slug
    }
  }
  triggers = {
    codigo = sha1(join("", [for f in fileset(local.raiz, "{app,components,lib}/**") : filesha1("${local.raiz}/${f}")]))
  }
}

resource "docker_container" "web" {
  name      = "portal-ase-tf-web"
  image     = docker_image.web.image_id
  restart   = "unless-stopped"
  read_only = true
  memory    = 512
  tmpfs     = { "/tmp" = "", "/app/.next/cache" = "uid=1001,gid=1001" }

  security_opts = ["no-new-privileges:true"]
  capabilities {
    drop = ["ALL"]
  }

  env = [
    "NEXT_PUBLIC_SUPABASE_URL=${var.supabase_url_publica}",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=${var.supabase_anon_key}",
    "NEXT_PUBLIC_SITE_URL=http://127.0.0.1:${var.porta_web}",
    "NEXT_PUBLIC_ORG_SLUG=${var.org_slug}",
    "SUPABASE_INTERNAL_URL=${var.supabase_url_interna}",
    "SUPABASE_SERVICE_ROLE_KEY=${var.supabase_service_role_key}",
    "CRON_SECRET=${var.cron_secret}",
    "METRICS_TOKEN=${var.metrics_token}",
    "RECAPTCHA_SITE_KEY=${var.recaptcha_site_key}",
    "RECAPTCHA_SECRET_KEY=${var.recaptcha_secret_key}",
  ]

  host {
    host = "host.docker.internal"
    ip   = "host-gateway"
  }

  ports {
    internal = 3000
    external = var.porta_web
    ip       = "127.0.0.1"
  }

  networks_advanced {
    name    = docker_network.portal.name
    aliases = ["web"]
  }

  healthcheck {
    test         = ["CMD", "wget", "-qO-", "http://127.0.0.1:3000/api/health"]
    interval     = "30s"
    timeout      = "5s"
    retries      = 3
    start_period = "20s"
  }

  dynamic "labels" {
    for_each = local.rotulos
    content {
      label = labels.key
      value = labels.value
    }
  }
}

# ---------- Agendador (automação das rotinas) ----------
resource "docker_container" "agendador" {
  name       = "portal-ase-tf-agendador"
  image      = "alpine:3.22"
  restart    = "unless-stopped"
  read_only  = true
  memory     = 32
  entrypoint = ["/bin/sh", "/rotinas.sh"]
  env        = ["CRON_SECRET=${var.cron_secret}", "PORTAL_URL=http://web:3000"]

  security_opts = ["no-new-privileges:true"]
  capabilities {
    drop = ["ALL"]
  }

  volumes {
    host_path      = "${local.raiz}/infra/agendador/rotinas.sh"
    container_path = "/rotinas.sh"
    read_only      = true
  }

  networks_advanced {
    name = docker_network.portal.name
  }

  depends_on = [docker_container.web]
}

# ---------- Monitoramento ----------
resource "docker_container" "blackbox" {
  name      = "portal-ase-tf-blackbox"
  image     = "prom/blackbox-exporter:v0.27.0"
  restart   = "unless-stopped"
  read_only = true
  memory    = 64

  volumes {
    host_path      = "${local.raiz}/infra/monitoramento/blackbox.yml"
    container_path = "/etc/blackbox_exporter/config.yml"
    read_only      = true
  }

  host {
    host = "host.docker.internal"
    ip   = "host-gateway"
  }

  networks_advanced {
    name    = docker_network.portal.name
    aliases = ["blackbox"]
  }
}

resource "docker_container" "prometheus" {
  name       = "portal-ase-tf-prometheus"
  image      = "prom/prometheus:v3.15.1"
  restart    = "unless-stopped"
  user       = "65534:65534"
  memory     = 256
  tmpfs      = { "/tmp" = "uid=65534,gid=65534" }
  entrypoint = ["/bin/sh", "-c"]
  command = [
    "printf '%s' \"$METRICS_TOKEN\" > /tmp/metrics_token && exec /bin/prometheus --config.file=/etc/prometheus/prometheus.yml --storage.tsdb.path=/prometheus --storage.tsdb.retention.time=15d"
  ]
  env = ["METRICS_TOKEN=${var.metrics_token}"]

  volumes {
    host_path      = "${local.raiz}/infra/monitoramento/prometheus.yml"
    container_path = "/etc/prometheus/prometheus.yml"
    read_only      = true
  }
  volumes {
    host_path      = "${local.raiz}/infra/monitoramento/alertas.yml"
    container_path = "/etc/prometheus/alertas.yml"
    read_only      = true
  }
  volumes {
    volume_name    = docker_volume.prometheus.name
    container_path = "/prometheus"
  }

  host {
    host = "host.docker.internal"
    ip   = "host-gateway"
  }

  ports {
    internal = 9090
    external = var.porta_prometheus
    ip       = "127.0.0.1"
  }

  networks_advanced {
    name    = docker_network.portal.name
    aliases = ["prometheus"]
  }
}

resource "docker_container" "grafana" {
  name    = "portal-ase-tf-grafana"
  image   = "grafana/grafana-oss:13.0.2"
  restart = "unless-stopped"
  user    = "472"
  memory  = 256
  env = [
    "GF_SECURITY_ADMIN_USER=admin",
    "GF_SECURITY_ADMIN_PASSWORD=${var.grafana_senha}",
    "GF_USERS_ALLOW_SIGN_UP=false",
    "GF_AUTH_ANONYMOUS_ENABLED=false",
    "GF_ANALYTICS_REPORTING_ENABLED=false",
  ]

  volumes {
    host_path      = "${local.raiz}/infra/monitoramento/grafana/provisionamento"
    container_path = "/etc/grafana/provisioning"
    read_only      = true
  }
  volumes {
    host_path      = "${local.raiz}/infra/monitoramento/grafana/paineis"
    container_path = "/var/lib/grafana/dashboards"
    read_only      = true
  }
  volumes {
    volume_name    = docker_volume.grafana.name
    container_path = "/var/lib/grafana"
  }

  ports {
    internal = 3000
    external = var.porta_grafana
    ip       = "127.0.0.1"
  }

  networks_advanced {
    name = docker_network.portal.name
  }

  depends_on = [docker_container.prometheus]
}
