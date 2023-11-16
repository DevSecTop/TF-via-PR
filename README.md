# Terraform/OpenTofu Via Pull Request Comments

> [!IMPORTANT]
>
> Plan and apply changes to Terraform or OpenTofu (TF) configurations via pull request (PR) comments: for a CLI-like experience on the web. Powered by GitHub Actions to maximize compatibility and minimize maintenance for DIY deployments.

[Overview](#overview) · [Usage](#usage) [[Workflow](#workflow) · [Examples](#examples) · [Parameters](#parameters)] · [Security](#security) · [Contributions](#contributions) · [License](#license)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/screenshot_dark.png">
  <source media="(prefers-color-scheme: light)" srcset="assets/screenshot_light.png">
  <img alt="Shows a screenshot of PR conversation with the author triggering the workflow using a TF command within a comment and github-actions bot responding with the aforementioned TF command's output in a subsequent comment." src="assets/screenshot_dark.png">
</picture>

## Overview

<details><summary>Terraform and OpenTofu are platform-agnostic tools for managing cloud and on-prem resources by provisioning infrastructure as code (IaC).</summary>

- Enables you to define resources in human-readable configuration files that can be version controlled and shared for consistent state management.
- Both [Hashicorp][terraform_io] `terraform` and [OpenTofu][opentofu_org] `tofu` CLIs are supported, with the latter offering an open-source and backwards-compatible drop-in replacement for the former.

</details>

<details><summary>Best suited for DevOps and Platform engineers who want to empower their teams to self-service TF without the overhead of self-hosting runners, containers or VMs like <a href="https://www.runatlantis.io" title="Atlantis Terraform pull request automation.">Atlantis</a>.</summary>

- [Environment deployment protection rules][deployment_protection] mitigate the risk of erroneous changes along with standardized approval requirements.
- Each PR and associated workflow run holds a complete log of infrastructure changes for ease of collaborative debugging as well as audit compliance.

</details>

<details><summary><a href="https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions" title="Introduction to GitHub Actions.">GitHub Actions</a> (GHA) is a continuous integration and continuous deployment (CI/CD) platform that enables you to automate your project's pipelines with custom workflows.</summary>

- This repository hosts a [composite action][action_yml] that parses PR comments for TF commands and runs them on GitHub's ephemeral runners.
- Also supports [GitHub Codespaces][github_codespaces] dev container, which offers a tailored TF development environment, complete with tools and runtimes to lower the barrier to entry for contributors.

</details>

## Usage

### Workflow

- A functional workflow is provided in "[.github/workflows/tf.yml][tf_yml]", including recommended permissions and event triggers.
- Here is a simplified snippet to get started, with the full list of inputs documented [below](#inputs).

```yml
on:
  issue_comment:
    types: [created, edited]
  pull_request:
    types: [synchronize]
    paths: ["**/*.tf*"]
...
steps:
  - name: Provision TF
    uses: devsectop/tf-via-pr@v9
    with:
      cli_uses: "terraform"
      cli_version: "~1.6"
```

> [!NOTE]
>
> - Pin your workflow version to a specific release tag or SHA to harden your CI/CD pipeline [security](#security) against supply chain attacks.
> - Environment variables are automatically assumed, enabling cloud provider authentication (e.g., preceding [aws-actions/configure-aws-credentials][configure_aws_credentials] action can be used to pass short-lived credentials).

### Examples

Use-case scenario: Provision resources in a workspaces with input variables, followed by targeted destruction. [View PR in situ][pr_example_1].

```bash
#1 PR Comment: Plan configuration in a workspace with a variable file.
-tf=plan -chdir=stacks/sample_instance -workspace=dev -var-file=env/dev.tfvars

#2 PR Comment: Apply configuration in a workspace with a variable file.
-tf=apply -chdir=stacks/sample_instance -workspace=dev -var-file=env/dev.tfvars

#3 PR Comment: Plan destruction of targeted resources in a workspace with a variable file.
-tf=plan -destroy -target=aws_instance.sample,data.aws_ami.ubuntu -chdir=stacks/sample_instance -workspace=dev -var-file=env/dev.tfvars

#4 PR Comment: Apply destruction of targeted resources in a workspace with a variable file.
-tf=apply -destroy -target=aws_instance.sample,data.aws_ami.ubuntu -chdir=stacks/sample_instance -workspace=dev -var-file=env/dev.tfvars
```

Use-case scenario: Provision resources with a backend, followed by destruction without confirmation, simultaneously. [View PR in situ][pr_example_2].

```bash
#1 PR Comment: Plan configuration with a backend file.
-tf=plan -chdir=stacks/sample_bucket -backend-config=backend/dev.tfbackend

#2 PR Comment: Apply configuration with a backend file.
-tf=apply -chdir=stacks/sample_bucket -backend-config=backend/dev.tfbackend

#3 PR Comment: Destroy configuration with a backend file without confirmation.
-tf=apply -destroy -auto-approve -chdir=stacks/sample_bucket -backend-config=backend/dev.tfbackend
```

### Parameters

#### Inputs

| Name                                               | Description                                                                                                                              |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `apply_require_approval`</br>Default: false        | Boolean flag to require PR review approval for TF apply commands or consider [deployment protection rules][deployment_protection].       |
| `backend_config_from_workspace`</br>Default: false | Boolean flag to re-use TF `-workspace` as `-backend-config` argument, if supplied.                                                       |
| `backend_config_prefix`</br>Example: ../backend/   | String prefix for TF `-backend-config` argument, if `-backend-config` (or `-workspace` and `backend_config_from_workspace`) is supplied. |
| `backend_config_suffix`</br>Example: .tfbackend    | String suffix for TF `-backend-config` argument, if `-backend-config` (or `-workspace` and `backend_config_from_workspace`) is supplied. |
| `chdir_prefix`</br>Example: stacks/                | String prefix for TF `-chdir` argument. This is a global option that switches to a different directory.                                  |
| `cli_hostname`</br>Example: app.terraform.io       | Hostname of TF cloud/enterprise instance to place within the credentials block of TF CLI configuration.                                  |
| `cli_token`</br>Example: xyz…                      | API token for TF cloud/enterprise instance to place within the credentials block of TF CLI configuration.                                |
| `cli_uses`</br>Default: terraform                  | String to choose TF CLI, from: `terraform` and `tofu`.                                                                                   |
| `cli_version`</br>Default: latest                  | Version of TF CLI to install, supporting [semver ranges][semver].                                                                        |
| `fmt_enable`</br>Default: true                     | Boolean flag to enable TF fmt command and display diff of changes.                                                                       |
| `validate_enable`</br>Default: true                | Boolean flag to enable TF validate command check.                                                                                        |
| `var_file_from_workspace`</br>Default: false       | Boolean flag to re-use TF `-workspace` as `-var-file` argument, if supplied.                                                             |
| `var_file_prefix`</br>Example: ../env/             | String prefix for TF `-var-file` argument, if `-var-file` (or `-workspace` and `var_file_from_workspace`) is supplied.                   |
| `var_file_suffix`</br>Example: .tfvars             | String suffix for TF `-var-file` argument, if `-var-file` (or `-workspace` and `var_file_from_workspace`) is supplied.                   |

#### Outputs

| Name                                                          | Description                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| `command`</br>Example: `{tf:plan,chdir:stacks/sample_bucket}` | JSON object of the parsed command.                          |
| `plan_id`</br>Example: stacks-sample-bucket-tfplan            | String ID of the TF plan file artifact's unique identifier. |
| `tf_fmt`                                                      | String output of the truncated TF fmt command.              |
| `tf_output`                                                   | String output of the truncated last TF command.             |

## Security

Integrating security in your CI/CD pipeline is critical to practicing DevSecOps. This GHA aims to be secure by default, and it should be complemented with your own review to ensure it meets your (organization's) security requirements.

- All associated GHAs used in this workflow are [pinned to a specific SHA][securing_github_actions] to prevent supply chain attacks from third-party upstream dependencies.
- Restrict changes to certain environments with [deployment protection rules][deployment_protection] or `apply_require_approval` so that approval is required from authorized users/teams before changes to the infrastructure can be applied.
- Ease of integration with [OpenID Connect][configure_oidc] by passing short-lived credentials as environment variables to the workflow.

## Contributions

All forms of contribution are very welcome and deeply appreciated for fostering open-source projects.

- Please [create a PR][pull_request] to contribute changes you'd like to see.
- Please [raise an issue][issue] to discuss proposed changes or report unexpected behavior.
- Please [open a discussion][discussion] to share ideas about where you'd like to see this project go.
- Please [consider becoming a stargazer][stargazer] if you find this project useful.

## Changelog

- All notable changes to this project will be documented in human-friendly [releases][releases].
- The format is based on [Keep a Changelog](https://keepachangelog.com), and this project adheres to [Semantic Versioning](https://semver.org).

## License

- This project is licensed under the permissive [Apache License 2.0][license].
- All works herein are my own and shared of my own volition.
- Copyright 2023 [Rishav Dhar][rishav_dhar] — All wrongs reserved.

[action_yml]: https://github.com/devsectop/tf-via-pr/blob/main/.github/workflows/tf.yml "Composite action workflow for running TF commands via PR comments."
[configure_aws_credentials]: https://github.com/aws-actions/configure-aws-credentials "Configuring AWS credentials for use in GitHub Actions."
[configure_oidc]: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-cloud-providers "Configuring OpenID Connect in cloud providers."
[deployment_protection]: https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment#deployment-protection-rules "Configuring environment deployment protection rules."
[discussion]: https://github.com/devsectop/tf-via-pr/discussions "Open a discussion."
[github_codespaces]: https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers "Introduction to GitHub Codespaces."
[issue]: https://github.com/devsectop/tf-via-pr/issues "Raise an issue."
[license]: LICENSE "Apache License 2.0."
[opentofu_org]: https://opentofu.org "Open-source Terraform-compatible IaC tool."
[pr_example_1]: https://github.com/devsectop/tf-via-pr/pull/164 "Example PR for this use-case scenario."
[pr_example_2]: https://github.com/devsectop/tf-via-pr/pull/166 "Example PR for this use-case scenario."
[pull_request]: https://github.com/devsectop/tf-via-pr/pulls "Create a pull request."
[releases]: https://github.com/devsectop/tf-via-pr/releases "Releases."
[rishav_dhar]: https://github.com/rdhar "Rishav Dhar's GitHub profile."
[securing_github_actions]: https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#using-third-party-actions "Security hardening for GitHub Actions."
[semver]: https://www.npmjs.com/package/semver#ranges "Semantic versioning ranges."
[stargazer]: https://github.com/devsectop/tf-via-pr/stargazers "Become a stargazer."
[terraform_io]: https://www.terraform.io "Terraform by Hashicorp."
[tf_yml]: https://github.com/devsectop/tf-via-pr/blob/main/.github/workflows/tf.yml "Example workflow for running TF commands via PR comments with AWS authentication."
