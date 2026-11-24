// PreToolUse hook for the run-checks agent: only `git status` and the scripts of the `check`
// script in package.json (plus `test:e2e`). package.json is read on every call, so a change to
// `check` changes what is allowed. Every error exits with 2 (fail closed); see run-policy-hook.mjs.
try {
  const { readFile } = await import('node:fs/promises');
  const { runPolicyHook } = await import('./run-policy-hook.mjs');
  const { isAllowedCommand, parseCheckScripts } = await import('./checks-command-policy.mjs');

  const packageJson = JSON.parse(
    await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
  );
  const checkScript = packageJson.scripts?.check;
  const allowedScripts = [...parseCheckScripts(checkScript), 'test:e2e']
    .map((name) => `pnpm ${name}`)
    .join(', ');

  await runPolicyHook({
    isAllowed: (command) => isAllowedCommand(command, checkScript),
    describe: `this agent may only run git status or one of these scripts without arguments: ${allowedScripts}.`,
  });
} catch (error) {
  process.stderr.write(
    `Blocked: the checks-only hook failed, so the command is not allowed. ${error}\n`,
  );
  process.exit(2);
}
