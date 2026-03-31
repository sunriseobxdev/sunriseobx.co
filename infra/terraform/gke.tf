resource "google_container_cluster" "sunriseobx" {
  name     = "sunriseobx"
  location = var.zone

  initial_node_count       = 1
  remove_default_node_pool = true

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  deletion_protection = false
}

resource "google_container_node_pool" "default_pool" {
  name     = "default-pool"
  location = var.zone
  cluster  = google_container_cluster.sunriseobx.name

  node_count = 1

  autoscaling {
    min_node_count = 0
    max_node_count = 2
  }

  node_config {
    machine_type = var.gke_node_machine_type
    spot         = true

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    service_account = google_service_account.gke_sa.email

    taint {
      key    = "cloud.google.com/gke-spot"
      value  = "true"
      effect = "NO_SCHEDULE"
    }
  }
}
