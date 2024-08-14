terraform {
  required_version = "~> 1.8.0"

  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.62.0"
    }
  }
}

locals {
  tags = {
    default = {
      Environment = "Undefined"
    }
    dev = {
      Environment = "Development"
    }
    qa = {
      Environment = "Quality Assurance"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge({
      Stack     = basename(abspath(path.root))
      Terraform = terraform.workspace
      }, local.tags[terraform.workspace]
    )
  }
}
