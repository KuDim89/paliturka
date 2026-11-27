// Shared body of the PreToolUse hooks that limit Bash (or PowerShell) commands.
// Claude Code passes the tool call as JSON on stdin. Only exit code 2 blocks the call; any other
// failure would let the command run, so every error exits with 2 (fail closed). Each hook imports
// this module inside its own `try`, because a failed static import would exit with 1.

export function block(message) {
  process.stderr.write(`Blocked: ${message}\n`);
  process.exit(2);
}

// `isAllowed(command, input)` decides; `describe` is the reason shown when it says no, either a
// string or a function of (command, input).
export async function runPolicyHook({ isAllowed, describe }) {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  const parsed = JSON.parse(input);
  const command = parsed.tool_input?.command;
  if (typeof command === 'string' && isAllowed(command, parsed)) process.exit(0);

  const reason = typeof describe === 'function' ? describe(command, parsed) : describe;
  block(`${reason} Got: ${command}`);
}
