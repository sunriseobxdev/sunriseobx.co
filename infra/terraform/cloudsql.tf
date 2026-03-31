resource "google_sql_database_instance" "postgres" {
  name             = "sunriseobx-postgres"
  database_version = "POSTGRES_15"
  region           = var.region

  depends_on = [google_service_networking_connection.private_vpc]

  settings {
    tier = var.cloudsql_tier

    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = google_compute_network.vpc.id
      enable_private_path_for_google_cloud_services = true
    }

    backup_configuration {
      enabled = false
    }
  }

  deletion_protection = false
}

resource "google_sql_database" "db" {
  name     = var.db_name
  instance = google_sql_database_instance.postgres.name
}

resource "random_password" "db_password" {
  length  = 32
  special = false
}

resource "google_sql_user" "app" {
  name     = "sunriseobx-app"
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}

resource "google_secret_manager_secret" "db_password" {
  secret_id = "db-password"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}
