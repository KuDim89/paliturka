// Which staged files and added lines the pre-commit hook blocks. Used by check-staged-files.mjs.
// The rules are listed in the Commits section of CLAUDE.md.

// A line with this marker is not scanned for secrets: a fake value in a test, for example.
export const ALLOW_MARKER = 'secret-scan: allow';

const ALLOWED_ENV_FILES = new Set(['.env.example', '.env.sample', '.env.template']);

// Local environment files hold secrets; only the committed templates are allowed.
const FORBIDDEN_NAMES = [/^\.env$/, /^\.env\..+$/, /\.pem$/, /\.key$/, /^id_rsa/];

const SECRET_PATTERNS = [
  // At the start of a word, so kebab-case text such as `task-runner-…` does not match.
  /\bsk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9]{36}/,
  /github_pat_[A-Za-z0-9_]{22,}/,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY/,
  // Only a literal value being assigned, not a variable name such as `passwordInput`.
  /(password|secret|token|api_?key)\s*[:=]\s*['"][^'"]{8,}/i,
];

// The longest part of a line shown in an error, so a long minified line stays readable.
const MAX_SHOWN = 120;

export function isForbiddenFile(path) {
  const name = path.split('/').pop();
  if (ALLOWED_ENV_FILES.has(name)) return false;
  return FORBIDDEN_NAMES.some((pattern) => pattern.test(name));
}

export function findSecret(text) {
  if (text.includes(ALLOW_MARKER)) return null;
  for (const pattern of SECRET_PATTERNS) {
    const match = pattern.exec(text);
    if (match) return match[0];
  }
  return null;
}

// Keeps the first 4 characters of the match, so the error points at it without showing the value.
export function maskSecret(text, secret) {
  const masked = text.replace(secret, `${secret.slice(0, 4)}***`).trim();
  return masked.length > MAX_SHOWN ? `${masked.slice(0, MAX_SHOWN)}…` : masked;
}

// Parses `git diff --cached -U0` into the added lines with their file and line number.
export function parseAddedLines(diff) {
  const added = [];
  let file = null;
  let lineNumber = 0;
  // `+++ b/<path>` is a file header only between `diff --git` and the first hunk; inside a hunk,
  // an added line whose text starts with `++ ` looks the same and must still be scanned.
  let inHeader = true;
  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git ')) {
      inHeader = true;
    } else if (inHeader && line.startsWith('+++ ')) {
      const target = line.slice(4);
      file = target.startsWith('b/') ? target.slice(2) : null;
    } else if (line.startsWith('@@')) {
      inHeader = false;
      const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)/.exec(line);
      lineNumber = hunk ? Number(hunk[1]) : 0;
    } else if (file && line.startsWith('+')) {
      added.push({ file, line: lineNumber, text: line.slice(1) });
      lineNumber += 1;
    }
  }
  return added;
}

export function findProblems({ files, diff }) {
  const problems = [];
  for (const file of files) {
    if (isForbiddenFile(file)) {
      problems.push(`${file}: a local environment or key file must not be committed`);
    }
  }
  for (const { file, line, text } of parseAddedLines(diff)) {
    if (isForbiddenFile(file)) continue;
    const secret = findSecret(text);
    if (secret) problems.push(`${file}:${line}: looks like a secret: ${maskSecret(text, secret)}`);
  }
  return problems;
}
