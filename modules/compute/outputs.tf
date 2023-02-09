output "app_eip" {
  value = aws_eip.app_eip.*.public_ip
}

output "app_instance_id" {
  value = module.ec2_instance.id
}
