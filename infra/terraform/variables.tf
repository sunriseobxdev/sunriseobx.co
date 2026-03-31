variable "project_id" {
  default = "sunriseobx-proj"
}

variable "region" {
  default = "us-central1"
}

variable "zone" {
  default = "us-central1-a"
}

variable "gke_node_machine_type" {
  default = "e2-small"
}

variable "cloudsql_tier" {
  default = "db-f1-micro"
}

variable "redis_memory_size_gb" {
  default = 1
}

variable "db_name" {
  default = "sunriseobx"
}
