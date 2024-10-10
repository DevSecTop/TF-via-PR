# sample_instance

> Deploy a sample instance to AWS with this template stack.

## Structure

- [env/](env): Contains environment-specific configuration files.
- [main.tf](main.tf): Contains the configuration of resources to be provisioned (e.g., EC2 instance).
  - Best practice is to keep this file as small as possible (e.g., compute.tf).
  - Break out the configuration into separate files.
- [providers.tf](providers.tf): Contains stack requirements, such as providers (e.g., AWS).
- [variables.tf](variables.tf): Contains the definitions declared for each variable (e.g., region).

## Inputs

- PREFIX
- aws_region
- instance_type

## Outputs

- sample_instance_id

## Command

```sh
export TF_VAR_PREFIX=sample
tofu init -upgrade -reconfigure
tofu workspace select dev
tofu apply -var-file=env/dev.tfvars
```
