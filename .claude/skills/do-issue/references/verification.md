# Verification

## Checks

- Run the checks the Definition of done in `CLAUDE.md` requires for this change, with the commands from its Commands section (fallback: `package.json` scripts). This skill names no checks itself: `CLAUDE.md` is the single source.
- A required check has no tooling yet (e.g. the pre-code stage) → say which checks don't exist yet. Never report them as passed.
- A failed check → step 9 (mechanical fix or regular fix).

## Test coverage

Every test from the plan's Tests section exists and runs. New logic without a test → a failed check, not a note.

## Resume

Work marked done in a resumed plan is verified too. Nothing counts as passing because an earlier run did it.

## Acceptance criteria

Check each criterion one by one, with evidence: command output, a test, a file, running the app (read `dev-server.md` first). Result per criterion:

- **passed**: the evidence shows it;
- **failed**: → step 9;
- **manual**: can't be verified automatically → Manual checks.

## Manual checks

Only the user can mark them passed.

- Ask only after every automated check passes, so the user never checks broken code.
- All manual items in one message. Each item with exact steps: what to run or open, what to do, the expected result (e.g. "open `http://localhost:3000/` in the dark theme; the sign-in button is visible and gets focus with Tab").
- Then wait. The answer per item, or one clear answer for all («все ок»), decides:
  - **Passed**: an explicit yes for that item → "checked manually by the user".
  - **Failed**: the user describes what is wrong → a problem for step 9; it counts as a fix cycle like any other failure.
  - **Not checked**: "later", no answer, or an unclear answer (ask once to clarify) → **unverified**: not passed, not failed.
- Never treat silence, a partial answer or your own reasoning as a pass.
- Ask again for an item already passed when a later fix touched related code (unsure → ask again), and for all manual items on every resume.
