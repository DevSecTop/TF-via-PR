module.exports = async ({ context, core, exec, github }) => {
  // Get PR number from event trigger for unique identifier.
  const get_pr_number = () => {
    if (context.eventName === "pull_request") {
      console.log("context.ref", context.ref);
      console.log("context.ref.split", context.ref.split("/pr-"));
      return context.issue.number;
    } else if (context.eventName === "merge_group") {
      // context.issue.number || github.event.number || github.event.issue.number
      console.log("context.ref", context.ref);
      console.log("context.ref.split", context.ref.split("/pr-"));
      return parseInt(context.ref.split("/pr-")[1]);
    } else if (context.eventName === "push") {
      console.log("context.ref", context.ref);
      console.log("context.ref.split", context.ref.split("/pr-"));
      return "";
    }
  };
  const pr_number = get_pr_number();

  // Unique identifier of the TF run for later retrieval.
  const tf_identifier = [
    pr_number,
    process.env.arg_chdir,
    process.env.arg_backend_config,
    process.env.arg_workspace,
    process.env.arg_var_file,
    process.env.arg_destroy,
    process.env.tf_cli_tool,
    process.env.arg_out,
  ]
    .filter((arg) => arg)
    .map((arg) => String(arg).replace(/[^a-zA-Z0-9]/g, "-"))
    .join("-");
  core.setOutput("tf_identifier", tf_identifier);

  // Capture TF CLI in/output.
  let tf_cli_input,
    tf_cli_output,
    tf_init_output,
    tf_workspace_output,
    tf_validate_output,
    tf_fmt_output,
    tf_plan_output,
    tf_apply_output,
    output_plan_outline,
    output_summary,
    arguments = "";
  const data_handler = (data) => {
    tf_cli_output += data.toString();

    // Filter output to drop state refresh information.
    output_concise = tf_cli_output
      .split("\n")
      .filter(
        (line) =>
          !/(: Creating...|: Creation complete after|: Destroying...|: Destruction complete after|: Modifications complete after|: Modifying...|: Provisioning with|: Read complete after|: Reading...|: Refreshing state...|: Still creating...|: Still destroying...|: Still modifying...|: Still reading...|. This may take a few moments...)/.test(
            line
          )
      )
      .join("\n");
    if (output_concise.length >= 48e3) {
      output_concise = output_concise.substring(0, 48e3) + "…";
    }
    core.setOutput("output_concise", output_concise);

    // Capture output summary.
    output_summary =
      tf_cli_output
        .split("\n")
        .reverse()
        .find((line) => /^(Apply|Plan|Error|No changes)/.test(line)) ||
      "View details…";
    core.setOutput("output_summary", output_summary);

    // Generate plan outline.
    if (
      process.env.arg_command === "plan" &&
      /^true$/i.test(process.env.plan_outline)
    ) {
      output_plan_outline = tf_cli_output
        .split("\n")
        .filter((line) => line.startsWith("  # "))
        .map((line) => {
          const diff_line = line.slice(4);
          if (diff_line.includes(" created")) return "+ " + diff_line;
          if (diff_line.includes(" destroyed")) return "- " + diff_line;
          if (diff_line.includes(" updated") || diff_line.includes(" replaced"))
            return "! " + diff_line;
          return "# " + diff_line;
        })
        .join("\n");
      if (output_plan_outline.length >= 12e3) {
        output_plan_outline = output_plan_outline.substring(0, 12e3) + "…";
      }
      core.setOutput("output_plan_outline", output_plan_outline);
    }
  };
  const listeners = {
    listeners: {
      stdout: data_handler,
      stderr: data_handler,
    },
  };

  try {
    // TF init if not cached.
    if (!/^true$/i.test(process.env.cache_hit)) {
      arguments = [
        process.env.arg_chdir,
        "init",
        process.env.arg_backend,
        process.env.arg_cloud,
        process.env.arg_backend_config,
        process.env.arg_force_copy,
        process.env.arg_from_module,
        process.env.arg_get,
        process.env.arg_lock,
        process.env.arg_lock_timeout,
        process.env.arg_plugin_dir,
        process.env.arg_reconfigure,
        process.env.arg_migrate_state,
        process.env.arg_upgrade,
        process.env.arg_lockfile,
        process.env.arg_test_directory,
      ].filter((arg) => arg);
      tf_cli_input = ["init", process.env.arg_chdir]
        .concat(arguments.slice(2))
        .join(" ");
      await exec.exec(process.env.tf_cli_tool, arguments, listeners);
      tf_init_output = tf_cli_output;
      tf_cli_output = "";
    }

    // Select or create TF workspace if specified.
    if (process.env.arg_workspace) {
      arguments = [
        process.env.arg_chdir,
        "workspace",
        "select",
        process.env.arg_or_create,
        process.env.arg_workspace,
      ].filter((arg) => arg);
      tf_cli_input = ["workspace", process.env.arg_chdir, "select"]
        .concat(arguments.slice(3))
        .join(" ");
      await exec.exec(process.env.tf_cli_tool, arguments, listeners);
      tf_workspace_output = tf_cli_output;
      tf_cli_output = "";
    }

    // TF validate.
    if (/^true$/i.test(process.env.validate_enable)) {
      arguments = [
        process.env.arg_chdir,
        "validate",
        process.env.arg_json,
        process.env.arg_no_tests,
        process.env.arg_test_directory,
      ].filter((arg) => arg);
      tf_cli_input = ["validate", process.env.arg_chdir]
        .concat(arguments.slice(2))
        .join(" ");
      await exec.exec(process.env.tf_cli_tool, arguments, listeners);
      tf_validate_output = tf_cli_output;
      tf_cli_output = "";
    }

    // TF fmt.
    if (
      process.env.arg_command === "plan" &&
      /^true$/i.test(process.env.fmt_enable)
    ) {
      arguments = [
        process.env.arg_chdir,
        "fmt",
        process.env.arg_list,
        process.env.arg_write,
        process.env.arg_diff,
        process.env.arg_check,
        process.env.arg_recursive,
      ].filter((arg) => arg);
      tf_cli_input = ["fmt", process.env.arg_chdir]
        .concat(arguments.slice(2))
        .join(" ");
      await exec.exec(process.env.tf_cli_tool, arguments, listeners);
      tf_fmt_output = tf_cli_output;
      if (tf_fmt_output.length >= 6e3) {
        tf_fmt_output = tf_fmt_output.substring(0, 6e3) + "…";
      }
      core.setOutput("tf_fmt_output", tf_fmt_output);
      tf_cli_output = "";
    }

    // Add PR label of the TF command specified.
    if (pr_number && /^true$/i.test(process.env.label_pr)) {
      await github.rest.issues.addLabels({
        issue_number: pr_number,
        labels: [`tf:${process.env.arg_command}`],
        owner: context.repo.owner,
        repo: context.repo.repo,
      });
      await github.rest.issues.updateLabel({
        color: "5C4EE5",
        description: `Pull requests that ${process.env.arg_command} TF code`,
        name: `tf:${process.env.arg_command}`,
        owner: context.repo.owner,
        repo: context.repo.repo,
      });
    }

    // TF plan.
    if (process.env.arg_command === "plan") {
      arguments = [
        process.env.arg_chdir,
        "plan",
        process.env.arg_out,
        process.env.arg_compact_warnings,
        process.env.arg_concise,
        process.env.arg_destroy,
        process.env.arg_detailed_exitcode,
        process.env.arg_generate_config_out,
        process.env.arg_json,
        process.env.arg_lock_timeout,
        process.env.arg_lock,
        process.env.arg_parallelism,
        process.env.arg_refresh_only,
        process.env.arg_refresh,
        process.env.arg_replace,
        process.env.arg_target,
        process.env.arg_var_file,
        process.env.arg_var,
      ].filter((arg) => arg);
      tf_cli_input = ["plan", process.env.arg_chdir]
        .concat(arguments.slice(3))
        .join(" ");
      await exec.exec(process.env.tf_cli_tool, arguments, listeners);
      tf_plan_output = tf_cli_output;
    }

    // TF apply.
    if (process.env.arg_command === "apply") {
      // Download the TF plan file if not auto-approved.
      if (!/^true$/i.test(process.env.auto_approve)) {
        process.env.arg_auto_approve = process.env.arg_out.replace(
          /^-out=/,
          ""
        );
        process.env.arg_var_file = process.env.arg_var = "";

        // List artifacts for the TF identifier.
        const { data: list_artifacts } =
          await github.rest.actions.listArtifactsForRepo({
            name: tf_identifier,
            owner: context.repo.owner,
            repo: context.repo.repo,
          });

        // Get the latest TF plan artifact download URL.
        const download_artifact = await github.rest.actions.downloadArtifact({
          archive_format: "zip",
          artifact_id: list_artifacts.artifacts[0].id,
          owner: context.repo.owner,
          repo: context.repo.repo,
        });

        // Download and unzip the TF plan artifact.
        await exec.exec("curl", [
          "--no-progress-meter",
          "--location",
          download_artifact.url,
          "--output",
          tf_identifier,
        ]);
        await exec.exec("unzip", [
          tf_identifier,
          "-d",
          process.env.arg_chdir.replace(/^-chdir=/, ""),
        ]);
      }
      arguments = [
        process.env.arg_chdir,
        "apply",
        process.env.arg_backup,
        process.env.arg_compact_warnings,
        process.env.arg_destroy,
        process.env.arg_detailed_exitcode,
        process.env.arg_json,
        process.env.arg_lock_timeout,
        process.env.arg_lock,
        process.env.arg_parallelism,
        process.env.arg_refresh_only,
        process.env.arg_refresh,
        process.env.arg_replace,
        process.env.arg_state_out,
        process.env.arg_state,
        process.env.arg_target,
        process.env.arg_var_file,
        process.env.arg_var,
        process.env.arg_auto_approve,
      ].filter((arg) => arg);
      tf_cli_input = ["apply", process.env.arg_chdir]
        .concat(arguments.slice(2, -1))
        .join(" ");
      await exec.exec(process.env.tf_cli_tool, arguments, listeners);
      tf_apply_output = tf_cli_output;
    }
  } finally {
    // Resolve the job URL for the footer, accounting for matrix strategy.
    const { data: workflow_run } =
      await github.rest.actions.listJobsForWorkflowRunAttempt({
        attempt_number: process.env.GITHUB_RUN_ATTEMPT,
        owner: context.repo.owner,
        repo: context.repo.repo,
        run_id: context.runId,
        per_page: 100,
      });
    const check_id =
      workflow_run.jobs.find((job) =>
        process.env.MATRIX.length
          ? job.name.includes(
              Object.values(JSON.parse(process.env.MATRIX)).join(", ")
            )
          : job.name.toLowerCase() === context.job
      ).id || workflow_run.jobs[0].id;
    const check_url = workflow_run.jobs.find(
      (job) => job.id === check_id
    ).html_url;

    // Update the check status with TF output summary.
    await github.rest.checks.update({
      check_run_id: check_id,
      output: {
        summary: output_summary,
        title: output_summary,
      },
      owner: context.repo.owner,
      repo: context.repo.repo,
    });

    if (pr_number && /^true$/i.test(process.env.comment_pr)) {
      const comment_header = `\`\`\`fish
${tf_cli_input}
\`\`\``;

      const comment_fmt = tf_fmt_output.length
        ? `<details><summary>Format diff check.</summary>

\`\`\`diff
${tf_fmt_output}
\`\`\`
</details>`
        : "";

      const comment_outline =
        process.env.arg_command === "plan" &&
        /^true$/i.test(process.env.plan_outline) &&
        output_plan_outline.length
          ? `<details><summary>Outline of changes.</summary>

\`\`\`diff
${output_plan_outline}
\`\`\`
</details>`
          : "";

      const comment_details = `
\`\`\`hcl
${output_concise}
\`\`\``;

      const comment_authorship = `###### ${context.workflow} by @${
        context.actor
      } via [${context.eventName}](${check_url}) at ${
        context.payload.pull_request.updated_at ||
        context.payload.merge_group.head_commit.timestamp
      }.`;

      const comment_main = `
<details><summary>${output_summary}</br>

${comment_authorship}
</summary>
${comment_details}
</details>`;

      const comment_body = `
${comment_header}
${comment_fmt}
${comment_outline}
${comment_main}
<!-- ${tf_identifier} -->`;

      // Check if the PR contains a bot comment with the TF identifier.
      const { data: list_comments } = await github.rest.issues.listComments({
        issue_number: pr_number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        per_page: 100,
      });
      const bot_comment = list_comments.find((comment) => {
        return (
          comment.user.type === "Bot" &&
          comment.body.includes(`<!-- ${tf_identifier} -->`)
        );
      });

      // If a bot comment exists with a matching TF identifier, then either edit
      // it to reflect the latest TF output or create a new comment and delete
      // the existing one. Otherwise create a new comment.
      if (bot_comment) {
        if (/^true$/i.test(process.env.update_comment)) {
          const { data: pr_comment } = await github.rest.issues.updateComment({
            body: comment_body,
            comment_id: bot_comment.id,
            owner: context.repo.owner,
            repo: context.repo.repo,
          });
          core.setOutput("comment_id", pr_comment.id);
        } else {
          await github.rest.issues.deleteComment({
            comment_id: bot_comment.id,
            owner: context.repo.owner,
            repo: context.repo.repo,
          });
          const { data: pr_comment } = await github.rest.issues.createComment({
            body: comment_body,
            issue_number: pr_number,
            owner: context.repo.owner,
            repo: context.repo.repo,
          });
          core.setOutput("comment_id", pr_comment.id);
        }
      } else {
        const { data: pr_comment } = await github.rest.issues.createComment({
          body: comment_body,
          issue_number: pr_number,
          owner: context.repo.owner,
          repo: context.repo.repo,
        });
        core.setOutput("comment_id", pr_comment.id);
      }
    }
  }
};
