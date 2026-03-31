resource "google_artifact_registry_repository" "images" {
  location      = var.region
  repository_id = "sunriseobx-images"
  format        = "DOCKER"
}
