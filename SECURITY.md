# Security Policy

Integrating security in your CI/CD pipeline is critical to practicing DevSecOps. This action aims to be secure by default, and it should be complemented with your own review to ensure it meets your (organization's) security requirements.

- Action dependencies are maintained by GitHub and [pinned to a specific SHA][securing_github_actions]: [actions/cache](https://github.com/actions/cache), [actions/github-script](https://github.com/actions/github-script) and [actions/upload-artifact](https://github.com/actions/upload-artifact).
- Restrict changes to certain environments with [deployment protection rules][deployment_protection] so that approval is required before changes to the infrastructure can be applied.
- Ease of integration with [OpenID Connect][configure_oidc] by passing short-lived credentials as environment variables to the workflow.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| v11.X   | Yes       |
| ≤ v0.X  | No        |

## Reporting a Vulnerability

You must never report security related issues, vulnerabilities or bugs including sensitive information to the issue tracker, or elsewhere in public. Instead sensitive bugs must be sent by email to <security@devsec.top> or reported via [Security Advisory](https://github.com/devsectop/tf-via-pr/security/advisories/new).

[configure_oidc]: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-cloud-providers "Configuring OpenID Connect in cloud providers."
[deployment_protection]: https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment#deployment-protection-rules "Configuring environment deployment protection rules."
[securing_github_actions]: https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#using-third-party-actions "Security hardening for GitHub Actions."
