---
name: sync-branch
description: 'Brings the current feature branch up to date with development: fetches origin, fast-forwards local development and rebases the branch onto origin/development after the user approves. Checks for conflicts first and leaves the branch untouched when there are any. Never pushes. Use when the user says "sync branch", "update branch", "rebase on development", "онови гілку", "підтягни development", "синхронізуй гілку", or runs /sync-branch. Not for resolving conflicts or for main.'
allowed-tools: Bash(git branch --show-current), Bash(git status*), Bash(git fetch origin*), Bash(git rev-parse *), Bash(git config branch.*), Bash(git rev-list *), Bash(git log *), Bash(git diff *), Bash(git merge-tree *), Bash(git rebase --no-update-refs --no-rebase-merges origin/development), Bash(git rebase --abort)
---
# Sync branch

## Rules

- Nothing is rebased before approval.
- Talk in the user's language.
- The only git writes allowed: `git fetch origin --prune`, `git fetch origin development:development` (fast-forward of local `development`), `git rebase --no-update-refs --no-rebase-merges origin/development` (the **rebase command**) and `git rebase --abort` only when that rebase stopped midway.
- Always the rebase command exactly as written. The flags override the user's git config: `rebase.updateRefs` would also move other local branches that point into the branch, and `rebase.rebaseMerges` would keep merge commits, which the plan says are dropped.
- Never push, merge, stash, reset, amend, use `--no-verify`, or resolve conflicts on the user's behalf.
- Run shell commands with the Bash tool, not PowerShell. Quote `@{u}` as `'@{u}'`.
- Run each git command on its own, exactly as written here: no `&&`, `;`, `|`, `echo`, `|| echo` or `2>&1` around it. The Bash tool already returns the output and the exit code. A combined command does not match `allowed-tools` and asks the user for permission.

## Workflow

1. Preflight, in this order. Any failure → stop with a clear message.
   - `git status`: a merge, rebase, cherry-pick or revert in progress, or unmerged paths → stop; the user finishes it first (`git rebase --continue` / `--abort`, `git merge --continue` / `--abort`, etc.). Check this first: during a rebase HEAD is detached, and the next check would report "detached HEAD" instead of the real cause.
   - `git branch --show-current`: empty (detached HEAD), `development` or `main` → stop.
   - `git status --porcelain --untracked-files=no` not empty → stop: "commit your changes first (`/add-commit`) or stash them yourself". A rebase needs no uncommitted changes in tracked files. Untracked files (`??`) do not block it: git keeps them, and refuses safely when one is in the way (see Rebase).
   - `git fetch origin --prune`, then `git rev-parse --verify origin/development`. `--prune` removes remote-tracking branches deleted on GitHub (e.g. after a merged PR); without it a stale `origin/<branch>` would look like the branch is still on GitHub. It changes nothing else: missing → stop ("`development` is not on GitHub").
2. Update local `development`, if it exists (`git rev-parse --verify --quiet refs/heads/development`): `git fetch origin development:development`. It only fast-forwards, so nothing can be lost. Fail (local `development` has its own commits, or it is checked out in another worktree) → note the reason for the plan and the report, continue; the rebase uses `origin/development`, not the local branch.
3. Count:
   - **B** = `git rev-list --count HEAD..origin/development`. B = 0 → stop: "already up to date with development".
   - **C** = `git rev-list --count origin/development..HEAD` (the branch's own commits).
4. The branch on GitHub.
   - Upstream remote: `git config branch.<current branch>.remote`. Empty (no upstream), `origin` or `.` (a local branch) → continue. Anything else (e.g. `fork`) → stop: "the upstream is on remote `<remote>`; only `origin` is supported". `git fetch origin` does not update that remote, and the push advice below targets `origin`, so `-u` would move the upstream off the fork. A non-zero exit here means no upstream.
   - The **remote branch** is `origin/<current branch>` if `git rev-parse --verify --quiet refs/remotes/origin/<current branch>` finds it; not found → the branch is not on GitHub. The upstream (`git rev-parse --abbrev-ref '@{u}'`) counts only when it is exactly `origin/<current branch>`; any other upstream on `origin` (or a local one) is ignored. Example: `git checkout -b <branch> origin/development` sets the upstream to `origin/development`. Comparing with that upstream would count the new development commits as missing ones, and the push advice would target `development`. Here a non-zero exit only means "not found" (no remote branch, no upstream), not a failure.
   - On GitHub: `git rev-parse <remote branch>` → `<remote sha>`, the state of the branch on GitHub that the checks below approve. The push advice pins the force-push to it (see step 6).
   - **R** = `git rev-list --count HEAD..<remote sha>`. R > 0 → stop: "GitHub has R commits on this branch that are not in your local copy (`git log --oneline HEAD..<remote branch>`); bring them in first with `git pull --rebase`, then run sync again". Otherwise the force-push advised after the rebase would delete them from GitHub. `--rebase` because a plain `git pull` may create a merge commit.
5. Conflict check, without changing anything: `git merge-tree --write-tree --name-only origin/development HEAD`.
   - Exit 0 → clean, continue.
   - Exit 1 and the first line is a tree id (40 hex characters) → conflicts: stop. The branch is untouched. List the conflicting files (the lines after the first one, up to the blank line) and the new `development` commits that touch them (`git log --oneline HEAD..origin/development -- <files>`). The plan is not shown. Tell the user to resolve by hand: `git rebase origin/development`, fix each conflict, `git add <file>`, `git rebase --continue`. Then give the push step for after that: on GitHub → `<push command>` from step 6 (with the `<remote sha>` from step 4), not on GitHub → `git push -u origin <branch>`. Running sync again will not give it: after a manual rebase it stops with "already up to date".
   - Exit 1 without a tree id (git also uses 1 for errors such as a bad ref), or any other exit → stop and report the error.
6. Show the plan:
   - Branch → rebase onto `origin/development`.
   - "B new commits in development": `git log --oneline HEAD..origin/development` (up to 10; more → the first 10 and "and N more").
   - "C commits of the branch will be replayed": `git log --oneline origin/development..HEAD`. If the list has merge commits (`git log --merges --oneline origin/development..HEAD`), say they will be dropped: the rebase makes the history linear, the content stays.
   - "Conflict check: the final result has no conflicts. A single commit can still conflict while it is replayed; then the rebase is undone and nothing changes."
   - Local `development`: updated / already current / not updated (reason) / does not exist.
   - On GitHub → warning: "after the rebase the local branch differs from GitHub; push it yourself with `<push command>`. Do not run `git pull`: it would bring the old commits back." `<push command>` is `git push --force-with-lease=<branch>:<remote sha> origin <branch>` when the upstream is `origin/<branch>`. With no upstream or a different one, add `-u`: `git push --force-with-lease=<branch>:<remote sha> -u origin <branch>`, which also sets the upstream to the right branch. Always the full sha, never a bare `--force-with-lease`: that one compares with `origin/<branch>` as of the last fetch, and a background fetch (e.g. from the IDE) moves it to the latest GitHub state, so a colleague's new commits would be overwritten without a warning. With the sha, the push is rejected ("stale info") if the branch on GitHub changed after the check; then do not force it: run `git pull --rebase` and sync again. A different upstream → say so: "the upstream points to `<upstream>`, not to `origin/<branch>`; the push command fixes it". Not on GitHub → "the branch is not on GitHub yet; nothing to force-push" (and the same note for a set upstream, e.g. `origin/development`).
7. Wait for approval: a clear yes with no requested changes. Anything else → ask.
8. Rebase (see Rebase).
9. Report (see Report).

## Rebase

1. `git rev-parse HEAD` → `<old head>`.
2. The rebase command. Fail → it is one of two cases; stop and report (see Report, failure) either way:
   - **Untracked file in the way**: the output says untracked files "would be overwritten". Git refused before starting; nothing changed and there is no rebase to abort. List those files and ask the user to move or rename them (development now has files with the same names), then run sync again.
   - **Conflict in a commit**: `git status` shows a rebase in progress → `git rebase --abort`. The conflict check in step 5 was clean, so the conflict is in a single commit on the way, not in the final result. Typical causes: a commit that a later commit undoes, or commits that are already in `development` in squashed form (e.g. the branch was cut from another branch that was squash-merged). Say this, list the conflicting files from the rebase output and the `development` commits that touch them, and tell the user to resolve by hand, with the push step after it (as in step 5).
3. Verify:
   - `git rev-list --count HEAD..origin/development` = 0.
   - `git rev-list --count origin/development..HEAD` = C. Less → git dropped commits: ones whose changes are already in `development`, and merge commits. Report which (`git log --oneline origin/development..<old head>` against the new list). This is normal, not a failure.
   - `git status --porcelain --untracked-files=no` is empty.
   - `git rev-parse HEAD` → `<new head>`.
   Mismatch → stop and report, with `<old head>` and the recovery command `git reset --hard <old head>`. Never run it without asking.

## Report

Success:

- Branch, `<new head>`, `<old head>` for recovery.
- "+B commits from development", C commits replayed (and any dropped, with the reason).
- Local `development`: updated / already current / not updated (reason) / does not exist.
- On GitHub → "push with `<push command>` (as in step 6, with the full `<remote sha>`); do not `git pull`. If the push is rejected with "stale info", someone pushed to the branch after the check: do not force it, run `git pull --rebase` and sync again". Not on GitHub → "push with `git push -u origin <branch>` when ready" (never a plain `git push`: with a wrong upstream it can target another branch).

Failure (the rebase stopped or a check failed):

- What happened and the conflicting files.
- The branch is back at `<old head>` (confirm with `git rev-parse HEAD` and `git status --porcelain --untracked-files=no`), nothing was changed.
- Local `development`, as above. No push advice for the branch as it is now: nothing changed on it. A conflict → the push step after the manual resolution (see step 5).
