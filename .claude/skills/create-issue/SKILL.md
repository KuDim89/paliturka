---
name: create-issue
description: 'Plans and creates exactly one GitHub issue with an SI-N key, labels and a branch name. Use when the user says "create issue", asks to create or draft an issue or ticket, or runs /create-issue.'
allowed-tools: Read, Grep, Glob, Write, Bash(gh auth status*), Bash(gh repo view *), Bash(gh issue list *), Bash(gh issue view *), Bash(gh issue create *), Bash(gh issue edit *), Bash(gh label list *), Bash(gh label create *), Bash(gh label edit *)
---
# Create issue

## Rules

- One run = one issue; nothing goes to GitHub before approval.
- Talk in the user's language; plan and issue in English.
- Never create branches, edit code, commit, open PRs or edit existing issues, except the issue created in this run.
- Never guess: ask for missing information and values.
- Never claim a complete check: `gh issue list` and `gh label list` return at most 100 items, and closed issues aren't searched for duplicates. If a command returns exactly 100, say the result may be incomplete.

## Workflow

1. Preflight: `gh auth status` and `gh repo view --json nameWithOwner`. Either fails → stop with a clear message ("gh is not logged in: run `gh auth login`" / "not a GitHub repository"). The repo name is shown in the plan.
2. `EnterPlanMode`.
3. Read `gh issue list --state open --limit 100`, `gh label list --limit 100`, relevant code.
4. Similar open issue → show it, ask: create new / cancel. Else: "no similar issue among N open issues checked".
5. Ask until type, areas, scope, tasks and acceptance criteria are clear, and whether to assign the issue to the user (default: no). Several issues → propose a split, create one.
6. Plan: repo, title, labels, assignee (`@me` or none), branch, full body with `SI-N` placeholders, label changes.
7. `ExitPlanMode`; on rejection, revise.
8. Pre-publish check, publish, verify, report (see Publishing).

## Labels

| Type        | Label             | Prefix           | Description                                | Color      |
| ----------- | ----------------- | ---------------- | ------------------------------------------ | ---------- |
| bug         | `bug`           | `fix/`         | Something isn't working                    | `d73a4a` |
| feature     | `feature`       | `feature/`     | New functionality                          | `1d76db` |
| enhancement | `enhancement`   | `enhancement/` | Improve existing functionality             | `a2eeef` |
| docs        | `documentation` | `docs/`        | Improvements or additions to documentation | `0075ca` |
| area        | `frontend`      | —               | Frontend code                              | `fbca04` |
| area        | `backend`       | —               | Backend code                               | `5319e7` |
| area        | `tooling`       | —               | Developer tooling, scripts and CI          | `c5def5` |

One type, zero or more areas (a new area is proposed in the plan with a description and color). Only this issue's labels are checked: missing → `gh label create`, wrong description → `gh label edit --description`. Never touch other labels or colors; no `--force`. "Already exists" on create → treat as present.

## Key, title, branch

- Key `SI-N` = issue number (`#2` → `SI-2`); gaps from PRs are normal.
- Title `[SI-N] Short imperative title`; branch `<prefix>SI-N-<slug>`.
- Slug: 2–4 lowercase words joined by `-`, only `a-z0-9`.

  - Title has at most 4 words without filler words (`a, an, the, for, to, of, in, on, and, with`) → use those words.
  - Longer → summarize the main point: the action and its object, using words from the title where possible. Never truncate mid-phrase or end on a preposition.

  | Title                                     | Slug                    |
  | ----------------------------------------- | ----------------------- |
  | Add OAuth login for the API               | `add-oauth-login-api` |
  | Set up project from scratch               | `set-up-project`      |
  | Migrate match data from CSV to PostgreSQL | `migrate-match-data`  |
  | Show live score updates on the match page | `live-score-updates`  |

  The slug is shown in the plan; the user can change it before approval.

## Body template

```markdown
| Field | Value |
|---|---|
| Key | SI-N |
| Type | feature |
| Area | frontend |
| Labels | `feature`, `frontend` |
| Branch | `feature/SI-N-create-nav-menu` |

## Description
What is needed and why. For a bug: **Current behavior** and **Expected behavior**.

## Tasks
- [ ] Implementation step, each checkable on its own

## Acceptance criteria
- [ ] Verifiable statement

## Technical notes
- Affected files, approach, dependencies, risks, open questions
```

`Area` is `none` if no area. Empty section → `- None`.

Acceptance criteria: yes/no checkable, one check each, concrete values from the user or code. "The menu collapses below 768px", not "The menu should be responsive".

## Publishing

`N` is unknown until creation; never predict it.

1. Write the body with the Write tool to `.claude/tmp/create-issue-body.md` (git-ignored; not via PowerShell).
2. Pre-publish check, before anything goes to GitHub. The issue (title, labels, file) must have:

   - the template: first line `| Field | Value |`, all fields, all four sections in order;
   - Type, Area and Labels rows matching the label table and each other;
   - `SI-N` in Key and Branch; slug matching the slug rules;
   - at least one task and one acceptance criterion, each criterion verifiable;
   - English only.

   Errors:

   - **Mechanical** (template, section order, fields, label rows, `SI-N`, slug): fix without asking to match the approved plan, mention in the report, rerun the check. Never change approved content.
   - **Content** (vague or missing criteria, missing tasks, non-English text): report, publish nothing, ask: fix or publish as is. "Fix" → fix, rerun the check. "Publish as is" → continue.
3. Apply the approved label changes.
4. `gh issue create --title "<title without key>" --body-file .claude/tmp/create-issue-body.md --label "<a>,<b>"`, plus `--assignee @me` if approved. Run it once only.
5. Take `N` from the printed URL; replace every `SI-N` in the file with `SI-<N>`; `gh issue edit <N> --title "[SI-<N>] <title>" --body-file .claude/tmp/create-issue-body.md`.
6. `gh issue view <N> --json title,labels,assignees,body,state`: title, labels, assignee and body match the plan; no `SI-N` left. Mismatch → repeat step 5, check again.
7. `rm .claude/tmp/create-issue-body.md`, then report URL, key, labels, branch and the check result.

## Failures

Repeat each `gh` command at most once, then stop and give the command for a manual run. Exception: `gh issue create` is never repeated.

On stop: report what failed, keep the temp file and give its path.

- `create` errors or prints no URL → find the exact title in `gh issue list --state all --author @me --limit 10`. Found → continue from Publishing step 5. Not found → report "not created".
