# Create an S3 bucket.
resource "aws_s3_bucket" "sample" {
  bucket_prefix = var.PREFIX

  tags = {
    Name = join("-", [var.PREFIX, "bucket"])
  }
}

# Set versioning on the S3 bucket.
resource "aws_s3_bucket_versioning" "sample" {
  bucket = aws_s3_bucket.sample.id

  versioning_configuration {
    status = var.bucket_versioning
  }
}

# Output the ID of the S3 bucket.
output "id" {
  description = "ID of the sample S3 bucket."
  value       = aws_s3_bucket.sample.id
}
