module.exports = async ({ github, context, core }) => {
  // Fetch the pull request to get the head SHA.
  const { data: get_pull_request } = await github.rest.pulls.get({
    owner: context.repo.owner,
    pull_number: context.issue.number,
    repo: context.repo.repo,
  });

  // Add a pending status to the pull request.
  const add_pending_status = await github.rest.repos.createCommitStatus({
    context: context.workflow,
    owner: context.repo.owner,
    repo: context.repo.repo,
    sha: get_pull_request.head.sha,
    state: "pending",
    target_url: `${context.payload.repository.html_url}/actions/runs/${context.runId}`,
  });

  core.setOutput("sha", get_pull_request.head.sha);
};
