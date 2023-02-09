resource "aws_vpc" "vpc" {
  cidr_block = var.vpc_cidr

  tags = {
    Name        = "${var.environment}-vpc"
    Project     = "learning-rdhar"
    Environment = var.environment
    Managed     = "terraform"
  }
}
