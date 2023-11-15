# Create a sample S3 bucket with versioning.
module "sample_bucket" {
  source = "../modules/s3_bucket"

  PREFIX            = var.PREFIX
  bucket_versioning = var.bucket_versioning
}

# Output the ID of the sample S3 bucket.
output "sample_bucket_id" {
  description = "ID of the sample S3 bucket."
  value        = module.sample_bucket.id
}
