# AWS Terraform Workflow for Multiple Environments

> Terraform is a platform-agnostic tool which can orchestrate AWS infrastructure as code (IaC). This workflow enables deployment from multiple environments via GitHub Actions only. Use-cases include directory-based environment isolation and management of multiple backends/workspaces from a single repository.

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

- Pass in AWS credentials as environment variables to GitHub Actions. See [this article](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars) for more information.
- Provision a Terraform backend to store our configuration. See [this article](https://developer.hashicorp.com/terraform/language/settings/backends/configuration) for more information.

## TL;DR

1. Copy this repository structure and populate secrets required by [the workflow](.github/workflows/terraform.yml).
1. Configure [backend.tf](environments/backend.tfvars) which is shared between each environment.
1. Add our IaC in a nested folder within [environments](environments) directory.
1. Open a PR with a label corresponding to our directory name prefixed with `tf:`.<br>
   E.g., for "environments/demo", that'd be `tf:demo`.
1. Add more labels to include multiple directories in the same PR.
1. Review the planned output for each given environment.
1. Merge the PR to deploy our IaC to each environment.
1. Read on for more usage details…

![Animated walkthrough of the environment provisioning workflow.](assets/animated_walkthrough.png)

## Usage

### Workflow

Environment isolation is achieved by nesting directories under [environments](environments) with their own [providers.tf](environments/demo/providers.tf). While there is a shared [backend.tf](environments/backend.tfvars), each environment can specify its own configuration or pass it in via `backend_config:` in the workflow.

Reusable, stateless components can be placed in the [modules](modules/) directory, from where they can be imported into each environment. For example:

```terraform
module "vpc" {
    source = "../../modules/network"
    …
```

The label-driven workflow lets us opt-in/out of deploying our IaC to multiple environments and review each of their planned outputs in a single PR. This data is queried from GitHub API via [octokit](https://octokit.github.io/rest.js/v18#issues-list-labels-on-issue) client.

While state locking is recommended on the backend, the workflow features built-in concurrency control as well as a [merge queue](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/merging-a-pull-request-with-a-merge-queue) to prevent overlapping runs.

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

To replicate Terraform’s `apply -auto-approve`, we can prefix with `tf_apply` to generate and run the plan immediately.

## Workspaces

Terraform [workspaces](https://developer.hashicorp.com/terraform/language/state/workspaces) allow us to associate multiple states with a single configuration. In conjunction with parameter interpolation, we can vary our configuration state dynamically based on the workspace name. This can be useful to provision different instance types or even different regions. For example:

```terraform
locals {
    instance_types = {
        default = "t2.micro"
        staging = "t2.medium"
    }
}

resource "aws_instance" "demo" {
    instance_type = local.instance_types[terraform.workspace]
    tags = { Name = "demo-${terraform.workspace}" }
    …
```

To deploy a workspace called "staging" in "environments/demo" directory, add `tf:demo--staging` as a label to the PR. Note the `--` delimiter between the environment directory and the workspace names.

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

Neither myself nor this project are associated with AWS or Terraform. All works herein are my own and shared of my own volition.

[Copyleft](LICENSE) @ All wrongs reserved.
