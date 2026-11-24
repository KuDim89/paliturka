// Shared body of the PreToolUse hooks that limit an agent's Bash commands.
// Claude Code passes the tool call as JSON on stdin. Only exit code 2 blocks the call; any other
// failure would let the command run, so every error exits with 2 (fail closed). Each hook imports
// this module inside its own `try`, because a failed static import would exit with 1.

export function block(message) {
  process.stderr.write(`Blocked: ${message}\n`);
  process.exit(2);
}

export async function runPolicyHook({ isAllowed, describe }) {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  const command = JSON.parse(input).tool_input?.command;
  if (typeof command === 'string' && isAllowed(command)) process.exit(0);

  block(`${describe} Got: ${command}`);
}
