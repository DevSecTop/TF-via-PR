variable "region" {
  type        = string
  description = "AWS region where infrastructure will be based"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Environment where infrastructure will be allocated"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}
