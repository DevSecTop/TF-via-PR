module.exports = async ({ github, context }) => {
  // Remove the reaction from the triggering comment to indicate that the workflow has ended.
  const remove_reaction = await github.rest.reactions.deleteForIssueComment({
    comment_id: process.env.comment_id,
    owner: context.repo.owner,
    reaction_id: process.env.reaction_id,
    repo: context.repo.repo,
  });
};
