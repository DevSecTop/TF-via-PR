// TODO: This is an unused and work-in-progress implementation of "arguments: Process TF arguments" step.
module.exports = async ({ core }) => {
  // Iterate over all environment variables
  for (const key in process.env) {
    // Check if the variable starts with 'arg_'
    if (key.startsWith("arg_")) {
      // Extract the variable name and value
      const varName = key;
      const varValue = process.env[key];

      // Transform the variable name into an argument key
      const argKey = varName.replace("arg_", "").replace(/_/g, "-");

      // Check the value
      if (varValue.toLowerCase() === "true") {
        // If the value is 'true', treat the key as a flag
        core.setOutput(argKey, true);
      } else if (varValue) {
        // If the value is non-empty, check if it contains commas
        if (varValue.includes(",")) {
          // If it does, split the value on commas
          const values = varValue.split(",");
          // Write each value as a separate argument with the same key
          values.forEach((value, index) => {
            if (index === 0) {
              core.setOutput(argKey, value);
            } else {
              core.setOutput(`${argKey}_${index}`, value);
            }
          });
        } else {
          // If it doesn't contain commas, write the key-value pair as-is
          core.setOutput(argKey, varValue);
        }
      }
    }
  }

  // Set environment variables
  core.exportVariable("TF_CLI_ARGS", "-no-color");
  core.exportVariable("TF_IN_AUTOMATION", "true");
  core.exportVariable("TF_INPUT", "false");
  core.exportVariable("TF_CLI_USES", process.env["TOFU_CLI_PATH"] ? "tofu" : "terraform");

  // Store the path to the TF plan file for artifact upload/download.
  core.setOutput("tf_cwd", process.env["arg_chdir"]);

  // Store a combination of the PR number and TF command arguments
  // for use as a unique identifier to reference the TF plan file.
  const tf_plan_id =
    (process.env["GITHUB_EVENT_NUMBER"] || process.env["GITHUB_EVENT_ISSUE_NUMBER"]) +
    process.env["arg_backend_config"] +
    process.env["arg_chdir"] +
    process.env["arg_var_file"] +
    process.env["arg_workspace"] +
    process.env["arg_destroy-tfplan"];
  core.setOutput("tf_plan_id", tf_plan_id.replace(/[[:space:][:punct:]]/g, "-"));

  // If "-backend-config" argument is present, then include any prefix and suffix.
  if (process.env["arg_backend_config"]) {
    const backend_config = `-backend-config=${process.env["INPUTS_BACKEND_CONFIG_PREFIX"]}${process.env["arg_backend_config"]}${process.env["INPUTS_BACKEND_CONFIG_SUFFIX"]}`;
    core.setOutput("arg_backend_config", backend_config);
  }

  // If "-var-file" argument is present, then include any prefix and suffix.
  if (process.env["arg_var_file"]) {
    const var_file = `-var-file=${process.env["INPUTS_VAR_FILE_PREFIX"]}${process.env["arg_var_file"]}${process.env["INPUTS_VAR_FILE_SUFFIX"]}`;
    core.setOutput("arg_var_file", var_file);
  }

  // If "-tf=apply" is run without "-auto-approve", then ignore "-var-file"
  // argument so the that the TF plan file is used.
  if (!process.env["arg_auto_approve"] && process.env["arg_tf"] === "apply") {
    core.setOutput("arg_var_file", "");
  }

  // If "-auto-approve" is not supplied, then set it to read from "tfplan".
  if (!process.env["arg_auto_approve"]) {
    core.setOutput("arg_auto_approve", "tfplan");
  }
};
