import { defineConfig } from 'lint-staged/config';

// Run by the pre-commit hook (.husky/pre-commit) on the staged files only. lint-staged adds the
// fixes of prettier and eslint back to the commit.
export default defineConfig({
  '*': 'prettier --write --ignore-unknown',
  // .mjs: the hooks of the Claude Code agents in .claude/hooks/.
  '*.{ts,tsx,mjs}': 'eslint --fix --max-warnings 0',
  // Only the tests that import the staged files: code, the agent hooks, the git hook checks in
  // scripts/, and JSON such as the i18n messages (messages.test.ts compares the keys of en.json and
  // uk.json). A change with no related tests has nothing to run, which must not fail the commit.
  '{src,app,.claude,scripts}/**/*.{ts,tsx,mjs,json}': 'vitest related --run --passWithNoTests',
});
