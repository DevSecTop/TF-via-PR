module.exports = async ({ github, context }) => {
  // Add a TF command label to the pull request.
  const add_label = await github.rest.issues.addLabels({
    issue_number: context.issue.number,
    labels: [`tf:${process.env.label}`],
    owner: context.repo.owner,
    repo: context.repo.repo,
  });

  // Update the TF command label color to match the CLI used.
  const color = "5C4EE5"; // process.env.TOFU_CLI_PATH ? "FFDA18" : "5C4EE5";
  const update_label = await github.rest.issues.updateLabel({
    color: color,
    description: `Pull requests that ${process.env.label} TF code`,
    name: `tf:${process.env.label}`,
    owner: context.repo.owner,
    repo: context.repo.repo,
  });
};
