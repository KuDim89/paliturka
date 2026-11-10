---
name: do-issue
description: 'Works on one GitHub issue end to end: reads it, agrees a step-by-step plan, creates or switches to the issue branch, implements with tests, verifies against the acceptance criteria and loops plan → fix → retest (max 3 cycles); then ticks the verified checkboxes and reports. Use when the user says "do issue", "do-issue PL-N", "work on issue", "візьми ішью", "виконай ішью", "зроби ішью", or runs /do-issue. Not for creating issues (create-issue) or commits and PRs (add-commit, ship-pr).'
---
# Do issue

Detailed procedures live in `references/`. A step that names a reference file: read it before doing that step, on every run; never work from memory of it. The reference wins over a summary line here.

## Rules

- Talk in the user's language, plans included (implementation plans, fix plans, the 3-cycle summary): the user reads and approves them. File names, commands and code stay as they are. Code and comments in English.
- Nothing changes (code, git, GitHub) before the plan is approved through the plan gate. Only exception: `sync-branch` in step 3, run only after the user's explicit yes.
- Never guess: ask. An open decision from `CLAUDE.md` touched by the issue → remind the user and decide it together first.
- Follow `CLAUDE.md` and `.claude/rules/*`. The Definition of done in `CLAUDE.md` defines the required tests and checks; this skill does not copy them.
- Never commit, push, open PRs or close the issue. Edit the issue only to tick checkboxes (`references/checkboxes.md`).
- Never claim a check passed unless it was run and passed. A manual check passes only on the user's explicit yes.
- Significant deviation from the approved plan → stop and re-plan (`references/deviations.md`).
- At most 3 fix cycles, then stop and decide together. Mechanical fixes (lint autofix, formatting, import, obvious typo) need no plan and don't count as a cycle, but go into the report.
- Long-running processes only in the background, always stopped (`references/dev-server.md`).
- Never delete branches, reset, rebase or pull on your own; rebase only through `sync-branch` after a yes.
- Monitor and TaskStop may be deferred tools: load them with ToolSearch before the first use.
- Run shell commands with the Bash tool, one command at a time. `gh` bodies go through stdin with a quoted heredoc, as in create-issue.
- Plan file: the temporary one plan mode creates outside the repo. Never copy it into the repo, the issue or a PR, never use it for resume, never delete it.

## Plan gate

Every plan (the first one, deviation re-plans, fix plans) goes through the same gate:

- Already in plan mode → use it. Otherwise `EnterPlanMode`.
- Ask until it is clear; post the plan; approval via `ExitPlanMode`. Rejected → discuss, revise, repeat.
- `EnterPlanMode` not available, failing, declined or unusable in the current mode → read `references/plan-gate-fallback.md`.

## Workflow

1. **Argument**: `PL-N`, `#N` or `N` → issue number N. Missing or invalid → ask.
2. **Preflight**, before any planning. Any failure → stop with a clear message.
   - `gh auth status`; `gh issue view N --json number,title,state,body,labels,url`. Not found, or `url` has no `/issues/` (the number is a PR; issues and PRs share numbers) → stop. Closed → ask whether to continue.
   - Issue branch from the Branch field of the body. Missing → derive it with the create-issue rules (prefix from the type label, slug) and confirm with the user.
   - `git status`: a merge, rebase, cherry-pick or revert in progress → stop.
   - `git status --porcelain --untracked-files=no` not empty and the current branch is not the issue branch → list the files and stop: "commit them first (`/add-commit`) or stash them yourself, then run do-issue again". On the issue branch they are work in progress (step 3). Untracked files → a note only.
3. **Resume and branch state** → read `references/branch-and-resume.md`. Result: fresh start, or Continue / Plan anew / Stop; stale-branch warnings.
4. **Understand**: the issue (Description, Tasks, Acceptance criteria, Technical notes), `CLAUDE.md`, the relevant rules and code; on Continue, the existing diff too. Open the plan gate. Ask until scope, approach and every criterion are clear on both sides. Nothing unclear → say "the issue is clear, no questions".
5. **Plan**, short and step by step:
   - Goal: what and why. Branch.
   - Steps, each naming the issue Task(s) it covers; on resume marked done / partly done / to do.
   - **Tests** (required): which tests the Definition of done requires for this change, which criterion is checked by which test, the rest marked "manual" with how. No tests needed or no test tooling yet → say why. Never add a test framework or dependency the issue doesn't cover without approval.
   - Checks to run.
   - Other Definition of done items that apply: `CLAUDE.md` Commands or Status updates, new screens checked in both languages and themes, a decided open decision moved to its section.

   Approve through the plan gate.
6. **Branch** → read `references/branch-and-resume.md`, section "Switching".
7. **Implement** step by step, writing the planned tests together with the code they cover. Track progress with tasks. Any doubt about deviating from the plan → read `references/deviations.md`.
8. **Verify** → read `references/verification.md`; read `references/dev-server.md` before running the app.
9. **Fix loop**:
   - **Mechanical fixes**, no plan and no cycle: linter autofix (`--fix`), Prettier formatting, a missing or unused import, an obvious typo. Only when they change no behavior, tests or test expectations, and only in files changed for this issue (never format the whole repo). One try, then rerun the failed check. Still failing, touching behavior, or any doubt → a regular fix.
   - **Regular fix**: list the problems, plan gate with a fix plan titled "Fix cycle k/3", fix (each bug gets a regression test where it can be automated), back to step 8.
   - After cycle 3 still failing → stop changing things. Summary: what each cycle tried, what still fails and why (guesses marked as guesses), options: narrow the scope, split the issue (new issue via create-issue), change the approach, or 3 more cycles. Nothing changes until the user chooses.
   - The counter lives only in the session; a resumed run starts at cycle 1 and says so.
10. **Checkboxes** → read `references/checkboxes.md`.
11. **Report** (see Report).

## Report

Status first:

- **Done**: every criterion passed, automatically or manually.
- **Done except manual checks**: the unverified manual items with their steps; rerunning do-issue asks again and ticks them.
- **Stopped** (fix-cycle ceiling, user stop, failure): at which step and why, what is done and what isn't, that the changes stay uncommitted on the branch, and that rerunning do-issue resumes from them.

Then:

- Issue URL, branch, plan-gate mode (plan mode or chat fallback).
- Files changed; tests added or updated.
- Checks run, with results.
- Each criterion: passed automatically / passed manually / failed / unverified.
- Re-plans (deviations, fix cycles), small deviations, mechanical fixes.
- Servers started and stopped.
- Checkboxes ticked, and any left unticked with the reason.
- Next step: `ship-pr` commits, pushes and opens the PR.

## Failures

Repeat a `gh` or `git` command at most once, then stop and give the command for a manual run.
