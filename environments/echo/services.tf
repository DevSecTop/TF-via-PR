# Container services
#
resource "aws_ecr_repository" "hello_world" {
  name                 = "express-hello-world"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.tags[terraform.workspace]
}

resource "aws_cloudwatch_log_group" "ecsLog" {
  name              = "/aws/custom/ecs-hello-world"
  retention_in_days = 7

  tags = local.tags[terraform.workspace]
}

resource "aws_ecs_task_definition" "hello" {
  family = "hello"

  container_definitions = jsonencode([{
    name      = "hello-world-container"
    image     = "${aws_ecr_repository.hello_world.repository_url}:latest"
    essential = true

    portMappings = [{
      containerPort = jsondecode(aws_secretsmanager_secret_version.xkcdSecretValue.secret_string)["PORT"]
    }]

    secrets = [
      {
        name      = "secretPASS"
        valueFrom = "${aws_secretsmanager_secret.xkcdSecret.arn}:PASS::"
      },
      {
        name      = "secretPORT"
        valueFrom = "${aws_secretsmanager_secret.xkcdSecret.arn}:PORT::"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-stream-prefix = "ecs-hello-world"
        awslogs-group         = aws_cloudwatch_log_group.ecsLog.name
        awslogs-region        = local.aws_region[terraform.workspace]
      }
    }
  }])

  network_mode = "awsvpc"
  cpu          = "256"
  memory       = "512"

  execution_role_arn       = aws_iam_role.ecsTaskExecRole.arn
  requires_compatibilities = ["FARGATE"]

  tags = local.tags[terraform.workspace]
}

resource "aws_ecs_cluster" "ecsCluster" {
  name = "ecsCluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.tags[terraform.workspace]
}

resource "aws_ecs_service" "ecsService" {
  name            = "ecsService"
  cluster         = aws_ecs_cluster.ecsCluster.id
  task_definition = aws_ecs_task_definition.hello.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  load_balancer {
    target_group_arn = module.albEcs.target_group_arns[0]
    container_name   = jsondecode(aws_ecs_task_definition.hello.container_definitions)[0].name
    container_port   = jsondecode(aws_secretsmanager_secret_version.xkcdSecretValue.secret_string)["PORT"]
  }

  network_configuration {
    # Public subnet as private subnet requires NAT gateway and VPC endpoint
    # for AWS ECR to fetch images. Whereas, internet gateway is free.
    assign_public_ip = true
    security_groups  = [module.sgEcs.security_group_id]
    subnets          = module.vpcEcs.public_subnets
  }

  tags = local.tags[terraform.workspace]
}

# Service discovery
#
# resource "aws_service_discovery_private_dns_namespace" "ecsServiceDiscovery" {
#   name        = "ecsServiceDiscovery"
#   description = "Service discovery for ECS services"
#   vpc         = module.vpcEcs.vpc_id
# }

# resource "aws_service_discovery_service" "ecsServiceDiscovery" {
#   name = "ecsServiceDiscovery"

#   dns_config {
#     namespace_id = aws_service_discovery_private_dns_namespace.ecsServiceDiscovery.id
#     dns_records {
#       ttl  = 60
#       type = "A"
#     }
#   }

#   health_check_custom_config {
#     failure_threshold = 1
#   }
# }

# resource "aws_route53_record" "ecsServiceDiscovery" {
#   name    = "ecsServiceDiscovery"
#   type    = "A"
#   zone_id = module.dns.zone_id

#   alias {
#     name                   = aws_service_discovery_service.ecsServiceDiscovery.name
#     zone_id                = aws_service_discovery_service.ecsServiceDiscovery.dns_config[0].namespace_id
#     evaluate_target_health = false
#   }
# }
