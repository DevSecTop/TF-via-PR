resource "aws_instance" "demo" {
  ami           = "ami-0557a15b87f6559cf" # ubuntu-jammy-22.04-amd64
  instance_type = "t2.micro"

  tags = {
    Terraform = terraform.workspace
    Role      = "demo"
  }
}	
