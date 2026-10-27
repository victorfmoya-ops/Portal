output "project_ref" {
  description = "Identificador do projeto (usado no supabase link)"
  value       = supabase_project.portal.id
}

output "supabase_url" {
  description = "URL do Supabase para NEXT_PUBLIC_SUPABASE_URL"
  value       = "https://${supabase_project.portal.id}.supabase.co"
}
