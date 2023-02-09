module "ec2_web" {
  source          = "./modules/compute"
  environment     = var.environment
  role            = "web"
  instance_ami    = data.aws_ami.ubuntu.id
  subnets         = keys(module.vpc.vpc_public_subnets)
  security_groups = [module.vpc.security_group_public]
  create_eip      = true

  tags = {
    Name = "${var.environment}-web"
  }
}

module "ec2_worker" {
  source          = "./modules/compute"
  environment     = var.environment
  role            = "worker"
  instance_ami    = data.aws_ami.ubuntu.id
  subnets         = keys(module.vpc.vpc_private_subnets)
  security_groups = [module.vpc.security_group_private]
  create_eip      = false

  tags = {
    Name = "${var.environment}-worker"
  }
}

module "vpc" {
  source      = "./modules/network"
  environment = var.environment
  vpc_cidr    = "10.0.0.0/17" # VPC peering between public and private subnets
}
