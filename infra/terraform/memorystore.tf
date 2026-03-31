resource "google_redis_instance" "redis" {
  name           = "sunriseobx-redis"
  tier           = "BASIC"
  memory_size_gb = var.redis_memory_size_gb
  region         = var.region

  redis_version = "REDIS_7_0"

  authorized_network = google_compute_network.vpc.id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"

  depends_on = [google_service_networking_connection.private_vpc]
}
