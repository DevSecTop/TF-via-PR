# Create a sample S3 bucket with versioning.
module "sample_bucket" {
  source         = "../modules/s3_bucket"
  source_version = var.s3_source_version

  name_prefix = var.s3_name_prefix
  versioning  = var.s3_versioning
}

# Output the ID of the sample S3 bucket.
output "sample_bucket_id" {
  description = "ID of the sample S3 bucket."
  value       = module.sample_bucket.id
}
