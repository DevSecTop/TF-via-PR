module.exports = async ({ github, context, core, tf_plan_id }) => {
  // Fetch the list of artifacts which match the TF plan ID.
  const { data: list_artifacts } = await github.rest.actions.listArtifactsForRepo({
    name: tf_plan_id,
    owner: context.repo.owner,
    per_page: 100,
    repo: context.repo.repo,
  });

  // Download the latest relevant TF plan artifact.
  const download_artifact = await github.rest.actions.downloadArtifact({
    archive_format: "zip",
    artifact_id: list_artifacts.artifacts[0].id,
    owner: context.repo.owner,
    repo: context.repo.repo,
  });

  core.setOutput("link", download_artifact.url);
};
