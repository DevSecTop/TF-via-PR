resource "random_shuffle" "subnets" {
  input        = var.subnets
  result_count = 1
}

resource "aws_instance" "app" {
  ami                    = var.instance_ami
  instance_type          = var.instance_type
  vpc_security_group_ids = var.security_groups
  subnet_id              = random_shuffle.subnets.result[0]

  root_block_device {
    volume_size = var.instance_root_device_size
    volume_type = "gp2"
  }

  tags = merge(
    {
      Name        = "${var.environment}-${var.role}-app"
      Project     = "learning-rdhar"
      Environment = var.environment
      Role        = var.role
      Managed     = "terraform"
    },
    var.tags
  )
}

resource "aws_eip" "app_eip" {
  count = var.create_eip ? 1 : 0
  vpc   = true

  tags = {
    Name        = "${var.environment}-${var.role}-app"
    Project     = "learning-rdhar"
    Environment = var.environment
    Role        = var.role
    Managed     = "terraform"
  }

  lifecycle {
    # prevent_destroy = true
  }
}

resource "aws_eip_association" "app_eip_assoc" {
  count         = var.create_eip ? 1 : 0
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.app_eip[0].id
}
