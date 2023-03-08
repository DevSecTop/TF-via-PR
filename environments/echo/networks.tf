# Network connectivity
#
module "vpcEcs" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 3.0"

  name = "vpcEcs"
  cidr = local.cidr[terraform.workspace]

  azs             = local.azs[terraform.workspace]
  private_subnets = slice(cidrsubnets(local.cidr[terraform.workspace], 4, 4, 4, 4, 4, 4), 0, 3)
  public_subnets  = slice(cidrsubnets(local.cidr[terraform.workspace], 4, 4, 4, 4, 4, 4), 3, 6)

  enable_nat_gateway     = true
  single_nat_gateway     = true
  one_nat_gateway_per_az = false

  tags                = local.tags[terraform.workspace]
  private_subnet_tags = { Connection = "private" }
  public_subnet_tags  = { Connection = "public" }
}

module "sgAlb" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 4.0"

  name   = "sgAlb"
  vpc_id = module.vpcEcs.vpc_id

  ingress_cidr_blocks = ["0.0.0.0/0"]
  ingress_rules       = ["http-80-tcp", "http-8080-tcp", "https-443-tcp", "https-8443-tcp"]

  number_of_computed_egress_with_source_security_group_id = 1
  computed_egress_with_source_security_group_id = [{
    rule                     = "all-tcp"
    source_security_group_id = module.sgEcs.security_group_id
  }]

  tags = local.tags[terraform.workspace]
}

module "sgEcs" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 4.0"

  name   = "sgEcs"
  vpc_id = module.vpcEcs.vpc_id

  number_of_computed_ingress_with_source_security_group_id = 1
  computed_ingress_with_source_security_group_id = [{
    rule                     = "all-tcp"
    source_security_group_id = module.sgAlb.security_group_id
  }]

  egress_rules = ["all-all"]

  tags = local.tags[terraform.workspace]
}

# Load balancers
#
module "albEcs" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 8.0"

  name               = "albEcs"
  load_balancer_type = "application"

  vpc_id                = module.vpcEcs.vpc_id
  security_groups       = [module.sgAlb.security_group_id]
  subnets               = module.vpcEcs.public_subnets
  create_security_group = false

  target_groups = [
    {
      backend_port     = 80
      backend_protocol = "HTTP"
      target_type      = "ip"
    }
  ]

  https_listeners = [{
    certificate_arn    = module.acmEcs.acm_certificate_arn
    port               = 443
    protocol           = "HTTPS"
    target_group_index = 0
  }]

  http_tcp_listeners = [{
    port        = 80
    protocol    = "HTTP"
    action_type = "redirect"

    redirect = {
      port        = 443
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }]

  tags = local.tags[terraform.workspace]
}
