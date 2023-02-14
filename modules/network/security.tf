resource "aws_security_group" "public" {
  name        = "${var.environment}-public-sg"
  description = "Public internet facing security group"
  vpc_id      = module.vpc.vpc_id

  tags = {
    Name        = "${var.environment}-public-sg"
    Project     = "learning-rdhar"
    Environment = var.environment
    Role        = "public"
    Terraform   = terraform.workspace
  }
}

resource "aws_security_group_rule" "public_outbound_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.public.id
}

resource "aws_security_group_rule" "public_inbound_ssh" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.public.id
}

resource "aws_security_group_rule" "public_inbound_http" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.public.id
}

resource "aws_security_group_rule" "public_inbound_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.public.id
}

resource "aws_security_group" "private" {
  name        = "${var.environment}-private-sg"
  description = "Private internet facing security group"
  vpc_id      = module.vpc.vpc_id

  tags = {
    Name        = "${var.environment}-private-sg"
    Project     = "learning-rdhar"
    Environment = var.environment
    Role        = "private"
    Terraform   = terraform.workspace
  }
}

resource "aws_security_group_rule" "private_outbound_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.private.id
}

resource "aws_security_group_rule" "private_inbound_all" {
  type              = "ingress"
  from_port         = 0
  to_port           = 65535
  protocol          = "-1"
  cidr_blocks       = [module.vpc.vpc_cidr_block]
  security_group_id = aws_security_group.private.id
}
