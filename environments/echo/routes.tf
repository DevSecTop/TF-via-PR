# Routing records
#
data "aws_route53_zone" "r53zoneEcs" {
  name = "aws.o11y.top"
}

module "acmEcs" {
  source  = "terraform-aws-modules/acm/aws"
  version = "~> 4.0"

  domain_name = data.aws_route53_zone.r53zoneEcs.name
  zone_id     = data.aws_route53_zone.r53zoneEcs.zone_id

  subject_alternative_names = [
    "*.${data.aws_route53_zone.r53zoneEcs.name}",
    data.aws_route53_zone.r53zoneEcs.name,
  ]

  tags = local.tags[terraform.workspace]
}

resource "aws_route53_record" "r53recordEcs" {
  name    = "ecs.${data.aws_route53_zone.r53zoneEcs.name}"
  zone_id = data.aws_route53_zone.r53zoneEcs.zone_id
  type    = "A"

  alias {
    name                   = module.albEcs.lb_dns_name
    zone_id                = module.albEcs.lb_zone_id
    evaluate_target_health = true
  }
}
