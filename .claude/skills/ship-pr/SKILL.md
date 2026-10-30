---
name: ship-pr
description: 'Ships a finished feature branch end to end: checks that the branch has changes, then runs add-commit, sync-branch, pushes the branch and runs create-pr, asking for approval before every step. Stops when the branch is empty or any step stops. Use when the user says "ship", "ship pr", "ship it", "доставь код", "відправ гілку", "зроби все до PR", or runs /ship-pr. Not for release PRs (that is release-pr).'
allowed-tools: Skill, Bash(git branch --show-current), Bash(git status*), Bash(git fetch origin*), Bash(git rev-parse *), Bash(git rev-list *), Bash(git log *), Bash(git config branch.*), Bash(git push -u origin *), Bash(git push --force-with-lease=*)
---
# Ship PR

Runs four steps in order: **1 Commit** (add-commit), **2 Sync** (sync-branch), **3 Push**, **4 PR** (create-pr). The sub-skills are invoked with the Skill tool; their rules apply while they run. This skill does not repeat their logic.

## Rules

- Talk in the user's language.
- Before every step, a gate: «Step N/4: <what will happen>. Continue?» and wait. Approval is a clear yes with no requested changes («так», «yes», «ок», «давай», «👍» and the like). Anything else → stop the whole run and report (see Report). A sub-skill's own approvals come in addition to the gate, never instead of it.
- A step that stops or fails stops the whole run, except where this file says to continue.
- The only git writes of this skill itself are the pushes in Push. Never plain `--force`, `--no-verify`, merge, reset, stash or deleting branches.
- Run shell commands with the Bash tool, each command on its own, exactly as written: no `&&`, `;`, `|`, `|| echo` or `2>&1`. Quote `@{u}` as `'@{u}'`.

## Workflow

1. Preflight. Any failure → stop with a clear message.
   - `git status`: a merge, rebase, cherry-pick or revert in progress, or unmerged paths → stop; the user finishes it first.
   - `git branch --show-current`: empty (detached HEAD), `development` or `main` → stop: ship-pr runs on a feature branch.
   - `git fetch origin --prune`, then `git rev-parse --verify origin/development`: missing → stop ("`development` is not on GitHub").
   - **D** = the lines of `git status --porcelain -uall` (uncommitted changes, new files included).
   - **C** = `git rev-list --count origin/development..HEAD` (commits ahead of `development`).
   - D empty and C = 0 → stop: "the branch is empty: no uncommitted changes and no commits ahead of development; nothing to ship".
   - Show the branch, the number of changed files (D) and commits (C), and the four steps with the ones that will be skipped.
2. **Commit**. D empty → "Step 1 skipped: nothing to commit", go on. Otherwise gate, then invoke the `add-commit` skill. Afterwards `git status --porcelain -uall` must be empty; if not (files were skipped or left out), stop and list them: sync-branch and create-pr need a clean working tree. Commit or remove them, then run ship-pr again.
3. **Sync**. Gate, then invoke the `sync-branch` skill.
   - It stops with "already up to date with development" → not an error; go on. Record **rebased** = no.
   - It rebased successfully → **rebased** = yes. If the branch is on GitHub, take `<remote sha>` from the push command in its report (`--force-with-lease=<branch>:<remote sha>`).
   - Any other stop (conflicts, GitHub has commits not in the local copy, a check failed) → stop the run; its report already says what to do.
4. **Push** (see Push).
5. **PR**. Gate, then invoke the `create-pr` skill. It shows its own plan, may squash, and switches to `development` after the PR is created.
6. Report (see Report).

## Push

Decide the command first, then show it in full in the gate.

1. Upstream remote: `git config branch.<branch>.remote`. Empty (non-zero exit), `origin` or `.` → continue. Anything else → stop: "the upstream is on remote `<remote>`; only `origin` is supported".
2. `git rev-parse --verify --quiet refs/remotes/origin/<branch>`:
   - Not found → `git push -u origin <branch>`.
   - Found → **U** = `git rev-list --count HEAD..origin/<branch>` (commits only on GitHub).
     - U = 0 → `git push -u origin <branch>`. With nothing to push it still sets the upstream that create-pr needs.
     - U > 0 and **rebased** = yes → `git push --force-with-lease=<branch>:<remote sha> -u origin <branch>`, with the full sha from sync-branch. Never a bare `--force-with-lease`. In the gate, warn that the branch history on GitHub is rewritten.
     - U > 0 and **rebased** = no → stop: "GitHub has U commits on this branch that are not in your local copy (`git log --oneline HEAD..origin/<branch>`); run `git pull --rebase`, then ship-pr again".
3. Gate, then run the command once. Rejected (e.g. "stale info": someone pushed after the check) → stop, never repeat or force it; tell the user to run `git pull --rebase` and ship-pr again.
4. Verify: `git rev-parse HEAD` equals `git rev-parse origin/<branch>`, and `git rev-parse --abbrev-ref '@{u}'` is `origin/<branch>`. Mismatch → stop and report.

## Report

For each step: done / skipped (why) / stopped (why) / not run.

- Commit: hashes and subjects from add-commit.
- Sync: rebased or already up to date.
- Push: the command that ran.
- PR: URL and title from create-pr.
- The current branch at the end (`git branch --show-current`).

When stopped: which step, the reason, and what to do before running ship-pr again. Steps already done stay done; nothing is undone.
