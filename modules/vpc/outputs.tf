output "vpc_id" {
  value = aws_vpc.vpc.id
}

output "vpc_cidr" {
  value = aws_vpc.vpc.cidr_block
}

output "vpc_public_subnets" {
  # { "subnet-1" => "10.0.1.0/4", … }
  #   value = aws_subnet.public.*.id
  value = {
    for subnet in aws_subnet.public :
    subnet.id => subnet.cidr_block
  }
}

output "vpc_private_subnets" {
  # { "subnet-1" => "10.0.1.0/4", … }
  #   value = aws_subnet.private.*.id
  value = {
    for subnet in aws_subnet.private :
    subnet.id => subnet.cidr_block
  }
}

output "security_group_public" {
  value = aws_security_group.public.id
}

output "security_group_private" {
  value = aws_security_group.private.id
}
