---
name: add-commit
description: 'Prepares and creates git commits in Conventional Commits format with an area scope, after the user approves the message. Use when the user says "commit", "add commit", "закоміть", "зроби коміт", "закомітити", asks to commit changes, or runs /add-commit. Not for questions about existing commits or history.'
allowed-tools: Read, Grep, Glob, Bash(git status*), Bash(git diff*), Bash(git log*), Bash(git branch --show-current), Bash(git symbolic-ref *), Bash(git rev-parse *), Bash(git add *), Bash(git commit -F *), Bash(wc -c *)
---
# Add commit

## Rules

- Nothing is committed before approval; never push, amend, rebase or use `--no-verify`.
- Approval is a clear yes with no requested changes («так», «yes», «ок», «давай», «👍» and the like). Anything that asks for a change, adds a condition or is unclear is not approval: revise and show again, or ask. A yes with a change («так, але зміни subject на …») is a change request: apply it, show the commit again in its final form and wait for a new yes. Never commit text the user has not seen as it will be committed.
- One approval covers one commit. With several commits, show and approve them one at a time; never ask to approve several at once.
- Talk in the user's language; commit messages in English only.
- Never add trailers (`Co-Authored-By`, `Generated with`, etc.) or any mention of AI or Claude Code.
- Never guess: ask when the type, scope or purpose of a change is unclear.
- Run shell commands with the Bash tool, not PowerShell.
- Stage only with `git add -- <explicit paths>`; never `git add -A`, `git add .`, `git add -u` or globs. (`allowed-tools` does not block these; this rule does.)
- All paths are relative to the repository root. Use `git status --porcelain -uall`, never `--short`, whose paths are relative to the current directory. Without `-uall`, a new directory shows as one `?? dir/` line instead of its files.

## Workflow

1. Preflight: `git branch --show-current`, `git status`, `git status --porcelain -uall`.
   - Empty branch name (detached HEAD) → stop.
   - `git status` mentions a merge, rebase, cherry-pick or revert in progress, or unmerged paths → stop; the user finishes it first.
   - `git status` says "No commits yet" → there is no `HEAD`; below, use `git diff --cached` instead of `git diff HEAD`.
   - No changes → stop ("nothing to commit").
   - Protected branch: `main`, `master`, `development`, or the remote default branch (`git symbolic-ref --short refs/remotes/origin/HEAD`, if it exists; it prints `origin/<name>`, compare only `<name>`) → warn and ask: continue / cancel.
   - Files already staged (first column of `--porcelain`) → list them; they go into a commit only if approved in its file list.
   - Partially staged file (both columns non-blank, e.g. `MM`, `AM`, `RM`) → the whole working-tree version is committed; say so and ask: continue / cancel.
   - Deleted files (`D` in either column) → part of the change, but excluded from the size, binary and content checks (they do not exist on disk).
   - Renames: staged `R  old -> new` is one change with two paths. An unstaged `D old` + `?? new` that looks like a rename (similar names, same folder or same file name) → ask whether it is a rename. Either way, both paths of a rename always go together into the same commit's file list.
2. Build the overview from two sources: `git diff HEAD --stat` (tracked changes, staged and unstaged) and the `??` lines of `git status --porcelain -uall` (new files; `--stat` does not show them). Also read `git log --oneline -10` and the area labels (see Message). Read a full diff (`git diff HEAD -- <file>`) or a new file only where the intent is unclear from the name and stat.
3. Safety check (see Safety). Flagged files are excluded until the user decides. Nothing left after filtering → stop ("nothing to commit after skipping"); never run an empty commit.
4. Group changes by file. Unrelated groups (e.g. a fix and a feature) → propose one commit per group; the user may ask for a single commit. A file is never split (`git add -p` is interactive): one file with unrelated changes → say so and ask which commit it goes to, or whether the user splits it by hand.
5. Show the overview: planned commits (subject + files) and skipped files with reasons.
6. Then for each commit, in order:
   1. Show its files and full message (see Message).
   2. Wait for approval (see Rules); on changes, revise and show again.
   3. Commit it (see Committing).
   4. Commit or verification failed → stop; do not make the remaining commits, list them as not done.
7. Report.

## Safety

- File name:
  - `.env`, `.env.local`, `.env.*.local`, `*.pem`, `*.key`, `id_rsa*` → skip, list as skipped.
  - `.env.example`, `.env.sample`, `.env.template` → allowed (still go through the content check).
  - Any other `.env.*` (e.g. `.env.production`), `*secret*`, `*credentials*` → ask: include / skip.
- Size: `wc -c -- "<file>" ...` (quote each path); over 1 000 000 bytes → show the size and ask: include / skip. Never skip silently (lock files such as `package-lock.json` or `pnpm-lock.yaml` are often this big and belong with the dependency change).
- Binary → ask: include / skip.
  - Tracked files: `-	-` in `git diff HEAD --numstat`.
  - New files (numstat does not cover them): by extension — `png jpg jpeg gif webp ico bmp svgz pdf zip gz tgz 7z rar jar exe dll so dylib bin woff woff2 ttf otf eot mp3 mp4 mov avi wav db sqlite`.
- Content, without reading full diffs. Use this regex with the Grep tool, not the shell, so the quotes in it need no escaping:

  ```text
  sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|(?i:password|secret|token|api_?key)\s*[:=]\s*['"][^'"]{8,}
  ```

  The last alternative matches only a literal being assigned, not variable names, in any case (`API_KEY="..."` in `.env` style too); the other patterns stay case-sensitive to avoid false positives.

  Steps:
  1. Grep with `output_mode: "content"` and line numbers, with `path` set to each changed file (not deleted) in turn. Explicit paths are searched even when `.gitignore` matches them.
  2. New untracked file → every hit is a finding.
  3. Tracked file → a hit counts only if that line is added: check `git diff HEAD -U0 -- <file>` and keep matches on `+` lines. A secret already in `HEAD` or being removed is not a finding.
  4. Real finding → stop, show file, line number and the line with the value masked, ask: skip file / include (false positive) / cancel.

## Message

`type(scope): description`, blank line, body.

| Type       | When                                |
| ---------- | ----------------------------------- |
| `feat`     | New functionality                   |
| `fix`      | Bug fix                             |
| `docs`     | Documentation only                  |
| `refactor` | Code change without behavior change |
| `perf`     | Performance improvement             |
| `test`     | Tests only                          |
| `build`    | Build system or dependencies        |
| `ci`       | CI/CD configuration                 |
| `style`    | Formatting only, no code change     |
| `chore`    | Other housekeeping (config, tools)  |

- Scope = an `area` label from the Labels table in `.claude/skills/create-issue/SKILL.md` (read it; that table is the only source). No fitting area → no scope. File missing or has no Labels table → no scope, and tell the user why.
- Subject: imperative, lowercase, no trailing period, at most 72 characters.
- Body: what and why, not how; every line at most 72 characters. Explain non-obvious changes (e.g. why a `.gitignore` line exists). Trivial change → body may be omitted.
- Breaking change → `!` before the colon (`feat(backend)!: ...`) and a body paragraph on what breaks and how to migrate. No `BREAKING CHANGE:` footer.
- Branch name contains `PL-<N>`, matched case-insensitively (from create-issue, e.g. `feature/PL-12-add-login` or `fix/pl-12-login`) → last body line `Part of PL-12.`, always upper case (plain text, not a trailer). No key in the branch → no line; never invent one.

Example:

```text
feat(tooling): add create-issue skill

Add a project skill that plans and creates one GitHub issue
with a PL-N key, labels and a branch name.

Ignore .claude/tmp/, where the skill writes the temporary
issue body.
```

## Committing

For one approved commit:

1. `git add -- <files>` with exactly the approved paths. `<files>` includes deleted paths (stages the deletion) and both the old and new path of every rename.
2. Commit with the same paths, the message on stdin through a quoted heredoc:

   ```bash
   git commit -F - -- <files> <<'ADD_COMMIT_EOF'
   <message exactly as approved>
   ADD_COMMIT_EOF
   ```

   Only these files are committed; other staged files stay staged. The quotes around the delimiter make the shell pass the message as is: no `$(…)`, backticks or `$VAR` are expanded. The delimiter must not appear as a whole line in the message; if it does, use another one (e.g. add a digit). No trailing blank lines. Never write the message to a file: Claude Code asks for permission to write into `.git/` and `.claude/`, and a file anywhere else in the repo shows up as untracked.
3. Verify; mismatch → stop and report, never amend:
   - Message: `git log -1 --format=%B`. Compare with the approved message after trimming trailing spaces on each line and trailing blank lines (git normalizes whitespace on commit). Text added that the user did not approve → see Hooks (`commit-msg`).
   - Files: `git log -1 --name-status --format=`. The set of paths must equal the approved list. Treat `R old new` and `D old` + `A new` as the same change: git reports a rename only when the files are at least 50% similar.
4. `git status --porcelain -- <files>`: an approved file is modified or still staged → a hook changed it (see Hooks).

Report: hash, subject, files per commit, commits not done (if stopped), skipped files, and `git status --porcelain` at the end.

## Hooks

Formatters (prettier, lint-staged, etc.) may change files during the commit. With `git commit -- <paths>` git uses a temporary index, so hooks that run `git add` themselves may leave their fixes out of the commit or staged afterwards; step 4 of Committing catches both cases.

- Commit failed and approved files changed → show `git diff -- <files>`, ask; on yes, `git add -- <files>` and repeat the same commit command once.
- Commit succeeded but approved files changed afterwards → show the diff and propose a follow-up commit (`style(<scope>): apply formatter`); never amend.
- Commit failed without file changes → report the hook output, ask how to proceed; never `--no-verify`.
- A `commit-msg` hook added text to the message (e.g. a `Change-Id:` trailer) → the commit is valid; report what the hook added and continue. This is the only allowed difference from the approved message and the only trailer allowed, because the hook, not the skill, wrote it.

## Failures

- `git commit` fails for a non-hook reason → report the error and show the approved message, so the user can commit by hand.
- `git commit` hangs or fails on signing (`commit.gpgsign`, passphrase prompt) → stop and tell the user to unlock the key or sign by hand; never disable signing.
- The same commit is retried at most once.
