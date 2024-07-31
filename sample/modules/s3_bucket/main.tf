# Create an S3 bucket with versioning.
module "s3_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = var.source_version

  bucket_prefix = var.name_prefix
  acl           = "private"

  control_object_ownership = true
  force_destroy            = true
  object_ownership         = "ObjectWriter"

  versioning = {
    enabled = var.versioning
  }
}

# Output the ID of the S3 bucket.
output "id" {
  description = "String ID of the S3 bucket."
  value       = module.s3_bucket.s3_bucket_id
}
