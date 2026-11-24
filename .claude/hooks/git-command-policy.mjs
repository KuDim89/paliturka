// Which shell commands the read-only review agent may run. Used by the git-read-only.mjs hook.
// Only a single `git diff`, `git show`, `git log` or `git status` command is allowed, without
// options that make git write a file.

const ALLOWED = /^git (diff|show|log|status)(\s|$)/;
// Chaining, pipes, redirection and substitution could run another command after git. Quotes and
// backslashes could hide a blocked option from the checks below.
const SHELL_OPERATORS = /[;&|<>`$()\n'"\\]/;
// `--output=<file>` writes the diff to a file. Git also accepts an abbreviated long option, so any
// option starting with `--out` is blocked, except the harmless `--output-indicator-*`.
const WRITES_FILE = /(^|\s)--out(?!put-indicator-)/;

export function isAllowedCommand(command) {
  const trimmed = command.trim();
  return ALLOWED.test(trimmed) && !SHELL_OPERATORS.test(trimmed) && !WRITES_FILE.test(trimmed);
}
