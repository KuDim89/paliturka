// The commit message rules that the commit-msg hook checks. Used by commit-msg.mjs.
// The rules are listed in the Commits section of CLAUDE.md.

export const TYPES = [
  'feat',
  'fix',
  'docs',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'style',
  'chore',
];

// The area labels of the Labels table in .claude/skills/create-issue/SKILL.md (a test compares).
export const SCOPES = ['frontend', 'backend', 'tooling'];

export const MAX_LINE = 72;

// Messages that git writes itself: merges, reverts, and fixups for a later autosquash.
const GENERATED =
  /^(Merge (branch|remote-tracking branch|tag|commit|pull request) |Revert "|fixup! |squash! |amend! )/;

const SUBJECT = /^(?<type>[a-z]+)(?:\((?<scope>[^)]*)\))?!?: (?<description>\S.*)$/;

// Only a line that is a single URL may be longer than MAX_LINE.
const URL_LINE = /^<?https?:\/\/\S+>?$/;

// Attribution of the commit to an AI tool. Plain mentions such as CLAUDE.md or .claude/ pass.
const ATTRIBUTION = [
  [/^co-authored-by:/im, 'a Co-Authored-By trailer'],
  // At the start of a line only: "the client is generated with pnpm db:generate" passes.
  [/^generated with/im, 'a "Generated with" line'],
  [/\u{1F916}/u, 'the robot emoji'],
  [/noreply@anthropic\.com/i, 'an Anthropic address'],
  [
    /\b(generated|written|created|authored)\s+(by|with)\s+(claude|chatgpt|copilot|an?\s+ai|ai)\b/i,
    'a note that an AI wrote the commit',
  ],
];

const SCISSORS = /^# -+ >8 -+$/;
const EDITOR_TEMPLATE = /^# Please enter the commit message/m;

// The text git commits. When the editor template is in the file (`git commit` without -m or -F),
// git strips the comment lines and the diff below a scissors line (`--verbose`). With -m or -F, as
// the Commits section uses, git keeps lines starting with `#`, so they are checked too.
export function cleanMessage(raw) {
  const text = raw.replace(/\r\n/g, '\n');
  const all = text.split('\n');
  const fromEditor = EDITOR_TEMPLATE.test(text) || all.some((line) => SCISSORS.test(line));
  const lines = [];
  for (const line of all) {
    if (fromEditor && SCISSORS.test(line)) break;
    if (!(fromEditor && line.startsWith('#'))) lines.push(line.trimEnd());
  }
  while (lines.length > 0 && lines.at(-1) === '') lines.pop();
  while (lines.length > 0 && lines[0] === '') lines.shift();
  return lines;
}

function findAttribution(lines) {
  const text = lines.join('\n');
  return ATTRIBUTION.filter(([pattern]) => pattern.test(text)).map(
    ([, what]) => `remove ${what}: commits carry no AI attribution`,
  );
}

export function checkCommitMessage(raw) {
  const lines = cleanMessage(raw);
  if (lines.length === 0) return ['the message is empty'];
  // Messages that git writes keep their own format, but carry no AI attribution either.
  if (GENERATED.test(lines[0])) return findAttribution(lines);
  return [...checkFormat(lines), ...findAttribution(lines)];
}

function checkFormat([subject, separator, ...body]) {
  const errors = [];
  const match = SUBJECT.exec(subject);
  if (!match) {
    errors.push(`the subject must look like "type(scope): description", got "${subject}"`);
  } else {
    const { type, scope, description } = match.groups;
    if (!TYPES.includes(type)) {
      errors.push(`unknown type "${type}"; use one of ${TYPES.join(', ')}`);
    }
    if (scope !== undefined && !SCOPES.includes(scope)) {
      errors.push(`unknown scope "${scope}"; use one of ${SCOPES.join(', ')} or no scope`);
    }
    if (description.endsWith('.')) errors.push('the subject must not end with a period');
  }
  if (subject.length > MAX_LINE) {
    errors.push(`the subject is ${subject.length} characters; at most ${MAX_LINE}`);
  }
  if (separator !== undefined && separator !== '') {
    errors.push('the second line must be blank');
  }
  body.forEach((line, index) => {
    if (line.length > MAX_LINE && !URL_LINE.test(line)) {
      errors.push(`body line ${index + 3} is ${line.length} characters; at most ${MAX_LINE}`);
    }
  });
  return errors;
}
