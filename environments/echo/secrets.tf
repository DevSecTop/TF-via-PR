# Secrets
#
resource "aws_secretsmanager_secret" "xkcdSecret" {
  name = "xkcd-secret-value"

  tags = local.tags[terraform.workspace]
}

resource "aws_secretsmanager_secret_version" "xkcdSecretValue" {
  secret_id = aws_secretsmanager_secret.xkcdSecret.id
  secret_string = jsonencode({
    PASS = "correct horse battery staple"
    PORT = 3000
  })
}
