# AWS Terraform Workflow from Multiple Directories

> Terraform is a platform-agnostic tool which can orchestrate AWS infrastructure as code (IaC). This workflow enables deployment from multiple directories via GitHub Actions only. Use-cases include environment isolation and/or managing multiple AWS accounts with different backends from a single repository.

- [Prerequisites](#prerequisites)
- [Usage](#usage)
- [Contributions](#contributions)
- [To-do](#to-do)
- [License](#license)

## Prerequisites

- Pass your AWS credentials as environment variables into your GitHub Actions workflow. See [this article](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars) for more information.
- Provision a Terraform backend to store your configuration. See [this article](https://developer.hashicorp.com/terraform/language/settings/backends/configuration) for more information.

## Usage

1. Clone/fork this repository and populate GitHub secrets for use by GitHub Actions.

   1. For local use with [Terraform CLI](https://developer.hashicorp.com/terraform/downloads), copy "[.env.sample](.env.sample)" to ".env" and run `source .env` to load these variables into the current shell environment.

1. Configure [backend.tf](environments/backend.tfvars) as it is shared between all environments. Key/value pairs can also be passed in via lines starting with `backend_config:` in [the workflow](.github/workflows/terraform.yml).

   1. For local initialization in a directory called "prod", run:

      ```shell
      terraform -chdir="environments/prod" init \
          -backend-config="../backend.tfvars" \
          -backend-config="key=environments/prod/terraform.tfstate"
      ```

   1. For local plan/apply in a directory called "prod", run:

      ```shell
      terraform -chdir="environments/prod" apply
      ```

1. Configure your IaC to be nested under [environments](environments/) directory, which are treated as separate environments with their own [providers.tf](environments/prod/providers.tf).

   1. The nested directory's name will be used as the deployment environment name. See [this article](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment) for more information.

1. Activate the workflow by opening a PR with a label corresponding to your directory name prefixed with "tf:". For example, in a directory called "prod", the label would be "tf:prod".

   1. To deploy to multiple environments, add multiple labels for each directory prefixed with "tf:". Labels can be added/removed on an ad hoc basis to include/exclude directories on subsequent runs of the workflow.

1. Review the output from `terraform plan` for each environment supplied in "github-actions" bot's comment.

   1. To amend your IaC, push commits to the PR branch and the bot's comment will be updated with the latest output.

1. Merge the PR to re-activate the workflow and deploy your IaC to each environment with the plan output via `terraform apply`.

## Contributions

PRs are welcome and appreciated. Please open [an issue](https://github.com/rdhar/terraform-aws/issues/new/choose) if you would like to discuss any changes.

Major props to [dflook/terraform-github-actions](https://github.com/dflook/terraform-github-actions) for making this CI/CD possible with ease.

## To-do

- Support [workspaces](https://developer.hashicorp.com/terraform/cloud-docs/workspaces), with ephemeral test-environments as a use-case.
- Support destruction of a given environment using "tf_destroy:" prefix.

## License

Neither myself nor this project are associated with AWS or Terraform. All works herein are my own and shared of my own volition.

[Copyleft](LICENSE) @ All wrongs reserved.
