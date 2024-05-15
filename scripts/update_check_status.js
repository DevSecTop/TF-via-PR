module.exports = async ({ github, context }) => {
  // Update the check status with the job summary before exiting.
  const update_check_status = await github.rest.checks.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    check_run_id: process.env.check_id,
    output: {
      summary: "OUTPUT SUMMARY",
      text: process.env.tf_summary,
      title: "OUTPUT TITLE.",
    },
  });
};
