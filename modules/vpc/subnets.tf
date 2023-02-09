resource "aws_subnet" "public" {
  for_each   = var.public_subnet_numbers
  vpc_id     = aws_vpc.vpc.id
  cidr_block = cidrsubnet(aws_vpc.vpc.cidr_block, 4, each.value) # 10.0.0.0/17

  tags = {
    Name        = "${var.environment}-public-${each.key}"
    Project     = "learning-rdhar"
    Environment = var.environment
    Role        = "public"
    Subnet      = "${each.key}-${each.value}"
    Managed     = "terraform"
  }
}

resource "aws_subnet" "private" {
  for_each   = var.private_subnet_numbers
  vpc_id     = aws_vpc.vpc.id
  cidr_block = cidrsubnet(aws_vpc.vpc.cidr_block, 4, each.value) # 10.0.0.0/17

  tags = {
    Name        = "${var.environment}-private-${each.key}"
    Project     = "learning-rdhar"
    Environment = var.environment
    Role        = "private"
    Subnet      = "${each.key}-${each.value}"
    Managed     = "terraform"
  }
}
