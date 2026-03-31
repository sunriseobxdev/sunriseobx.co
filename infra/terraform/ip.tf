resource "google_compute_global_address" "ingress_ip" {
  name = "sunriseobx-ip"
}

output "ingress_ip" {
  value = google_compute_global_address.ingress_ip.address
}
