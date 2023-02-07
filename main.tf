terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
  backend "s3" {
    bucket         = "terraform-aws-rdhar"
    dynamodb_table = "terraform-aws-rdhar"
    key            = "tfstates/terraform.tfstate"
    profile        = "learning-rdhar"
    region         = "us-east-1"
  }
}

provider "aws" {
  profile = "learning-rdhar"
  region  = var.region
}

resource "aws_dynamodb_table" "tfstate_lock" {
  name           = "terraform-aws-rdhar"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    "Project" = "learning-rdhar"
    "Managed" = "terraform"
  }

  lifecycle {
    prevent_destroy = true
  }
}

module "ec2_web" {
  source       = "./modules/ec2"
  environment  = var.environment
  role         = "web"
  instance_ami = data.aws_ami.ubuntu.id
}

module "ec2_worker" {
  source       = "./modules/ec2"
  environment  = var.environment
  role         = "worker"
  instance_ami = data.aws_ami.ubuntu.id
}

module "vpc" {
  source      = "./modules/vpc"
  environment = var.environment
  vpc_cidr    = "10.0.0.0/17" # VPC peering between public and private subnets
}
