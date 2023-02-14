locals {
  aws_region = {
    default = "us-east-1"
    staging = "ca-central-1"
  }

  instance_types = {
    default = "t2.micro"
    staging = "t3.micro"
  }

  tags = {
    default = {
      Terraform = terraform.workspace
      Owner     = "rdhar"
    }
    staging = {
      Terraform = terraform.workspace
      Owner     = "rdhar"
    }
  }
}

resource "aws_instance" "demo" {
  ami           = "ami-0557a15b87f6559cf" # ubuntu-jammy-22.04-amd64
  instance_type = local.instance_types[terraform.workspace]

  tags = merge({
    Name    = "demo"
    Project = "learning-rdhar"
    }, local.tags[terraform.workspace]
  )
}
