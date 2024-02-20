module.exports = async ({ github, context }) => {
  // Display latest TF change summary as the output header.
  const comment_summary = process.env.tf_output
    .split("\n")
    .reverse()
    .find((line) => /^(Apply|Plan|Error|No changes)/.test(line)) ||
    "View TF result…";

  // Display truncated TF fmt diff, if present.
  const comment_fmt = process.env.tf_fmt ?
    `<details><summary>Diff of format changes.</summary>

    \`\`\`diff
    ${process.env.tf_fmt}
    \`\`\`
    </details>` :
    "";

  // Display the: TF command, TF output, and workflow authorship.
  // Include the TFPLAN name in a hidden footer as a unique identifier.
  const comment_body = `
  \`${process.env.tf_command}\`
  ${comment_fmt}
  <details><summary>${comment_summary}</br>

  ###### ${context.workflow} by @${context.actor} via [${context.eventName}](${context.payload.repository.html_url}/actions/runs/${context.runId}) at ${context.payload.pull_request?.updated_at || context.payload.comment?.updated_at}.</summary>

  \`\`\`hcl
  ${process.env.tf_output}
  \`\`\`
  </details>
  <!-- ${process.env.tf_plan_id} -->`;

  // Check if the bot has commented on the PR using the TFPLAN identifier.
  const { data: list_comments } = await github.rest.issues.listComments({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    per_page: 100,
    repo: context.repo.repo,
  });
  const bot_comment = list_comments.find((comment) => {
    return (
      comment.user.type === "Bot" &&
      comment.body.includes(`<!-- ${process.env.tf_plan_id} -->`)
    );
  });

  // Delete PR comment reaction to indicate that the workflow has ended.
  const delete_reaction = await github.rest.reactions.deleteForIssueComment({
    comment_id: process.env.comment_id,
    owner: context.repo.owner,
    reaction_id: process.env.reaction_id,
    repo: context.repo.repo,
  });

  // If a bot comment exists with a matching TFPLAN identifier, then update
  // the comment, otherwise create a new comment. This prevents the bot
  // from creating a new comment on every run of this workflow.
  if (bot_comment) {
    await github.rest.issues.updateComment({
      body: comment_body,
      comment_id: bot_comment.id,
      owner: context.repo.owner,
      repo: context.repo.repo,
    });
  } else {
    await github.rest.issues.createComment({
      body: comment_body,
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
    });
  }
};
