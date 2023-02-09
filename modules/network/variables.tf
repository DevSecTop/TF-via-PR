variable "environment" {
  type        = string
  description = "Environment where infrastructure will be allocated"
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR range to be used"
  default     = "10.0.0.0/16"
}

variable "azs" {
  type        = list(string)
  description = "List of availability zones to be used"
}

variable "public_subnets" {
  type        = list(string)
  description = "List of public subnets to be used"
}

variable "private_subnets" {
  type        = list(string)
  description = "List of private subnets to be used"
}
