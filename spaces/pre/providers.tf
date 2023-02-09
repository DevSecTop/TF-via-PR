terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
  backend "s3" {
    bucket         = "terraform-aws-rdhar"
    dynamodb_table = "terraform-aws-rdhar"
    region         = "us-east-1"      # AWS_REGION
    profile        = "learning-rdhar" # AWS_PROFILE
    # access_key   = "secret"         # AWS_ACCESS_KEY_ID
    # secret_key   = "secret"         # AWS_SECRET_ACCESS_KEY
  }
}

provider "aws" {
  region  = var.region       # AWS_REGION
  profile = "learning-rdhar" # AWS_PROFILE
}
