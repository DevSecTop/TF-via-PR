module.exports = async ({ github, context, core, exec }) => {
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
  const job_name = `${context.job}${matrix ? ` (${Object.values(matrix).join(", ")})` : ""}`;
  const check_url = workflow_run.jobs.find((job) => job.name === job_name).html_url;
  const check_id = workflow_run.jobs.find((job) => job.name === job_name).id;

  // Update the check status with TF output summary.
  const update_check_status = await github.rest.checks.update({
    check_run_id: check_id,
    output: {
      summary: comment_summary,
      title: comment_summary,
    },
    owner: context.repo.owner,
    repo: context.repo.repo,
  });

  // Parse the TFplan file to extract an outline of changes.
  let comment_outline = "";
  if (process.env.tf_plan_outline === "true") {
    // Parse TFplan file.
    let tfplan = "";
    const data_handler = (data) => {
      tfplan += data.toString();
    };
    const options = {
      listeners: {
        stdout: data_handler,
        stderr: data_handler,
      },
    };
    await exec.exec(process.env.TF_CLI_USES, [`-chdir=${process.env.tf_chdir}`, "show", "-no-color", "tfplan"], options);

    // Create a summary from lines starting with '  # ' without this prefix.
    // Re-prefix the lines with diff indicators based on the change type.
    const changed_lines = tfplan
      .split("\n")
      .filter((line) => line.startsWith("  # "))
      .map((line) => {
        const diff_line = line.slice(4);
        if (diff_line.includes(" created")) return "+ " + diff_line;
        if (diff_line.includes(" destroyed")) return "- " + diff_line;
        if (diff_line.includes(" updated") || diff_line.includes(" replaced")) return "! " + diff_line;
        return "# " + diff_line;
      });

    // Create a collapsible summary of changes if any.
    comment_outline = changed_lines.length
      ? `<details><summary>Outline of changes.</summary>

\`\`\`diff
${changed_lines.join("\n").substring(0, 12000)}
\`\`\`
</details>`
      : "";
  }

  // Display the: TF command, TF output, and workflow authorip.
  const comment_output = `
<details><summary>${comment_summary}</br>

###### ${context.workflow} by @${context.actor} via [${context.eventName}](${check_url}) at ${context.payload.pull_request?.updated_at || context.payload.comment?.updated_at || context.payload.merge_group?.head_commit.timestamp}.</summary>

\`\`\`hcl
${process.env.tf_output}
\`\`\`
</details>`;

  // Include the TFPLAN name in a hidden footer as a unique identifier.
  const comment_body = `
\`${process.env.tf_command}\`

<!-- pre_output -->

${comment_fmt}
${comment_outline}
${comment_output}

<!-- post_output -->

<!-- ${process.env.tf_plan_id} -->`;

  // Display the comment body as a job summary.
  core.summary.addRaw(comment_body);
  core.summary.write();

  // Determine PR number from non-'pull_request' or non-'issue_comment' events.
  let pr_number = '';
  if (context.eventName === "merge_group") {
    pr_number = parseInt(context.ref.split("/pr-")[1]);
  }

  // Check if the bot has commented on the PR using the TFPLAN identifier.
  const { data: list_comments } = await github.rest.issues.listComments({
    issue_number: context.issue.number || pr_number,
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
        issue_number: context.issue.number || pr_number,
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
      issue_number: context.issue.number || pr_number,
    });
    core.setOutput("id", pr_comment.id);
  }
};
