# Terraform/OpenTofu Via PR Comments (TVP) — Reusable Workflow

> [!IMPORTANT]
>
> TVP's [reusable workflow][tf_yml] enables you to plan and apply changes to Terraform or OpenTofu (TF) configurations in bulk with pull request (PR) comments: for a CLI-like experience on the web UI. It's powered by GitHub Actions to maximize compatibility and minimize maintenance for DIY deployments. It's ready-made for AWS as a [functional example](#aws), and can easily be extended to support other cloud providers.

[Overview](#overview) · [Usage](#usage) [[Workflow](#workflow) · [Examples](#examples) · [Parameters](#parameters) · [AWS](#aws)] · [Security](#security) · [Roadmap](#roadmap) · [Contributions](#contributions) · [License](#license)

## Overview

<details><summary>Terraform and OpenTofu are platform-agnostic tools for managing cloud and on-prem resources by provisioning infrastructure as code (IaC).</summary>

- It enables you to define resources in human-readable configuration files that can be version controlled and shared for consistent state management.
- Both [Hashicorp][terraform_io] `terraform` and [OpenTofu][opentofu_org] `tofu` CLIs are supported, with the latter offering an open-source and backwards-compatible drop-in replacement for the former.

</details>

<details><summary>Best suited for DevOps and Platform engineers who want to empower their teams to self-service TF without the overhead of self-hosting runners, containers or VMs like <a href="https://www.runatlantis.io" title="Atlantis Terraform pull request automation.">Atlantis</a>.</summary>

- [Environment deployment protection rules][deployment_protection] mitigate the risk of erroneous changes along with standardized approval requirements.
- Each PR and associated workflow run holds a complete log of infrastructure changes for ease of collaborative debugging as well as audit compliance.

</details>

<details><summary><a href="https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions" title="Introduction to GitHub Actions.">GitHub Actions</a> is a continuous integration and continuous deployment (CI/CD) platform that enables you to automate your project's pipelines with custom workflows.</summary>

- This repository hosts a [reusable workflow][tf_yml] that parses PR comments for TF commands and runs them in a remote environment.
- Also supports [GitHub Codespaces][github_codespaces] dev container, which offers a tailored TF development environment, complete with tools and runtimes to lower the barrier to entry for contributors.

</details>

## Usage

### Workflow

Copy the following snippet into ".github/workflows/tf.yml" file in your repository. Replace the contents of `env_vars` with environment variables required by your TF configuration, like [this example][caller_yml].

```yml
on:
  issue_comment:
    types: [created, edited]
  pull_request:
    types: [synchronize]
    paths: ['**/*.tf*']

jobs:
  tf:
    uses: devsectop/tf-via-pr/.github/workflows/tf.yml@main
    secrets:
      env_vars: |
        AWS_ACCESS_KEY_ID=${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY=${{ secrets.AWS_SECRET_ACCESS_KEY }}
        TVP_CLI_VERSION=~1.6
```

> [!NOTE]
>
> - Pin your workflow version to a specific release tag or SHA to harden your CI/CD pipeline [security](#security) against supply chain attacks.
> - The optional `env_vars` input lets you pass in environment variables as key-value pairs, while masking sensitive values from logs.
>   - Each entry must be on a new line and separated by an equals sign (`=`).
>   - Entries prefixed with `BASE64_` will be decoded from Base64 twice, an example of such a workflow is given in [caller_aws.yml][caller_aws_yml]. E.g., for passing in temporary/[OIDC][configure_oidc] credentials output from a previous job.

### Examples

Use-case scenario: Provision resources in multiple workspaces with different input variables, followed by targeted destruction. [View PR in situ][pr_example_1].

```bash
#1 PR Comment: Plan configuration in a workspace with input variable file.
-tf=plan -chdir=stacks/sample_instance -workspace=dev -var-file=env/dev.tfvars

#2 PR Comment: Apply configuration in a workspace with input variable file.
-tf=apply -chdir=stacks/sample_instance -workspace=dev -var-file=env/dev.tfvars

#3 PR Comment: Plan destruction of targeted resources in a workspace with input variable file.
-tf=plan -destroy -target=aws_instance.sample,data.aws_ami.ubuntu -chdir=stacks/sample_instance -workspace=dev -var-file=env/dev.tfvars

#4 PR Comment: Apply destruction of targeted resources in a workspace with input variable file.
-tf=apply -destroy -target=aws_instance.sample,data.aws_ami.ubuntu -chdir=stacks/sample_instance -workspace=dev -var-file=env/dev.tfvars
```

Use-case scenario: Provision resources with multiple different backends in bulk, simultaneously, followed by destruction without confirmation, simultaneously. [View PR in situ][pr_example_2].

```bash
#1 PR Comment: Plan multiple configurations with different backends.
-tf=plan -chdir=stacks/sample_bucket -backend-config=backend/dev.tfbackend
-tf=plan -chdir=stacks/sample_bucket -backend-config=backend/stg.tfbackend

#2 PR Comment: Apply multiple configurations with different backends.
-tf=apply -chdir=stacks/sample_bucket -backend-config=backend/dev.tfbackend
-tf=apply -chdir=stacks/sample_bucket -backend-config=backend/stg.tfbackend

#3 PR Comment: Destroy multiple configurations with different backends without confirmation.
-tf=apply -destroy -auto-approve -chdir=stacks/sample_bucket -backend-config=backend/dev.tfbackend
-tf=apply -destroy -auto-approve -chdir=stacks/sample_bucket -backend-config=backend/stg.tfbackend
```

### Parameters

#### Inputs

| Name                                                   | Description                                                                                                                                                |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TVP_APPLY_REQUIRE_APPROVAL`</br>Default: false        | Boolean flag to require PR review approval for TF apply commands. Consider [deployment protection rules][deployment_protection] for specific environments. |
| `TVP_BACKEND_CONFIG_FROM_WORKSPACE`</br>Default: false | Boolean flag to re-use TF `-workspace` as `-backend-config` argument, if supplied.                                                                         |
| `TVP_BACKEND_CONFIG_PREFIX`</br>Example: ../backend/   | String prefix for TF `-backend-config` argument, if `-backend-config` (or `-workspace` and `TVP_BACKEND_CONFIG_FROM_WORKSPACE`) is supplied.               |
| `TVP_BACKEND_CONFIG_SUFFIX`</br>Example: .tfbackend    | String suffix for TF `-backend-config` argument, if `-backend-config` (or `-workspace` and `TVP_BACKEND_CONFIG_FROM_WORKSPACE`) is supplied.               |
| `TVP_CHDIR_PREFIX`</br>Example: stacks/                | String prefix for TF `-chdir` argument. This is a global option that switches to a different directory.                                                    |
| `TVP_CLI_HOSTNAME`</br>Example: app.terraform.io       | Hostname of TF cloud/enterprise instance to place within the credentials block of TF CLI configuration.                                                    |
| `TVP_CLI_TOKEN`</br>Example: xyz…                      | API token for TF cloud/enterprise instance to place within the credentials block of TF CLI configuration.                                                  |
| `TVP_CLI_USES`</br>Default: terraform                  | String to choose TF CLI, from: `terraform` and `tofu`.                                                                                                     |
| `TVP_CLI_VERSION`</br>Default: latest                  | Version of TF CLI to install, supporting [semver ranges][semver].                                                                                          |
| `TVP_FMT_ENABLE`</br>Default: true                     | Boolean flag to enable TF fmt command and display diff of changes.                                                                                         |
| `TVP_VAR_FILE_FROM_WORKSPACE`</br>Default: false       | Boolean flag to re-use TF `-workspace` as `-var-file` argument, if supplied.                                                                               |
| `TVP_VAR_FILE_PREFIX`</br>Example: ../env/             | String prefix for TF `-var-file` argument, if `-var-file` (or `-workspace` and `TVP_VAR_FILE_FROM_WORKSPACE`) is supplied.                                 |
| `TVP_VAR_FILE_SUFFIX`</br>Example: .tfvars             | String suffix for TF `-var-file` argument, if `-var-file` (or `-workspace` and `TVP_VAR_FILE_FROM_WORKSPACE`) is supplied.                                 |

#### Outputs

| Name                                                                            | Description                                                                                      |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `COMMENT_SHA`</br>Example: 1234567…                                             | SHA of the PR comment that triggered the workflow.                                               |
| `PARSED_COMMENT`</br>Example: `[{"tf":"plan", "chdir":"stacks/sample_bucket"}]` | JSON object of the parsed PR comment.                                                            |
| `PROMPT_MATRIX`</br>Example: `{"tf":"plan", "chdir":"stacks/sample_bucket"}`    | Matrix strategy of the [last successfully completed job][reusable_workflow_outputs].             |
| `TF_PLAN_ID`</br>Example: 42stacks-sample-bucket-tfplan                         | Unique identifier of the TF plan file, used for artifact upload/download and bot comment update. |
| `WORKING_DIRECTORY`</br>Example: stacks/sample_bucket                           | Working directory of the TF configuration, used in `-chdir` argument.                            |

### AWS

Environment isolation is achieved by nesting directories (e.g., stacks/), each with their own providers, to enable management of multiple: backends, workspaces and variable files from a single repository.

Reusable, stateless components can be placed within a dedicated directory (e.g., "stacks/modules/") to be imported into each environment like so.

```hcl
module "sample_bucket" {
  source = "../modules/s3_bucket"
```

> [!NOTE]
>
> - For [OIDC][configure_oidc] authentication, the [aws-actions/configure-aws-credentials][configure_aws_credentials] action can be used to pass short-lived credentials.
> - An example of such a workflow is given in [caller_aws.yml][caller_aws_yml].

## Security

Integrating security in your CI/CD pipeline is critical to practicing DevSecOps. This [reusable workflow][tf_yml] is designed to be secure by default, and it should be complemented with your own review to ensure it meets your (organization's) security requirements.

- All associated GitHub Actions used in this workflow are [pinned to a specific SHA][securing_github_actions] to prevent supply chain attacks from third-party upstream dependencies.
- Restrict changes to certain environments with [deployment protection rules][deployment_protection] so that approval is required from authorized users/teams before changes to the infrastructure can be applied.

## Roadmap

- [x] Support [OpenTofu][opentofu_org] compatibility, per recent developments in the IaC space.
  - [x] Adapted `tofu` as a drop-in replacement for TF CLI, reusing the same wrapper script and workflow.
- [x] Pass environment variables to the workflow as secrets to prevent sensitive values from being exposed in logs.
  - [x] The `secrets.env_vars` input allows any number of key-value pairs to be passed to the workflow for use as masked environment variables, enabling you to customize the workflow to your TF configuration.
  - [x] GitHub Actions has no official support for passing secrets from a prior job in the caller workflow to a reusable workflow. Tracked in [discussion#13082](https://github.com/orgs/community/discussions/13082), [discussion#17554](https://github.com/orgs/community/discussions/17554) and [discussion#26671](https://github.com/orgs/community/discussions/26671).
- [x] Parse PR comments as input commands to interface with TF CLI, returning the output as bot comments.
  - [x] Opted to use GitHub Action with a custom wrapper script to enable parsing of PR comments as input commands with CLI arguments.
- [x] Use GitHub's [reusable workflow or composite actions][compare_reusable_workflow_with_composite_actions] for CI/CD of TF configuration changes.
  - [x] Opted for reusable workflow due to more granular control over workflow execution: from managing `concurrency` of queued workflows to running jobs in parallel with `strategy.matrix`.
  - [x] Adapted [ternary operator][ternary_operator]-like behavior to enable if-else logic within GitHub Actions expressions.
  - [ ] Unlike `pull_request`, `issue_comment` events can only be [triggered to run on the default branch][events_triggering_workflows], which complicates testing changes to the reusable workflow.
  - [ ] When the workflow is run with matrix strategy, the output is set by the [last successfully completed job][reusable_workflow_outputs] rather than a combination of all jobs.

## Contributions

All forms of contribution are very welcome and deeply appreciated for fostering open-source software.

- Please [create a PR][pull_request] to contribute changes you'd like to see.
- Please [raise an issue][issue] to discuss proposed changes or report unexpected behavior.
- Please [open a discussion][discussion] to share ideas about where you'd like to see this project go.
- Please [consider becoming a stargazer][stargazer] if you find this project useful.

## License

- This project is licensed under the permissive [Apache License 2.0][license].
- All works herein are my own and shared of my own volition.
- Copyright 2023 [Rishav Dhar][rishav_dhar] — All wrongs reserved.

[caller_aws_yml]: https://github.com/devsectop/tf-via-pr/blob/main/.github/workflows/caller_aws.yml "Example workflow for running TF commands with AWS credentials."
[caller_yml]: https://github.com/devsectop/tf-via-pr/blob/main/.github/workflows/caller.yml "Example workflow for running TF commands."
[compare_reusable_workflow_with_composite_actions]: https://github.blog/2022-02-10-using-reusable-workflows-github-actions "Using reusable workflows vs. composite actions."
[configure_aws_credentials]: https://github.com/aws-actions/configure-aws-credentials "Configuring AWS credentials for use in GitHub Actions."
[configure_oidc]: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-cloud-providers "Configuring OpenID Connect in cloud providers."
[deployment_protection]: https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment#deployment-protection-rules "Configuring environment deployment protection rules."
[discussion]: https://github.com/devsectop/tf-via-pr/discussions "Open a discussion."
[events_triggering_workflows]: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows "Events that trigger workflows."
[github_codespaces]: https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers "Introduction to GitHub Codespaces."
[issue]: https://github.com/devsectop/tf-via-pr/issues "Raise an issue."
[license]: LICENSE "Apache License 2.0."
[opentofu_org]: https://opentofu.org "Open-source Terraform-compatible IaC tool."
[pr_example_1]: https://github.com/devsectop/tf-via-pr/pull/121 "Example PR for this use-case scenario."
[pr_example_2]: https://github.com/devsectop/tf-via-pr/pull/122 "Example PR for this use-case scenario."
[pull_request]: https://github.com/devsectop/tf-via-pr/pulls "Create a pull request."
[reusable_workflow_outputs]: https://docs.github.com/en/actions/using-workflows/reusing-workflows#using-outputs-from-a-reusable-workflow "Using outputs from a reusable workflow."
[rishav_dhar]: https://github.com/rdhar "Rishav Dhar's GitHub profile."
[securing_github_actions]: https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#using-third-party-actions "Security hardening for GitHub Actions."
[semver]: https://www.npmjs.com/package/semver#ranges "Semantic versioning ranges."
[stargazer]: https://github.com/devsectop/tf-via-pr/stargazers "Become a stargazer."
[ternary_operator]: https://docs.github.com/en/actions/learn-github-actions/expressions#example "Example of ternary operator-like behavior in GitHub Actions expressions."
[terraform_io]: https://www.terraform.io "Terraform by Hashicorp."
[tf_yml]: https://github.com/devsectop/tf-via-pr/blob/main/.github/workflows/tf.yml "Reusable workflow for running TF commands."
