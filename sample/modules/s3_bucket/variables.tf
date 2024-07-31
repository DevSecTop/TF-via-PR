variable "source_version" {
  description = "String version of the S3 bucket module."
  type        = string
}

variable "name_prefix" {
  description = "String prefix of the unique bucket name."
  type        = string
}

variable "versioning" {
  description = "Boolean toggle of bucket versioning."
  type        = bool
}
