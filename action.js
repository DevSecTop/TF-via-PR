module.exports = async ({ context, core, exec, github }) => {
  // Set character limits to fit within GitHub comments.
  const result_concise_limit = 48e3;
  const result_outline_limit = 12e3;
  const fmt_result_limit = 6e3;

  // Get PR number from event trigger for unique identifier.
  let pr_number;
  if (context.eventName === "push") {
    const { data: list_prs_of_commit } =
      await github.rest.repos.listPullRequestsAssociatedWithCommit({
        commit_sha: context.sha,
        owner: context.repo.owner,
        repo: context.repo.repo,
      });
    const pr =
      list_prs_of_commit.find((pr) => {
        return context.payload.ref === `refs/heads/${pr.head.ref}`;
      }) || list_prs_of_commit[0];
    pr_number = pr.number;
  } else if (context.eventName === "merge_group") {
    pr_number = parseInt(context.ref.split("/pr-")[1]);
  } else {
    pr_number = context.issue.number || 0;
  }

  // Check for Tofu CLI path.
  process.env.tf_tool = process.env.TOFU_CLI_PATH ? "tofu" : process.env.tf_tool;

  // Unique identifier of the TF run for later retrieval.
  const tf_identifier = [
    process.env.tf_tool,
    pr_number,
    process.env.arg_chdir,
    process.env.arg_workspace_alt,
    process.env.arg_backend_config,
    process.env.arg_var_file,
    process.env.arg_destroy,
    process.env.arg_out,
  ]
    .filter((arg) => arg)
    .map((arg) => String(arg).replace(/[^a-zA-Z0-9]/g, "-"))
    .join(".");
  core.setOutput("identifier", tf_identifier);

  // Capture TF command input and outputs.
  let cli_input, cli_result, fmt_result, result_concise, result_outline, result_summary;

  const data_handler = (data) => {
    cli_result += data.toString();

    // Filter result to drop state refresh information.
    result_concise = cli_result
      .split("\n")
      .filter(
        (line) =>
          !/(: Creating...|: Creation complete after|: Destroying...|: Destruction complete after|: Modifications complete after|: Modifying...|: Provisioning with|: Read complete after|: Reading...|: Refreshing state...|: Still creating...|: Still destroying...|: Still modifying...|: Still reading...|. This may take a few moments...)/.test(
            line
          )
      )
      .join("\n");
    if (result_concise?.length >= result_concise_limit) {
      result_concise = result_concise.substring(0, result_concise_limit) + "…";
    }
    core.setOutput("last_result", result_concise);

    // Capture result summary.
    result_summary =
      cli_result
        .split("\n")
        .reverse()
        .find((line) => /^(No changes|Error:|Apply|Plan:)/.test(line)) || "View details…";
    core.setOutput("summary", result_summary);
  };

  const listeners = {
    listeners: {
      stdout: data_handler,
      stderr: data_handler,
    },
  };

  // Function to execute TF commands.
  const exec_tf = async (input_arguments, input_header, input_header_slice) => {
    const arguments = input_arguments.filter((arg) => arg);
    const header = input_header.filter(
      (arg) => arg && !JSON.parse(process.env.hide_args).includes(arg)
    );
    cli_input = header.concat(arguments.slice(input_header_slice)).join(" ");
    cli_result = "";
    core.setOutput("header", cli_input);
    await exec.exec(process.env.tf_tool, arguments, listeners);
  };

  try {
    // TF init if not cached.
    if (!/^true$/i.test(process.env.cache_hit)) {
      await exec_tf(
        [
          process.env.arg_chdir,
          "init",
          process.env.arg_backend_config,
          process.env.arg_backend,
          process.env.arg_cloud,
          process.env.arg_force_copy,
          process.env.arg_from_module,
          process.env.arg_get,
          process.env.arg_lock_timeout,
          process.env.arg_lock,
          process.env.arg_lockfile,
          process.env.arg_migrate_state,
          process.env.arg_plugin_dir,
          process.env.arg_reconfigure,
          process.env.arg_test_directory,
          process.env.arg_upgrade,
        ],
        [
          "init",
          process.env.arg_chdir,
          process.env.arg_workspace_alt,
          process.env.arg_var_file,
          process.env.arg_destroy,
        ],
        2
      );
    }

    // Select or create TF workspace.
    if (process.env.arg_workspace) {
      await exec_tf(
        [
          process.env.arg_chdir,
          "workspace",
          "select",
          process.env.arg_or_create,
          process.env.arg_workspace,
        ],
        [
          "select",
          process.env.arg_chdir,
          process.env.arg_workspace_alt,
          process.env.arg_or_create,
          process.env.arg_backend_config,
          process.env.arg_var_file,
          process.env.arg_destroy,
        ],
        5
      );
    }

    // TF validate.
    if (/^true$/i.test(process.env.validate_enable)) {
      await exec_tf(
        [
          process.env.arg_chdir,
          "validate",
          process.env.arg_json,
          process.env.arg_no_tests,
          process.env.arg_test_directory,
        ],
        [
          "validate",
          process.env.arg_chdir,
          process.env.arg_workspace_alt,
          process.env.arg_backend_config,
          process.env.arg_var_file,
          process.env.arg_destroy,
        ],
        2
      );
    }

    // TF fmt.
    if (process.env.arg_command === "plan" && /^true$/i.test(process.env.fmt_enable)) {
      await exec_tf(
        [
          process.env.arg_chdir,
          "fmt",
          process.env.arg_list,
          process.env.arg_write,
          process.env.arg_diff,
          process.env.arg_check,
          process.env.arg_recursive,
        ],
        [
          "fmt",
          process.env.arg_chdir,
          process.env.arg_workspace_alt,
          process.env.arg_backend_config,
          process.env.arg_var_file,
          process.env.arg_destroy,
        ],
        2
      );

      fmt_result = cli_result;
      if (fmt_result?.length >= fmt_result_limit) {
        fmt_result = cli_result.substring(0, fmt_result_limit) + "…";
      }
      core.setOutput("fmt_result", fmt_result);
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
      await exec_tf(
        [
          process.env.arg_chdir,
          "plan",
          process.env.arg_out,
          process.env.arg_var_file,
          process.env.arg_destroy,
          process.env.arg_compact_warnings,
          process.env.arg_concise,
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
          process.env.arg_var,
        ],
        [
          "plan",
          process.env.arg_chdir,
          process.env.arg_workspace_alt,
          process.env.arg_backend_config,
        ],
        3
      );

      if (/^true$/i.test(process.env.outline_enable)) {
        result_outline = cli_result
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
        if (result_outline?.length >= result_outline_limit) {
          result_outline = result_outline.substring(0, result_outline_limit) + "…";
        }
        core.setOutput("outline", result_outline);
      }
    }

    // TF apply.
    if (process.env.arg_command === "apply") {
      // Download the TF plan file if not auto-approved.
      if (!/^true$/i.test(process.env.auto_approve)) {
        process.env.arg_auto_approve = process.env.arg_out.replace(/^-out=/, "");
        process.env.arg_var_file = process.env.arg_var = "";

        // List artifacts for the TF identifier.
        const { data: list_artifacts } = await github.rest.actions.listArtifactsForRepo({
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

      if (/^true$/i.test(process.env.outline_enable)) {
        await exec_tf(
          [process.env.arg_chdir, "show", process.env.arg_out.replace(/^-out=/, "")],
          [
            "show",
            process.env.arg_chdir,
            process.env.arg_workspace_alt,
            process.env.arg_backend_config,
            process.env.arg_var_file,
            process.env.arg_destroy,
          ],
          2
        );
        result_outline = cli_result
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
        if (result_outline?.length >= result_outline_limit) {
          result_outline = result_outline.substring(0, result_outline_limit) + "…";
        }
        core.setOutput("outline", result_outline);
      }

      await exec_tf(
        [
          process.env.arg_chdir,
          "apply",
          process.env.arg_var_file,
          process.env.arg_destroy,
          process.env.arg_backup,
          process.env.arg_compact_warnings,
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
          process.env.arg_var,
          process.env.arg_auto_approve,
        ],
        [
          "apply",
          process.env.arg_chdir,
          process.env.arg_workspace_alt,
          process.env.arg_backend_config,
        ],
        2
      );
    }
  } finally {
    // Resolve the job URL for the footer, accounting for matrix strategy.
    const { data: workflow_run } = await github.rest.actions.listJobsForWorkflowRunAttempt({
      attempt_number: process.env.GITHUB_RUN_ATTEMPT,
      owner: context.repo.owner,
      repo: context.repo.repo,
      run_id: context.runId,
      per_page: 100,
    });
    const check_id =
      workflow_run.jobs.find((job) =>
        process.env.MATRIX !== "null"
          ? job.name.includes(Object.values(JSON.parse(process.env.MATRIX)).join(", "))
          : job.name.toLowerCase() === context.job
      )?.id || workflow_run.jobs[0].id;
    core.setOutput("check_id", check_id);
    const check_url = workflow_run.jobs.find((job) => job.id === check_id).html_url;

    // Update the check status with TF output summary.
    await github.rest.checks.update({
      check_run_id: check_id,
      output: {
        summary: result_summary,
        title: result_summary,
      },
      owner: context.repo.owner,
      repo: context.repo.repo,
    });

    // Render the TF fmt command output.
    const output_fmt =
      process.env.arg_command === "plan" &&
      /^true$/i.test(process.env.fmt_enable) &&
      fmt_result?.length
        ? `<details><summary>Format diff check.</summary>

\`\`\`diff
${fmt_result}
\`\`\`
</details>`
        : "";

    // Render the TF plan outline.
    const output_outline = result_outline?.length
      ? `<details><summary>Outline of changes.</summary>

\`\`\`diff
${result_outline}
\`\`\`
</details>`
      : "";

    // Render the TF output body.
    const output_body = `
<!-- header -->
\`\`\`fish
${cli_input}
\`\`\`
<!-- fmt -->
${output_fmt}
<!-- outline -->
${output_outline}
<!-- main -->
<details><summary>${result_summary}</br>

###### ${context.workflow} by @${context.actor} via [${context.eventName}](${check_url}) at ${
      context.payload.pull_request?.updated_at ||
      context.payload.head_commit?.timestamp ||
      context.payload.merge_group?.head_commit.timestamp
    }.
</summary>

\`\`\`hcl
${result_concise}
\`\`\`
</details>
<!-- footer -->
<!-- ${tf_identifier} -->`;

    // Present the TF output body in workflow summary.
    core.summary.addRaw(output_body);
    core.summary.write();

    // Add or update PR comment with TF output.
    if (pr_number && /^true$/i.test(process.env.comment_pr)) {
      // Check if the PR contains a bot comment with the TF identifier.
      const { data: list_comments } = await github.rest.issues.listComments({
        issue_number: pr_number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        per_page: 100,
      });
      const bot_comment = list_comments.find((comment) => {
        return comment.user.type === "Bot" && comment.body.includes(`<!-- ${tf_identifier} -->`);
      });

      // If a bot comment exists with a matching TF identifier, then either edit
      // it to reflect the latest TF output or create a new comment and delete
      // the existing one. Otherwise create a new comment.
      if (bot_comment) {
        if (/^true$/i.test(process.env.update_comment)) {
          const { data: pr_comment } = await github.rest.issues.updateComment({
            body: output_body,
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
            body: output_body,
            issue_number: pr_number,
            owner: context.repo.owner,
            repo: context.repo.repo,
          });
          core.setOutput("comment_id", pr_comment.id);
        }
      } else {
        const { data: pr_comment } = await github.rest.issues.createComment({
          body: output_body,
          issue_number: pr_number,
          owner: context.repo.owner,
          repo: context.repo.repo,
        });
        core.setOutput("comment_id", pr_comment.id);
      }
    }
  }
};
