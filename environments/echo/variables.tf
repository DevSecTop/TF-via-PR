locals {
  aws_region = {
    default = "us-east-2"
  }

  azs = {
    default = ["us-east-2a", "us-east-2b", "us-east-2c"]
  }

  cidr = {
    default = "10.0.0.0/16"
  }

  tags = {
    default = {
      Owner     = "Rishav Dhar"
      Project   = "ecs-service"
      Terraform = terraform.workspace
    }
  }
}
