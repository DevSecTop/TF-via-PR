variable "environment" {
  type        = string
  description = "Environment where infrastructure will be allocated"
}

variable "role" {
  type        = string
  description = "Role allocated to the infrastructure"
}

variable "instance_type" {
  type        = string
  description = "AWS instance type to be used"
  default     = "t2.micro"
}

variable "instance_ami" {
  type        = string
  description = "AWS instance AMI to be used"
}

variable "instance_root_device_size" {
  type        = number
  description = "AWS instance root device size in GB to be used"
  default     = 8
}
