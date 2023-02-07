resource "aws_instance" "app" {
  ami           = var.instance_ami
  instance_type = var.instance_type

  root_block_device {
    volume_size = var.instance_root_device_size
    volume_type = "gp2"
  }

  tags = {
    Name        = "${var.environment}-${var.role}-app"
    Project     = "learning-rdhar"
    Environment = var.environment
    Role        = var.role
    Managed     = "terraform"
  }
}

resource "aws_eip" "app_eip" {
  tags = {
    Name        = "${var.environment}-${var.role}-app"
    Project     = "learning-rdhar"
    Environment = var.environment
    Role        = var.role
    Managed     = "terraform"
  }
}

resource "aws_eip_association" "app_eip_assoc" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.app_eip.id
}
