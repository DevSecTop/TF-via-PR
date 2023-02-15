module "vpc" {
  source          = "../../modules/network"
  environment     = var.environment
  vpc_cidr        = "10.0.0.0/17" # VPC peering between public and private subnets
  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  public_subnets  = slice(cidrsubnets("10.0.0.0/17", 4, 4, 4, 4, 4, 4), 0, 3)
  private_subnets = slice(cidrsubnets("10.0.0.0/17", 4, 4, 4, 4, 4, 4), 3, 6)
}

module "ec2_web" {
  source          = "../../modules/compute"
  environment     = var.environment
  role            = "web"
  instance_ami    = data.aws_ami.ubuntu.id
  subnets         = module.vpc.vpc_public_subnets
  security_groups = [module.vpc.security_group_public]
  create_eip      = true

  tags = {
    Name = "${var.environment}-web"
  }
}

# module "ec2_worker" {
#   source          = "../../modules/compute"
#   environment     = var.environment
#   role            = "worker"
#   instance_ami    = data.aws_ami.ubuntu.id
#   subnets         = module.vpc.vpc_private_subnets
#   security_groups = [module.vpc.security_group_private]
#   create_eip      = false

#   tags = {
#     Name = "${var.environment}-worker"
#   }
# }
