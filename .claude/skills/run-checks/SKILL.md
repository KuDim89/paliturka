---
name: run-checks
description: 'Runs the project checks (every script of `pnpm check`: ESLint, Prettier, Steiger, typecheck, unit tests, plus the e2e tests when the Definition of done requires them) in a separate agent with an empty context, and shows its short report. Use when the user says "run checks", "check the code", "запусти перевірки", "прожени перевірки", or runs /run-checks, and from do-issue in its Verify step. Not for code review (do-code-review) and never for fixing anything.'
allowed-tools: Agent, Read, Bash(git status*), Bash(git diff --name-only*)
---

# Run checks

The checks run in the `run-checks` agent (`.claude/agents/run-checks.md`). That agent starts with an empty context: it does not see this conversation and knows only what you write in its request. This skill tells you, the main agent, how to start it and what to do with its report.

## Rules

- Talk in the user's language. The request to the agent is in English.
- Change nothing: do not fix failures, edit, stage or commit. The user decides what to fix and runs the checks again.
- Start the agent with the Agent tool and `subagent_type: "run-checks"`. Never use the `fork` type: it copies this conversation.

## Steps

1. **Decide whether the e2e tests are required.** The Definition of done in `CLAUDE.md` says which changes need them (sign-in, upload, reading). From do-issue, use what its plan says. Otherwise look at the changed files (`git status --porcelain -uall`, `git diff --name-only HEAD`). Unsure → ask the user.
2. **Start the agent** with a request in this shape:

   ```text
   Run the project checks.

   E2E tests: required — <why> | not required
   ```

3. **Show the report** to the user as it came back, translated into the user's language. Do not shorten, reorder or soften it. Keep these word for word, in English: the `Verdict:` value and the results (`passed`, `failed`, `not run`), commands, file paths, `file:line` references, test names and error messages.
4. Stop. Fixing is up to the user (or do-issue's fix loop), followed by a new run.
