# paliturka

A personal cloud hub for books. Users upload their books once, so the files no longer sit in different folders and take up space on their computers, then read and annotate them from any device.

**Goal:** a learning project plus personal use. No monetization is planned.

**Status:** stage 1 (Skeleton) is done: the Next.js app with FSD, Prisma with SQLite, the storage module, i18n, themes and design tokens, linters, unit and e2e tests, PR checks and git hooks. It shows a placeholder home page. Next is stage 2 (Sign-in). Web comes first (responsive); a mobile app is a future plan.

**Current stage:** local development only. The frontend and backend run on the developer's computer, with no servers or external accounts. Deployment comes later, when the user decides.

## Product

- **Sign up / sign in:** registration is open to anyone, with a storage quota per user. Email and password (at least 8 characters); sign up requires accepting the terms and privacy policy. Google sign-in comes later.
- **Links in emails:** the verification link is valid for 24 hours, the password reset link for 1 hour; each works once and can be resent after 60 seconds. The reset request does not reveal whether an account exists. After setting a new password the user is signed in.
- **Account:** email must be verified before uploading books; until then the user can read and browse the library. Users can delete their account, which removes their books, annotations, bookmarks and progress. Deletion asks for the password and a confirmation, happens immediately and sends a confirmation email. Privacy policy and terms are public pages.
- **Access:** books are visible only to their owner. Files cannot be shared.
- **Home (`/`):** a public landing page. It briefly says what paliturka is and who it is for, shows contact details and links to sign up, sign in, the privacy policy and the terms. A signed-in user who opens `/` is redirected to the library page.
- **Library page:** where the user goes after signing in. A new user with no books sees an empty state inviting them to add a book.
- **Upload:** one book at a time.
- **Library:** search by title and author, sort (recently opened, recently added, title, author), filter by status with counts, a storage meter, delete a book (removes the file, annotations and progress; asks for confirmation, no undo) and download the original EPUB. Covers come from the EPUB; a generated cover is shown when the EPUB has none. Editing book metadata is not in v1.
- **Duplicates:** checked during upload, before the book is saved. If the file content matches a book already in that user's library (compared by hash), a message explains this and offers two buttons: cancel, which does not upload the book, and continue, which uploads the duplicate.
- **Book page:** short summary (or a message that none was found), reading status (`unread`, `reading` with %, `read`), a button to continue reading, the list of annotations and the user's comments.
- **Book comments:** the user can add, edit and delete their own comments on a book, up to 5,000 characters each. Formatting: bold, italic, list, quote, link. They are stored as Markdown and are visible only to that user.
- **Deleting notes:** deleting an annotation or a comment asks for confirmation and can be undone for 5 seconds.
- **Summaries:** taken from the EPUB metadata first, then from Open Library or Google Books. A summary may be missing, especially for Ukrainian books. No LLM generation.
- **Reader:** books are read inside paliturka. Progress and the reading position are saved automatically, and the book opens where the user stopped. Reader settings are saved in the account: text size, font, spacing, column width, page (light, sepia or dark), pages or scroll mode, and reset.
- **Status:** changes with progress (`reading` once opened, `read` once progress reaches 98%). At the end the reader shows a card that sets `read` and lets the user undo it. The user can also set the status by hand.
- **Bookmarks:** added and removed from the selection toolbar in the reader, listed there with chapter, approximate page and date. A bookmark is a place to jump to, not the reading position.
- **Annotations:** created by selecting text in the reader. Each one is a quote from the book and links to its location there. The quote text cannot be edited, but the user can move the annotation to another type, which changes its color, and add one comment to it: their own thought, remark or review. The comment has the same formatting as book comments, is stored as Markdown and can be edited and deleted. Users can delete annotations, filter them by color and export them to a Markdown file (`<title-slug>-notes.md`), which includes all annotations grouped by type, their comments and the book comments.
- **Languages:** English and Ukrainian. Locale codes are `en` and `uk` (`uk` is the language code for Ukrainian; `UA` is the country). The default comes from the browser.
- **Themes:** light and dark, switchable by the user. The default comes from the system. Sepia exists only as a reader page setting.
- **Preferences:** the chosen language, theme and reader settings are saved in the account and apply on all devices.
- **Future plans, not in development:** reading without internet, uploading several books at once, custom annotation types (users add their own types with a description and a color), editing book metadata, and a Content Security Policy (CSP) to block scripts inside uploaded EPUBs.

### Annotation colors

These four standard types are always available. Users cannot delete them or change their colors or descriptions. In the future, users will be able to add their own types alongside them.

| Color    | Meaning                                         |
| -------- | ----------------------------------------------- |
| `pink`   | Interesting thoughts, quotes, emotional moments |
| `green`  | New ideas, useful information, conclusions      |
| `orange` | Unclear points, questions, contradictions       |
| `yellow` | Important fragments to reread                   |

## Supported formats

EPUB only for now. It best fits the responsive layout, the themes and selecting text for annotations.

- Other formats and EPUBs with DRM are rejected on upload with a clear message.
- There is no server-side conversion.
- EPUB has no fixed pages, so annotations link to a location in the text. Any page number shown is approximate.

Formats we want to support in the future: PDF, FB2, MOBI/AZW3/AZW, DJVU, TXT, DOC/DOCX. They are out of scope until the user decides otherwise. Scans and complex layouts will not convert well to EPUB, so they may need another approach.

## Stack

Chosen. Next.js, TypeScript, pnpm, ESLint, Prettier, Steiger, Vitest, Playwright, Zod, Prisma, Tailwind CSS, shadcn/ui, next-intl, husky and lint-staged are installed; the rest is not installed or tested yet. Config files are TypeScript (`*.config.ts`); ESLint loads its `eslint.config.ts` through `jiti`, a dev dependency, so keep `jiti` when updating ESLint. The exception is `postcss.config.mjs`: Next.js does not read a TypeScript PostCSS config:

| Area         | Choice                                                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework    | Next.js with TypeScript                                                                                                                              |
| Database     | SQLite file, through Prisma                                                                                                                          |
| File storage | Local folder                                                                                                                                         |
| Auth         | Better Auth                                                                                                                                          |
| Email        | Printed to the console (verification and password reset links)                                                                                       |
| Validation   | Zod                                                                                                                                                  |
| i18n         | next-intl                                                                                                                                            |
| Styling      | Tailwind CSS and shadcn/ui                                                                                                                           |
| EPUB reader  | epub.js                                                                                                                                              |
| Tooling      | pnpm, ESLint, Prettier with `@ianvs/prettier-plugin-sort-imports`, Steiger, GitHub Actions (PR checks), cross-env, husky and lint-staged (git hooks) |
| Tests        | Vitest (unit), Playwright (e2e for sign-in, upload and reading)                                                                                      |

Local data lives in a `storage/` folder:

```text
storage/
  books/<userId>/<bookId>.epub   Book files
  paliturka.db                   SQLite database
```

Constraints:

- **Limits:** 50 MB per file, 500 MB quota per user.
- **Storage folder:** `storage/` is outside `public/` and ignored by git. A route that checks the owner serves the files.
- **Database client:** server code uses `db` from `@/shared/db/index.server`, one Prisma client reused across hot reloads. The client is generated into `generated/prisma/` on `pnpm install` and is not committed. The Prisma CLI reads `DATABASE_URL` from `.env.local`, like the app.
- **Storage module:** code reaches book files only through one storage module, so a move to object storage changes that module and the upload flow, not the callers. It lives in `src/shared/storage/`; server code uses `bookStorage` from `@/shared/storage/index.server`, and nothing outside that folder uses `fs` on book files. The folder comes from the optional `STORAGE_DIR` variable (default `./storage`). Temporary files left by a write that crashed are removed when the server starts (`instrumentation.ts`).
- **Styling:** the design tokens are `--pl-*` variables in `app/globals.css`, light on `:root` and dark under `.dark`, with Tailwind utilities such as `bg-pl-bg` and `text-pl-ink`. The shadcn/ui variables there point at the tokens. shadcn/ui uses Radix and adds components to `src/shared/ui` and its `cn` helper to `src/shared/lib/cn.ts` (`components.json`); no components are added yet. Literata and Onest are local files in `src/shared/ui/fonts/` (how they were made is in its `README.md`), used as `font-serif` and `font-sans`.
- **Theme:** next-themes, configured once in `src/shared/lib/theme/ThemeProvider.tsx` and rendered by the `<html>` shell (`src/shared/ui/html-document/`). Its script sets the `dark` class and `color-scheme` on `<html>` before the page is painted, follows the system theme until the user picks one, and keeps the choice in `localStorage` under `theme`; it applies the theme again if React re-renders the page (for example after a browser translator changes the DOM). Components switch the theme with `useTheme().setTheme` from `@/shared/lib/theme`. The server does not know the theme, so pages stay static. In dev mode, a hydration mismatch caused by an extension shows a React warning about the script tag; it is harmless.
- **Locale in the URL:** every page lives under `app/[locale]/` (`/en/...`, `/uk/...`), with `en` as the default. `proxy.ts` (Next.js middleware) redirects a URL without a locale to the one in the `NEXT_LOCALE` cookie, then the browser language, then `en`; it skips `/api`, `/_next` and files with an extension. `app/[locale]/layout.tsx` is the root layout: it sets `<html lang>`, allows only `en` and `uk` (`dynamicParams = false`), and uses `generateStaticParams` and `setRequestLocale`; every page under it calls `setRequestLocale` too, or it becomes dynamic. Every URL that matches no route gets `app/global-not-found.tsx` (the `experimental.globalNotFound` flag in `next.config.ts`), a full 404 document in the locale from the URL. Do not add `notFound()` pages or `not-found.tsx` under `[locale]`: with a root layout in a dynamic segment, Next.js renders them on the client only. The 404 page is a placeholder until the design's page is built in stage 2.
- **i18n:** the setup is in `src/shared/i18n/` (routing, request config, navigation helpers); use its `Link`, `redirect`, `useRouter` and `usePathname` so links keep the locale. Messages are `src/shared/i18n/messages/en.json` and `uk.json`; keys are typed from `en.json`, so an unknown key fails `pnpm typecheck`. To add a string: add the key to both files (a unit test fails when they differ), then use `useTranslations` in components or `getTranslations` in async server code. Unit tests render translated components with `renderWithIntl` from `@/shared/i18n/index.testing`.
- **Auth:** Google sign-in must be possible to add without rework.
- **EPUB reader:** if epub.js causes problems, foliate-js is the alternative to try.

### Deployment (later)

Preliminary choices for when the user decides to deploy. Do not set these up or add them before that. Check the providers' current limits and prices first.

- **Hosting:** Vercel (app), Neon (PostgreSQL), Cloudflare R2 (book files), Brevo (email). Free options first.
- **Migration:** move from SQLite to PostgreSQL, recreate the Prisma migrations and move the data. Book files move to R2 and upload directly through presigned URLs, because Vercel limits request size.
- **Email domain:** Brevo starts without an own domain, so emails may land in spam or be rejected. Test delivery with a real email; an own domain can be added later.
- **SEO:** public pages (landing, privacy policy, terms) use SSR/SSG so search engines can index them. The library behind login is private and is not indexed.
- **Before going public:** a total storage limit, rate limiting against bots, and the final text of the privacy policy and terms. The draft in the design makes concrete claims (encryption at rest, logs kept 30 days, 14 days' notice of changes, replies within two business days); the final text must match what is built.

## Development order

Within each stage, build and test the API first, then the frontend. The API uses route handlers in `app/api`, not Server Actions, so a future mobile app can reuse it. Screens follow the design (see Conventions).

| Stage          | Backend                                                                                  | Frontend                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1. Skeleton    | Next.js, FSD, Prisma with SQLite, storage module                                         | i18n, themes and design tokens, ESLint, Prettier, Steiger, Vitest, Playwright, GitHub Actions (PR checks) |
| 2. Sign-in     | Sign up, sign in, email verification, password reset, account deletion                   | Landing, privacy policy and terms pages (draft text), sign-in, verification and account screens           |
| 3. Library     | Upload, EPUB validation, quotas, duplicates, covers, list, search, delete                | Library page, empty state                                                                                 |
| 4. Reading     | Serving the file, progress and position, status, bookmarks, reader settings              | Book page, reader, bookmarks, reader settings                                                             |
| 5. Annotations | Create, delete, change type, filter, annotation comments, book comments, Markdown export | Text selection, colors, list, annotation comments, book comments                                          |
| 6. Summaries   | EPUB metadata, Open Library, Google Books                                                | Showing the summary                                                                                       |

## Open decisions

Not chosen yet. When the work reaches one of these, remind the user and decide it together first. Do not choose, create or add a dependency for any of them without the user's approval:

- **Routes:** the page map and URL structure. Decided while building the pages. The locale part is decided (see Constraints: the locale is in the URL).
- **Data model:** entities, fields and relations. Proposed when the work on models starts; no Prisma schema before approval.
- **API conventions:** response and error format, error keys for i18n, owner checks. Ask when the API work starts. Input validation uses Zod.
- **EPUB parsing on the server:** the library for metadata, covers, DRM and damaged-file checks.
- **Comment Markdown:** how comments are rendered and sanitized.
- **Approximate page numbers:** how they are calculated.
- **Library search:** how to search case-insensitively in Cyrillic (SQLite `LIKE` ignores case only for ASCII, so «Тиша» does not match «тиша»). Decided during the library work.
- **Contact email** on the landing page: the design shows `hello@paliturka.app` as a placeholder. The app reads the address from config until a real one is chosen.

When a decision is made, move it to the section it belongs to.

## Conventions

- Code, comments, commits, PRs and issues are in English.
- The app follows Feature-Sliced Design. The rules are in `.claude/rules/fsd.md`; read them before creating the first files in `app/` or `src/`.
- The UI follows the design. The visual system is in `.claude/rules/design.md` and the screens in `.claude/rules/design-screens.md`; read both before creating the first UI files.
- No hard-coded UI strings: all text goes through i18n, in both `en` and `uk`. Dates, numbers and plurals («8 книжок») are formatted with next-intl for the current locale, never by hand.
- Colors come from the `--pl-*` theme tokens, which work in both themes.
- Accessibility target is WCAG 2.2 AA: 4.5:1 text contrast, everything usable from the keyboard, visible focus, semantic elements, focus kept inside open dialogs.
- Unit tests sit next to the code they test, inside the slice. The file name sets the environment: component tests are `*.test.tsx` and run in jsdom; logic and server tests are `*.test.ts` and run in Node, where globals such as streams and `fetch` are real. A `*.test.ts` file that needs the DOM starts with `// @vitest-environment jsdom`.
- Coverage: `pnpm test:coverage` fails below 80% of statements, branches, functions or lines. It counts only `src/`, without public API and entry-point files (`index*.ts`) and type declarations; `app/` is left out because routes only wire pages in and the e2e tests cover them. So logic goes into slice modules, never into `index*.ts` files or `app/`, where it would not be measured.
- Imports are sorted by Prettier (`@ianvs/prettier-plugin-sort-imports`, set in `.prettierrc.json`), so never order them by hand: Node.js built-ins (`node:*`) and packages first, then `@/` aliases, then relative paths, with a blank line between the groups and alphabetical order inside a group. Side-effect imports such as `import './globals.css'` stay where they are. Prettier sorts on save, in the pre-commit hook and `pnpm format`; `pnpm format:check` fails on unsorted imports.
- Modules: `package.json` sets `"type": "module"`, so every `.js` file is an ES module (`import`/`export`). A config that must use `require` (CommonJS) is named `.cjs`, for example a tool's config copied from older docs.
- Environment variables: `.env.example` (no secrets) is committed, `.env.local` is ignored. Variables are read in one module, `src/shared/config/`, and validated with Zod at startup (`next.config.ts` runs the check). Server code imports `env` from `@/shared/config/index.server`; nothing else reads `process.env`. To add a variable, add a field to `src/shared/config/env/schema.ts` and a line with a comment to `.env.example`.
- `.env.example` values must work as they are, both for local runs and on CI, which copies the file to `.env.local`; it never holds secrets. A secret CI needs one day (for example for deployment) goes into GitHub Secrets.
- Standard annotation types are defined once, as named constants with their colors and meanings. An annotation stores its type, not its color, so custom types can be added later without rework.
- Annotation, bookmark and reading-position locations are stored as EPUB CFI, not as pixel positions or page numbers, so they survive font and screen-size changes.
- Uploads are validated on the server (real EPUB, no DRM, within limits). The browser also runs checks, only for convenience: it can say at once that a file is over 50 MB or is not an `.epub`, without waiting for the upload. These checks are not protection, so the server still validates everything itself. Book files are private and served only to their owner.

## Definition of done

Before a task counts as done and a PR is opened:

- `pnpm check` passes (lint, typecheck, Prettier, Steiger and Vitest with the coverage threshold). The `PR checks` workflow runs it, the release script tests and the e2e tests on every PR into `development` and `main`.
- New logic has unit tests. Changes to sign-in, upload or reading also pass the Playwright e2e tests.
- New screens are checked in both languages and both themes.
- `CLAUDE.md` is updated in the same PR: the Commands section when a command is added or changed, the Status line when a stage is finished.

## Repository layout

```text
.claude/rules/       Rules that load for matching paths
.claude/skills/      Workflow skills (see Git workflow)
.claude/agents/      Agents that skills start with an empty context (do-code-review)
.claude/hooks/       Hooks for those agents and the git-write guard of the main session, with their tests
.claude/settings.json Claude Code settings: no own attribution, ask before git commit, deny unsafe git add and commit options
.github/workflows/   PR checks (pr-checks.yml: the Definition of done checks on every PR) and release workflows
.husky/              Git hooks (pre-commit, commit-msg, pre-push); lint-staged.config.ts sets what pre-commit runs
.vscode/             Shared VS Code settings and recommended extensions
app/                 Next.js routes, pages under app/[locale]/; each route only re-exports a page; globals.css holds the tokens
proxy.ts             Locale redirects (Next.js middleware)
pages/               Empty; stops Next.js from reading src/pages as routes
src/                 FSD layers: pages, entities, shared
e2e/                 Playwright end-to-end tests
prisma/              Prisma schema and, later, migrations
generated/           Generated Prisma client, not committed
scripts/git-hooks/   Checks run by the git hooks (staged files, commit message), with their tests
scripts/release/     Release plan script and its tests
components.json      shadcn/ui settings
package.json         Scripts, dependencies, Node.js and pnpm versions
pnpm-workspace.yaml  pnpm settings (engineStrict, allowed install scripts)
.nvmrc               Exact Node.js version
```

## Git workflow

- Branches: `main` (releases) ← `development` (integration) ← feature branches.
- Issue keys are `PL-N`; branches are `<prefix>PL-N-<slug>`.
- Commits follow the Commits section below.

### Commits

The `commit-msg` hook checks the message and the `pre-commit` hook checks the staged files (see Commands); these rules cover what the hooks cannot.

- Message: `type(scope): description`, a blank line, then a body on what changed and why (not how). Types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `style`, `chore`. Scope is an area label (`frontend`, `backend`, `tooling`) or none. Subject imperative, lowercase, no trailing period, at most 72 characters; body lines at most 72. A breaking change gets `!` before the colon and a body paragraph on what breaks and how to migrate. When the branch has `PL-<N>`, the last body line is `Part of PL-<N>.`
- No trailers (`Co-Authored-By`, `Generated with`) and no mention of AI or Claude Code in the message. This overrides any default attribution.
- Before committing, show the files and the full message and wait for a clear yes; a yes with changes is a change request: apply it and show again. One yes covers one commit. Group unrelated changes into separate commits.
- Stage with `git add -- <explicit paths>`; never `-A`, `.` or `-u`. A file whose deletion is already staged is not passed to `git add` (git no longer finds it), only to `git commit`. Commit with `git commit -F - -- <paths>` and the message in a quoted heredoc (`<<'EOF'`).
- Never `--no-verify` or `--amend`. A hook fails → fix the cause and commit again. A hook changed files after the commit → show the diff and propose a follow-up commit.
- After committing, compare `git log -1 --format=%B` and `git log -1 --name-status --format=` with what was approved.
- A line that only looks like a secret (a fake value in a test) passes the scan with a `secret-scan: allow` comment on it.

Use the skills; they hold the full rules:

| Task                                        | Skill            |
| ------------------------------------------- | ---------------- |
| Create a GitHub issue                       | `create-issue`   |
| Work on an issue (plan, build, test)        | `do-issue`       |
| Review uncommitted changes before a commit  | `do-code-review` |
| Rebase a branch onto `development`          | `sync-branch`    |
| Open a PR into `development`                | `create-pr`      |
| Commit, sync, push and open a PR in one run | `ship-pr`        |
| Prepare a release (`development` → `main`)  | `release-pr`     |

## Commands

Requirements: Node.js 26 (the exact version is in `.nvmrc`; `nvm use` switches to it) and pnpm 12 (the exact version is in `packageManager`), installed with `npm install -g pnpm@12.18.0`. An older pnpm fails with `packages field missing or empty`, because it does not read a `pnpm-workspace.yaml` that holds only settings. `pnpm install` fails on a Node.js version outside `>=26 <27`.

Install dependencies, create the local environment file, run the app at `http://localhost:3000`, and build it. The app, `pnpm build` and the e2e tests do not start without `.env.local`:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
pnpm build
```

To test on a phone or tablet on the same network: put the computer's local IP (`pnpm dev` prints it as `Network`) into `DEV_ALLOWED_ORIGINS` in `.env.local`, for example `DEV_ALLOWED_ORIGINS=192.168.1.20`, restart `pnpm dev`, and open `http://<ip>:3000/uk` on the device. Without it, Next.js blocks the dev assets for that address and parts of the page stay blank. The IP can change when the network does; never commit it.

Check the code. `pnpm check` runs all the checks of the Definition of done except e2e (lint, format:check, lint:fsd, typecheck, test:coverage) and stops at the first failure; it is the single list of checks for people, the Verify step of `do-issue`, the `PR checks` workflow on GitHub and the pre-push hook. Each command exits with a non-zero code on a problem; `lint` also fails on warnings:

```bash
pnpm check         # all of the below plus the unit tests with the coverage threshold
pnpm lint          # ESLint
pnpm format:check  # Prettier, check only
pnpm lint:fsd      # Steiger: FSD rules in src/
pnpm typecheck     # TypeScript, no output files
```

Git hooks (husky) run the checks before the code leaves the computer; `pnpm install` sets them up through the `prepare` script, and CI skips them (`HUSKY=0`):

- `pre-commit`: first `scripts/git-hooks/check-staged-files.mjs`, which blocks staged local environment and key files (`.env`, `.env.*` except `.env.example`, `.env.sample` and `.env.template`, `*.pem`, `*.key`, `id_rsa*`) and added lines that look like secrets; then lint-staged on the staged files (Prettier with `--write`, ESLint with `--fix` and the unit tests related to them, as set in `lint-staged.config.ts`), then `pnpm typecheck` for the whole project. Fixes are added to the commit.
- `commit-msg`: `scripts/git-hooks/commit-msg.mjs` checks the message against the Commits section (format, type, scope, line length, no AI attribution); merges, reverts and `fixup!` commits pass.
- `pre-push`: `pnpm check`. The e2e tests are not in the hooks: they need browsers and a server, and CI runs them.

Never skip a hook with `--no-verify`; the skills never do. A failing hook stops the commit or push: fix the problem and run it again. `.claude/settings.json` turns off Claude Code's own commit and PR attribution (`attribution`), makes it ask before every `git commit` (in Bash and PowerShell) and denies `git add -A`, `git add .`, `git add -u`, `git commit -a`, `--no-verify` and `--amend`. Those rules match command text, so a PreToolUse hook, `.claude/hooks/git-write-guard.mjs`, also parses every Bash and PowerShell command and blocks the same options however they are spelled: combined short flags (`-anm`), abbreviated long options (`--no-verif`) and commands chained after `&&` or `;`.

Format all files with Prettier:

```bash
pnpm format
```

In VS Code, install the recommended extensions it offers when the project opens: Tailwind CSS IntelliSense, ESLint and Prettier. `.vscode/settings.json` opens `.css` files as Tailwind CSS (so `@theme` and `@apply` are not flagged), formats with Prettier on save and runs ESLint with the project config, so the editor reports the same problems as `pnpm lint` and `pnpm format:check`.

Run the unit tests (Vitest):

```bash
pnpm test           # run once
pnpm test:watch     # rerun on file changes
pnpm test:coverage  # run once with a coverage report (table + coverage/index.html); fails below 80%
pnpm test:ui        # Vitest UI in the browser, for local use
pnpm test:changed   # run once, only tests related to uncommitted changes
```

The Vitest UI asks for a token. The first time in a browser, copy the full `UI started at …?token=…` URL from the terminal into the address bar; the browser then keeps a login cookie, and later runs open the UI on their own.

Run the end-to-end tests (Playwright) in Chromium, Firefox and WebKit. The browsers are not npm packages: install them once after cloning, or the first run fails. The tests start `pnpm dev` themselves, or reuse one already running at `http://localhost:3000`. `pnpm test:e2e:ci` runs them the way CI does: it builds and starts the production server (`pnpm build` and `pnpm start`), retries failed tests, and fails when port 3000 is taken instead of testing what runs there, so stop `pnpm dev` first:

```bash
pnpm exec playwright install chromium firefox webkit  # once, and after updating Playwright
pnpm test:e2e         # run once
pnpm test:e2e:ci      # run once against the production build, as on CI
pnpm test:e2e:ui      # Playwright UI mode
pnpm test:e2e:headed  # run with visible browser windows
pnpm test:e2e:report  # open the HTML report of the last run
```

Work with the database (Prisma). `pnpm install` already generates the client:

```bash
pnpm db:generate  # generate the Prisma client after a schema change
pnpm db:migrate   # create and apply migrations in development
pnpm db:studio    # open Prisma Studio
```

Run the release script tests:

```bash
python -m unittest discover -s scripts/release/tests
```
