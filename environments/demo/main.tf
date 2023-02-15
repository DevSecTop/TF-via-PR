locals {
  aws_region = {
    default = "us-east-1"
    develop = "us-east-2"
    staging = "ca-central-1"
  }

  instance_types = {
    default = "t2.micro"
    develop = "t3.micro"
    staging = "t2.small"
  }

  tags = {
    default = {
      Terraform = terraform.workspace
      Owner     = "rdhar"
    }
    develop = {
      Terraform = terraform.workspace
      Owner     = "rdhar"
    }
    staging = {
      Terraform = terraform.workspace
      Owner     = "rdhar"
    }
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "demo" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = local.instance_types[terraform.workspace]

  tags = merge({
    Name = "demo-${terraform.workspace}"
    }, local.tags[terraform.workspace]
  )
}
