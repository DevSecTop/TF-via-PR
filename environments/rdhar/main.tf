locals {
  instance_types = {
    default = "t2.micro"
    test    = "t2.small"
  }
}

resource "aws_instance" "demo" {
  ami           = "ami-0557a15b87f6559cf" # ubuntu-jammy-22.04-amd64
  instance_type = local.instance_types[terraform.workspace]

  tags = {
    Terraform = terraform.workspace
  }
}
