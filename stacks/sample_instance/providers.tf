terraform {
  required_version = "~> 1.0"

  backend "s3" {
    bucket = "tmp-workflow-tfstates"
    key    = "sample_instance.tfstate"
    region = "us-east-1"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.60.0"
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
    stg = {
      Environment = "Staging"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge({
      Stack     = basename(abspath(path.root)) # E.g., "sample_instance".
      Terraform = terraform.workspace          # E.g., "default".
      }, local.tags[terraform.workspace]
    )
  }
}
