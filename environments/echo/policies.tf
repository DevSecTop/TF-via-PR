# Task execution policies
#
data "aws_iam_policy_document" "ecsTaskExecAssumeRole" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      identifiers = ["ecs-tasks.amazonaws.com"]
      type        = "Service"
    }
  }
}

resource "aws_iam_role" "ecsTaskExecRole" {
  name               = "ECSTaskExecutionRole"
  assume_role_policy = data.aws_iam_policy_document.ecsTaskExecAssumeRole.json

  tags = local.tags[terraform.workspace]
}

resource "aws_iam_role_policy" "ecsTaskExecPolicy" {
  name = "ECSTaskExecutionRolePolicyCustom"
  role = aws_iam_role.ecsTaskExecRole.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Resource = "*"
      Action = [
        "secretsmanager:GetSecretValue",
        "ssm:GetParameters",
      ]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecsTaskExecPolicyAttach" {
  for_each = toset([
    "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role",
    "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
  ])

  role       = aws_iam_role.ecsTaskExecRole.name
  policy_arn = each.value
}
