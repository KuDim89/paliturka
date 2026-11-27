// PreToolUse hook of the main session (.claude/settings.json) for Bash and PowerShell: blocks git add
// and git commit options that stage everything, skip the hooks or amend, however they are spelled.
// Every error exits with 2 (fail closed); see run-policy-hook.mjs.
try {
  const { runPolicyHook } = await import('./run-policy-hook.mjs');
  const { findBlockedOption } = await import('./git-write-policy.mjs');

  const shellOf = (input) => (input?.tool_name === 'PowerShell' ? 'powershell' : 'bash');

  await runPolicyHook({
    isAllowed: (command, input) => findBlockedOption(command, shellOf(input)) === null,
    describe: (command, input) =>
      typeof command === 'string'
        ? `${findBlockedOption(command, shellOf(input))}. Stage explicit paths and keep the hooks (see the Commits section of CLAUDE.md).`
        : 'the tool call has no command to check.',
  });
} catch (error) {
  process.stderr.write(
    `Blocked: the git-write-guard hook failed, so the command is not allowed. ${error}\n`,
  );
  process.exit(2);
}
