resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.vpc.id

  tags = {
    Name        = "${var.environment}-igw"
    Project     = "learning-rdhar"
    Environment = var.environment
    Managed     = "terraform"
  }
}

resource "aws_eip" "ngw" {
  vpc = true

  tags = {
    Name        = "${var.environment}-private-eip"
    Project     = "learning-rdhar"
    Environment = var.environment
    Role        = "private"
    Managed     = "terraform"
  }

  lifecycle {
    # prevent_destroy = true
  }
}

resource "aws_nat_gateway" "ngw" {
  # Whichever the first subnets happens to be because NGW needs to be in a public subnet with an IGW
  subnet_id     = aws_subnet.public[element(keys(aws_subnet.public), 0)].id
  allocation_id = aws_eip.ngw.id

  tags = {
    Name        = "${var.environment}-private-ngw"
    Project     = "learning-rdhar"
    Environment = var.environment
    Role        = "private"
    Managed     = "terraform"
  }
}

resource "aws_route_table" "public" {
  # For subnets with an IGW
  vpc_id = aws_vpc.vpc.id

  tags = {
    Name        = "${var.environment}-public-rt"
    Project     = "learning-rdhar"
    Environment = var.environment
    VPC         = aws_vpc.vpc.id
    Role        = "public"
    Managed     = "terraform"
  }
}

resource "aws_route_table" "private" {
  # For subnets with a NGW
  vpc_id = aws_vpc.vpc.id

  tags = {
    Name        = "${var.environment}-private-rt"
    Project     = "learning-rdhar"
    Environment = var.environment
    VPC         = aws_vpc.vpc.id
    Role        = "private"
    Managed     = "terraform"
  }
}

resource "aws_route" "public" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route" "private" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_nat_gateway.ngw.id
}

resource "aws_route_table_association" "public" {
  for_each       = aws_subnet.public
  subnet_id      = aws_subnet.public[each.key].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  for_each       = aws_subnet.private
  subnet_id      = aws_subnet.private[each.key].id
  route_table_id = aws_route_table.private.id
}
