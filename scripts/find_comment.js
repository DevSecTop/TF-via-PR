module.exports = async ({ github, context, core }) => {
  // Fetch comments from the pull request.
  const { data: list_comments } = await github.rest.issues.listComments({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    per_page: 100,
    repo: context.repo.repo,
  });

  // Identify the latest comment starting with "-tf=plan".
  const get_comment = list_comments
    .sort((a, b) => b.id - a.id)
    .find((comment) => /^-tf=plan/.test(comment.body));

  core.setOutput("body", get_comment.body);
  core.setOutput("id", get_comment.id);
};
