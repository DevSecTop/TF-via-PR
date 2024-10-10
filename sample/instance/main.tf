# Get the latest Ubuntu 22.04 AMI https://cloud-images.ubuntu.com/locator/ec2.
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical.

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# Create a sample EC2 instance.
resource "aws_instance" "sample" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  vpc_security_group_ids = ["sg-0f910049cea34d9ce"]
  subnet_id     = "subnet-01ef465df13ebc0dc"

  tags = {
    Name = join("-", [var.PREFIX, "instance"])
  }
}

# Output the ID of the sample EC2 instance.
output "sample_instance_id" {
  description = "ID of the sample EC2 instance."
  value       = aws_instance.sample.id
}
