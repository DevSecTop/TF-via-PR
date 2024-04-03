module.exports = async ({ core }) => {
  const command = process.env.comment_body
    // Split on newlines, removing empty lines and whitespace.
    .trim()
    .split("\n")
    .filter((line) => line.trim())
    // Join the lines into one string and split on spaces outside of quotation marks.
    .join(" ")
    .split(/\s(?=(?:[^'"]|'[^']*'|"[^"]*")*$)/)
    // Reduce the array of arguments into a single object.
    .reduce((acc, arg) => {
      // Split the arg on the first equals sign to assign key value pairs to the object.
      const [key, value] = arg.split(/=(.+)/);
      // Remove the leading dash from the key and remove quotation marks outside of square brackets from the value if it exists, otherwise set the value to true.
      return {
        ...acc,
        [key.slice(1)]: value?.replace(/['"]+(?![^\[]*\])/g, "") || true,
      };
    }, {});

  core.setOutput("command", JSON.stringify(command));
};
