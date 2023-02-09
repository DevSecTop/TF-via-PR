variable "environment" {
  type        = string
  description = "Environment where infrastructure will be allocated"
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR range to be used"
  default     = "10.0.0.0/16"
}


variable "public_subnet_numbers" {
  type        = map(number)
  description = "Map of AZ to a number used for public subnets"
  default = {
    "us-east-1a" = 1
    "us-east-1b" = 2
    "us-east-1c" = 3
  }
}

variable "private_subnet_numbers" {
  type        = map(number)
  description = "Map of AZ to a number used for private subnets"
  default = {
    "us-east-1a" = 4
    "us-east-1b" = 5
    "us-east-1c" = 6
  }
}
