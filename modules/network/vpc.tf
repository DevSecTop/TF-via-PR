module "vpc" {
  source                 = "terraform-aws-modules/vpc/aws"
  name                   = "${var.environment}-vpc"
  cidr                   = var.vpc_cidr
  azs                    = var.azs
  enable_nat_gateway     = true
  single_nat_gateway     = true
  one_nat_gateway_per_az = false
  private_subnets        = var.private_subnets
  public_subnets         = var.public_subnets

  tags = {
    Project     = "learning-rdhar"
    Environment = var.environment
    Managed     = "terraform"
  }
}
