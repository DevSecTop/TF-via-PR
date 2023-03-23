# AWS Terraform Workflow for Multiple Environments

> Terraform is a platform-agnostic tool which can orchestrate AWS infrastructure as code (IaC). This reusable workflow enables deployment of multiple environments via GitHub Actions. Use-cases include directory-based environment isolation and management of multiple backends/workspaces from a single repository.

- [Prerequisites](#prerequisites)
- [TL;DR](#tldr)
- [Usage](#usage)
  - [Workflow](#workflow)
  - [Local](#local)
- [Modes](#modes)
  - [Destroy](#destroy)
  - [Apply](#apply)
- [Workspaces](#workspaces)
- [Contributions](#contributions)
- [To-do](#to-do)
- [License](#license)

## Prerequisites

- Provision a [Terraform backend](https://developer.hashicorp.com/terraform/language/settings/backends/configuration) to store configuration state files.
- Store AWS credentials as [Actions secrets](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html) to reference as environment variables.

## TL;DR

1. Reference the reusable Terraform workflow and pass in environment variables as secrets.

   ```yml
   uses: o11y-top/aws-terraform-multiple-environments/.github/workflows/terraform.yml@3
   secrets:
     env: |
       AWS_ACCESS_KEY_ID=${{ secrets.AWS_ACCESS_KEY_ID }}
       AWS_SECRET_ACCESS_KEY=${{ secrets.AWS_SECRET_ACCESS_KEY }}
   ```

1. Add workflow triggers, as shown in [terraform-runner.yml](.github/workflows/terraform-runner.yml).
1. Add IaC configurations to a nested folder within [environments](environments) directory.
1. Configure the [backend.tf](environments/backend.tfvars) which is shared between all environments.

PRs which modify IaC will automatically add a label corresponding to the directory name. For example, changes within "environments/demo" would be labelled with `tf:demo`.

We can override these labels before merging the PR to apply the generated plans. Read on for more usage details and features.

![Animated walkthrough of the environment provisioning workflow.](assets/animated_walkthrough.png)

## Usage

### Workflow

Environment isolation is achieved by nesting directories under [environments](environments) with their own [providers.tf](environments/demo/providers.tf) in addition to the shared [backend.tf](environments/backend.tfvars).

Reusable, stateless components can be placed in the [modules](modules/) directory to be imported into each environment. For example:

```hcl
module "vpc" {
  source = "../../modules/network"
```

The label-driven workflow lets us opt-in/out of deploying our IaC to multiple environments and review each of their planned outputs in a single PR.

While state locking is recommended on the backend, the workflow features built-in concurrency control to prevent overlapping runs.

### Local

For local use with [Terraform CLI](https://developer.hashicorp.com/terraform/downloads), copy "[.env.sample](.env.sample)" to ".env" and run `source .env` to load these variables into the current shell environment.

To initialize in "environments/demo" directory, run:

```shell
terraform -chdir="environments/demo" init \
  -backend-config="../backend.tfvars" \
  -backend-config="key=environments/demo/terraform.tfstate"
```

To plan/apply in "environments/demo" directory, run:

```shell
terraform -chdir="environments/demo" apply
```

## Modes

### Destroy

To replicate Terraform’s `plan/apply -destroy`, we can prefix with `tf_destroy` to generate a plan to destroy all resources. The plan will be carried out on merge.

### Apply

To replicate Terraform’s `apply -auto-approve`, we can prefix with `tf_auto_approve` to generate and apply the plan immediately.

## Workspaces

Terraform [workspaces](https://developer.hashicorp.com/terraform/language/state/workspaces) allow us to associate multiple states with a single configuration. In conjunction with parameter interpolation, we can vary our configuration state dynamically based on the workspace name. For example:

```hcl
locals {
  instance_types = {
    default = "t2.micro"
    staging = "t2.medium"
  }
}

resource "aws_instance" "demo" {
  instance_type = local.instance_types[terraform.workspace]
  tags = { Name = "demo-${terraform.workspace}" }
```

To deploy a workspace called "staging" in "environments/demo" directory, add `tf:demo--staging` as a label to the PR. Note the `--` delimiter between the environment directory and the workspace name.

![Animated walkthrough of the workspace provisioning workflow.](assets/animated_walkthrough--workspace.png)

For local use, we initialize as before then select the workspace for plan/apply:

```shell
terraform -chdir="environments/demo" workspace select staging
terraform -chdir="environments/demo" apply
```

## Contributions

PRs are welcome and appreciated. Please open [a discussion](https://github.com/rdhar/aws-terraform-multiple-environments/discussions) if you'd like to get in touch.

Major props to [dflook/terraform-github-actions](https://github.com/dflook/terraform-github-actions) for making this CI/CD possible with ease.

## To-do

- Automated drift detection.
- Ephemeral test environments.

## License

Neither myself nor this project are associated with AWS or Terraform.

All works herein are my own and shared of my own volition.

[Copyleft](LICENSE) @ All wrongs reserved.
