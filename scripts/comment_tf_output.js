module.exports = async ({ github, context, core }) => {
  // Display latest TF change summary as the output header.
  const comment_summary = process.env.tf_output
    .split("\n")
    .reverse()
    .find((line) => /^(Apply|Plan|Error|No changes)/.test(line)) || "View output…";
  core.setOutput("summary", comment_summary);

  // Display truncated TF fmt diff, if present.
  const comment_fmt = process.env.tf_fmt
    ? `<details><summary>Format check diff.</summary>

\`\`\`diff
${process.env.tf_fmt}
\`\`\`
</details>`
    : "";

  // Resolve the job URL for the footer, accounting for matrix strategy.
  const { data: workflow_run } = await github.rest.actions.listJobsForWorkflowRunAttempt({
    attempt_number: process.env.run_attempt,
    owner: context.repo.owner,
    repo: context.repo.repo,
    run_id: context.runId,
  });
  const matrix = JSON.parse(process.env.matrix);
  const job = workflow_run.jobs.find((job) => job.run_id === context.runId).name;
  const job_name = `${job}${matrix ? ` (${Object.values(matrix).join(", ")})` : ""}`;
  const job_url = workflow_run.jobs.find((job) => job.name === job_name).html_url;

  // Display the: TF command, TF output, and workflow authorip.
  const comment_output = `
  <details><summary>${comment_summary}</br>

###### ${context.workflow} by @${context.actor} via [${context.eventName}](${job_url}) at ${context.payload.pull_request?.updated_at || context.payload.comment?.updated_at}.</summary>

\`\`\`hcl
${process.env.tf_output}
\`\`\`
</details>`;

  // Include the TFPLAN name in a hidden footer as a unique identifier.
  const comment_body = `
\`${process.env.tf_command}\`

<!-- pre_output -->

${comment_fmt}
${comment_output}

<!-- post_output -->

<!-- ${process.env.tf_plan_id} -->`;

  // Check if the bot has commented on the PR using the TFPLAN identifier.
  const { data: list_comments } = await github.rest.issues.listComments({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    per_page: 100,
    repo: context.repo.repo,
  });
  const bot_comment = list_comments.find((comment) => {
    return comment.user.type === "Bot" && comment.body.includes(`<!-- ${process.env.tf_plan_id} -->`);
  });

  // Define common parameters for the PR comment.
  const comment_parameters = {
    body: comment_body,
    owner: context.repo.owner,
    repo: context.repo.repo,
  };

  // If a bot comment exists with a matching TFPLAN identifier, then edit it to
  // reflect the latest TF output, otherwise create a new comment by default.
  // If recreate_comment is true, then delete the existing comment
  // before creating a new one.
  if (bot_comment) {
    if (process.env.recreate_comment === "true") {
      await github.rest.issues.deleteComment({
        ...comment_parameters,
        comment_id: bot_comment.id,
      });
      const { data: pr_comment } = await github.rest.issues.createComment({
        ...comment_parameters,
        issue_number: context.issue.number,
      });
      core.setOutput("id", pr_comment.id);
    } else {
      const { data: pr_comment } = await github.rest.issues.updateComment({
        ...comment_parameters,
        comment_id: bot_comment.id,
      });
      core.setOutput("id", pr_comment.id);
    }
  } else {
    const { data: pr_comment } = await github.rest.issues.createComment({
      ...comment_parameters,
      issue_number: context.issue.number,
    });
    core.setOutput("id", pr_comment.id);
  }
};
