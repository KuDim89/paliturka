// PreToolUse hook for agents that may only read git state (the do-code-review agent).
// Every error exits with 2 (fail closed); see run-policy-hook.mjs.
try {
  const { runPolicyHook } = await import('./run-policy-hook.mjs');
  const { isAllowedCommand } = await import('./git-command-policy.mjs');

  await runPolicyHook({
    isAllowed: isAllowedCommand,
    describe:
      'this agent may only run a single git diff, git show, git log or git status command, without quotes or options that write files.',
  });
} catch (error) {
  process.stderr.write(
    `Blocked: the git-read-only hook failed, so the command is not allowed. ${error}\n`,
  );
  process.exit(2);
}
