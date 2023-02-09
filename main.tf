module "ec2_web" {
  source       = "./modules/ec2"
  environment  = var.environment
  role         = "web"
  instance_ami = data.aws_ami.ubuntu.id
  subnets      = keys(module.vpc.vpc_public_subnets)
}

module "ec2_worker" {
  source       = "./modules/ec2"
  environment  = var.environment
  role         = "worker"
  instance_ami = data.aws_ami.ubuntu.id
  subnets      = keys(module.vpc.vpc_private_subnets)
}

module "vpc" {
  source      = "./modules/vpc"
  environment = var.environment
  vpc_cidr    = "10.0.0.0/17" # VPC peering between public and private subnets
}
