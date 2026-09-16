# Bonus: Terraform to provision the Kubernetes cluster
#
# This is a starting point, not a turnkey script - provisioning a real
# managed cluster needs cloud credentials and billing, which isn't something
# to run from an automated assignment checker. Example shown for GKE; the
# same shape applies to EKS (aws_eks_cluster) or AKS (azurerm_kubernetes_cluster).
#
# Usage (after filling in variables.tf / a terraform.tfvars):
#   terraform init
#   terraform plan
#   terraform apply

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_container_cluster" "product_catalogue" {
  name     = "product-catalogue-cluster"
  location = var.region

  # Use a separately-managed node pool instead of the default one.
  remove_default_node_pool = true
  initial_node_count       = 1
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "product-catalogue-nodes"
  location   = var.region
  cluster    = google_container_cluster.product_catalogue.name
  node_count = var.node_count

  node_config {
    machine_type = var.machine_type
    disk_size_gb = 30
  }
}

output "cluster_name" {
  value = google_container_cluster.product_catalogue.name
}

output "kubeconfig_command" {
  value = "gcloud container clusters get-credentials ${google_container_cluster.product_catalogue.name} --region ${var.region} --project ${var.project_id}"
}
