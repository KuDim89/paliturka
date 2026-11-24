---
name: do-code-review
description: 'Reviews the current uncommitted changes against the project rules (quality, structure, naming, CLAUDE.md and .claude/rules, bugs, security, tests) in a separate read-only agent with an empty context, and shows its report. Use when the user says "do code review", "review my changes", "зроби рев''ю", "перевір код", or runs /do-code-review, and from do-issue before its report. Not for running linters or tests (a separate checks step), and not the built-in /code-review.'
allowed-tools: Agent, Read, Bash(git branch --show-current), Bash(git status*), Bash(gh issue view *)
---

# Do code review

The review itself runs in the `do-code-review` agent (`.claude/agents/do-code-review.md`). That agent starts with an empty context: it does not see this conversation and knows only what you write in its request. This skill tells you, the main agent, how to start it and what to do with its report.

## Rules

- Talk in the user's language. The request to the agent is in English.
- Change nothing: do not fix findings, edit, stage or commit. The user decides what to fix and runs the review again.
- Start the agent with the Agent tool and `subagent_type: "do-code-review"`. Never use the `fork` type: it copies this conversation, and the review must not depend on it.

## Steps

1. **Collect the context.** The agent knows only what you pass, so pass everything that applies:
   - **Purpose:** what the change is for, in one or two sentences.
   - **Issue:** the key, title and acceptance criteria. From do-issue, use the issue it works on. Otherwise take `PL-<N>` from `git branch --show-current` (case-insensitive) and read it with `gh issue view <N> --json title,body`. No key → no issue.
   - **Plan:** the agreed plan and approved deviations, when there are any (for example from do-issue's plan gate).
   - **Paths:** only when the user asks to review specific files; otherwise the agent reviews all uncommitted changes.

   If there is nothing to review (`git status --porcelain -uall` is empty and no paths were given), say so and stop.

2. **Start the agent** with a request in this shape, leaving out what you do not have:

   ```text
   Review the uncommitted changes of this repository.

   Purpose: <one or two sentences>
   Issue: PL-<N> — <title>
   Acceptance criteria:
   - <criterion>
   Plan: <the agreed plan, short>
   Deviations: <approved deviations, or "none">
   Paths: <only when not all uncommitted changes>
   ```

3. **Show the report** to the user as it came back, translated into the user's language. Do not shorten, reorder or soften it. Keep these word for word, in English: the `Verdict:` value (`passed`, `changes needed`), the level names (`critical`, `should fix`, `suggestion`), file paths and `file:line` references, and code, commands and identifiers.
4. **Comment only where it matters.** After the report, add a separate comment for each finding that contradicts something the user and you agreed earlier in this conversation (a deliberate choice, an approved deviation). Name the finding and say briefly why it was done that way. Findings that do not touch earlier decisions get no comment.
5. Stop. The user fixes what they want and runs the review again for a new report.
