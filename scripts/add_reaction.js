module.exports = async ({ github, context, core }) => {
  // Add a reaction to the triggering comment to indicate it is being processed.
  const { data: add_reaction } = await github.rest.reactions.createForIssueComment({
    comment_id: process.env.comment_id,
    content: "eyes",
    owner: context.repo.owner,
    repo: context.repo.repo,
  });

  core.setOutput("id", add_reaction.id);
};
