variable "aws_region" {
  description = "String AWS region in which to provision resources."
  type        = string
}

variable "s3_source_version" {
  description = "String version of the S3 bucket module."
  type        = string
}

variable "s3_name_prefix" {
  description = "String prefix of the unique bucket name."
  type        = string
}

variable "s3_versioning" {
  description = "Boolean toggle of bucket versioning."
  type        = bool
}
