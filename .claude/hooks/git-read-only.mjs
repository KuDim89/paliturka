// PreToolUse hook for agents that may only read git state (the do-code-review agent).
// Claude Code passes the tool call as JSON on stdin. Only exit code 2 blocks the call; any other
// failure would let the command run, so every error here exits with 2 (fail closed). The policy is
// imported inside `try`, because a failed static import would exit with 1 before any code runs.
function block(message) {
  process.stderr.write(`Blocked: ${message}\n`);
  process.exit(2);
}

try {
  const { isAllowedCommand } = await import('./git-command-policy.mjs');

  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  const command = JSON.parse(input).tool_input?.command;
  if (typeof command === 'string' && isAllowedCommand(command)) process.exit(0);

  block(
    `this agent may only run a single git diff, git show, git log or git status command, without quotes or options that write files. Got: ${command}`,
  );
} catch (error) {
  block(`the git-read-only hook failed, so the command is not allowed. ${error}`);
}
