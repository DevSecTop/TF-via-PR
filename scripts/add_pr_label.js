module.exports = async ({ github, context, label, cli_uses }) => {
  // Add a TF command label to the pull request.
  const add_label = await github.rest.issues.addLabels({
    issue_number: context.issue.number,
    labels: [`tf:${label}`],
    owner: context.repo.owner,
    repo: context.repo.repo,
  });

  // Update the TF command label color to match the CLI used.
  const color = cli_uses === "tofu" ? "FFDA18" : "5C4EE5";
  const update_label = await github.rest.issues.updateLabel({
    color: color,
    description: `Pull requests that ${label} TF code`,
    name: `tf:${label}`,
    owner: context.repo.owner,
    repo: context.repo.repo,
  });
};
