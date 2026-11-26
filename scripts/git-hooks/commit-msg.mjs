// commit-msg hook (.husky/commit-msg): git passes the path of the message file. Any non-zero exit
// stops the commit, so an error fails closed.
import { readFileSync } from 'node:fs';

import { checkCommitMessage } from './commit-msg-policy.mjs';

const path = process.argv[2];
if (!path) {
  process.stderr.write('commit-msg: no message file given\n');
  process.exit(1);
}

const errors = checkCommitMessage(readFileSync(path, 'utf8'));
if (errors.length > 0) {
  process.stderr.write(
    [
      'Commit blocked: the message does not follow the Commits section of CLAUDE.md.',
      ...errors.map((error) => `  - ${error}`),
      '',
    ].join('\n'),
  );
  process.exit(1);
}
