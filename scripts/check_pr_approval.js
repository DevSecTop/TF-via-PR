module.exports = async ({ github, context, core }) => {
  // Fetch the pull request to get the list of reviews.
  const { data: list_reviews } = await github.rest.pulls.listReviews({
    owner: context.repo.owner,
    pull_number: context.issue.number,
    repo: context.repo.repo,
  });

  // Check if the latest review is approved.
  if (list_reviews.at(-1)?.state !== "APPROVED") {
    core.setFailed("PR review approval is required when apply_require_approval is set to true.");
  }
};
