// Which shell commands the run-checks agent may run. Used by the checks-only.mjs hook.
// Allowed: a single `git status` with plain options, and `pnpm <script>` without arguments, where
// the script is one of the `check` script in package.json or `test:e2e`. No arguments means no
// `--fix`, `--write` or `-u` variants.

const E2E_SCRIPT = 'test:e2e';
const GIT_STATUS = /^git status(\s+-[\w-]+)*$/;
const PNPM_SCRIPT = /^pnpm ([\w:-]+)$/;

/** Script names from a `check` script written as `pnpm a && pnpm b && …`. */
export function parseCheckScripts(checkScript) {
  if (typeof checkScript !== 'string') return [];
  return checkScript
    .split('&&')
    .map((part) => PNPM_SCRIPT.exec(part.trim())?.[1])
    .filter((name) => name !== undefined);
}

export function isAllowedCommand(command, checkScript) {
  const trimmed = command.trim();
  if (GIT_STATUS.test(trimmed)) return true;

  const script = PNPM_SCRIPT.exec(trimmed)?.[1];
  if (script === undefined) return false;
  return script === E2E_SCRIPT || parseCheckScripts(checkScript).includes(script);
}
