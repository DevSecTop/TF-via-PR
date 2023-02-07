terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.53.0"
    }
  }
}

provider "aws" {
  profile = "learning-rdhar"
  region  = var.region
}

variable "region" {
  type        = string
  description = "AWS region where infrastructure will be based"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Environment where infrastructure will be allocated"
}

variable "instance_type" {
  type        = string
  description = "AWS instance type to be used"
  default     = "t2.micro"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "app" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type

  root_block_device {
    volume_size = 8 # GB
    volume_type = "gp2"
  }

  tags = {
    "Name"        = "${var.environment}-ubuntu-jammy"
    "Project"     = "learning-rdhar"
    "Environment" = var.environment
    "Managed"     = "terraform"
  }
}

resource "aws_eip" "app_eip" {
  tags = {
    "Name"        = "${var.environment}-ubuntu-jammy"
    "Project"     = "learning-rdhar"
    "Environment" = var.environment
    "Managed"     = "terraform"
  }
}

resource "aws_eip_association" "app_eip_assoc" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.app_eip.id
}
