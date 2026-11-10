# Branch and resume

`<branch>` is the issue branch from preflight. Run each git command on its own. A non-zero exit from `git rev-parse --verify --quiet` means "not found", not a failure.

## Resume check (step 3)

Read-only. Progress comes from git and the issue; nothing is stored between runs.

1. `git fetch origin --prune`.
2. Look for earlier work:
   - the branch exists locally (`git rev-parse --verify --quiet refs/heads/<branch>`) or on GitHub (`git rev-parse --verify --quiet refs/remotes/origin/<branch>`);
   - **C** = `git rev-list --count origin/development..<branch>`, with `git log --oneline origin/development..<branch>` and `git diff --stat origin/development...<branch>`;
   - uncommitted changes, if the issue branch is checked out (`git status --porcelain`);
   - checkboxes already ticked in the issue body.
3. Nothing found → fresh start, go on.
4. Something found → a short summary of what is already there, then ask:
   - **Continue** (default): planning starts from what is done. Done parts are verified again in step 8.
   - **Plan anew on this branch**: a new plan, ignoring the old one. Existing changes stay unless the new plan removes them.
   - **Stop**.

Never delete a branch, reset, rebase or pull to "start clean".

## Stale branch (step 3)

Checked before planning, so the plan is made on current code. Only for an existing local branch:

- **Behind GitHub**: `git rev-list --count <branch>..origin/<branch>` > 0 (commits pushed from another device or session) → warn with the count and `git log --oneline <branch>..origin/<branch>`. Suggest `git pull --rebase` on the branch; `sync-branch` doesn't help here, it stops when GitHub has commits the local copy lacks. Also ahead (`git rev-list --count origin/<branch>..<branch>` > 0) → say the branches have diverged.
- **Behind development**: `git rev-list --count <branch>..origin/development` > 0 → warn with the count. Offer `sync-branch`, invoked with the Skill tool only after the user's yes; its own approvals apply. With uncommitted changes it refuses; say so.

Options: update first (the user pulls, or do-issue runs `sync-branch`), then check again / continue on the stale branch (noted in the plan and the report) / stop.

## Switching (step 6)

1. Already on the issue branch → nothing to do.
2. `git fetch origin --prune`, then repeat the stale-branch check: planning can take hours. Newly behind → warn and ask as above.
3. `git status --porcelain --untracked-files=no` must still be empty. Changed during planning → stop and ask.
4. Switch:
   - exists locally → `git switch <branch>`;
   - only on GitHub → `git switch --track origin/<branch>`;
   - nowhere → `git switch --no-track -c <branch> origin/development`. `--no-track` keeps the upstream from becoming `origin/development`; `git push -u origin <branch>` (ship-pr) sets the right one later.
5. Refused because an untracked file is in the way → stop and list the file.
6. Verify: `git branch --show-current` is `<branch>`.
