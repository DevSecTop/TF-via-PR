terraform {
  required_version = "~> 1.0"

  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.60.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Stack     = basename(abspath(path.root)) # E.g., "sample_bucket".
      Terraform = terraform.workspace          # E.g., "default".
    }
  }
}
