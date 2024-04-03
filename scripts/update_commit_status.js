module.exports = async ({ github, context }) => {
  // Update the commit status with the job status before exiting.
  const add_pending_status = await github.rest.repos.createCommitStatus({
    context: context.workflow,
    owner: context.repo.owner,
    repo: context.repo.repo,
    sha: process.env.sha,
    state: process.env.job_status,
    target_url: `${context.payload.repository.html_url}/actions/runs/${context.runId}`,
  });
};
