# paliturka

A personal cloud hub for books. Users upload their books once, so the files no longer sit in different folders and take up space on their computers, then read and annotate them from any device.

**Goal:** a learning project plus personal use. No monetization is planned.

**Status:** pre-code. The repo holds only workflow tooling; there is no app code yet. Web comes first (responsive); a mobile app is a future plan.

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

Chosen, but nothing is installed or tested yet:

| Area         | Choice                                                                        |
| ------------ | ----------------------------------------------------------------------------- |
| Framework    | Next.js with TypeScript                                                       |
| Database     | SQLite file, through Prisma                                                   |
| File storage | Local folder                                                                  |
| Auth         | Better Auth                                                                   |
| Email        | Printed to the console (verification and password reset links)                |
| Validation   | Zod                                                                           |
| i18n         | next-intl                                                                     |
| Styling      | Tailwind CSS and shadcn/ui                                                    |
| EPUB reader  | epub.js                                                                       |
| Tooling      | pnpm, ESLint, Prettier, Steiger, GitHub Actions (PR checks)                   |
| Tests        | Vitest (unit), Playwright (e2e for sign-in, upload and reading)               |

Local data lives in a `storage/` folder:

```text
storage/
  books/<userId>/<bookId>.epub   Book files
  paliturka.db                   SQLite database
```

Constraints:

- **Limits:** 50 MB per file, 500 MB quota per user.
- **Storage folder:** `storage/` is outside `public/` and ignored by git. A route that checks the owner serves the files.
- **Storage module:** code reaches book files only through one storage module, so a move to object storage changes that module and the upload flow, not the callers.
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

| Stage        | Backend                                                                       | Frontend                                     |
| ------------ | ----------------------------------------------------------------------------- | -------------------------------------------- |
| 1. Skeleton  | Next.js, FSD, Prisma with SQLite, storage module                              | i18n, themes and design tokens, ESLint, Prettier, Steiger, Vitest, Playwright, GitHub Actions (PR checks) |
| 2. Sign-in   | Sign up, sign in, email verification, password reset, account deletion        | Landing, privacy policy and terms pages (draft text), sign-in, verification and account screens |
| 3. Library   | Upload, EPUB validation, quotas, duplicates, covers, list, search, delete     | Library page, empty state                    |
| 4. Reading   | Serving the file, progress and position, status, bookmarks, reader settings   | Book page, reader, bookmarks, reader settings |
| 5. Annotations | Create, delete, change type, filter, annotation comments, book comments, Markdown export | Text selection, colors, list, annotation comments, book comments |
| 6. Summaries | EPUB metadata, Open Library, Google Books                                     | Showing the summary                          |

## Open decisions

Not chosen yet. When the work reaches one of these, remind the user and decide it together first. Do not choose, create or add a dependency for any of them without the user's approval:

- **Routes:** the page map and URL structure, including whether the locale is in the URL. Decided while building the pages.
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
- Environment variables: `.env.example` (no secrets) is committed, `.env.local` is ignored. Variables are read in one module and validated with Zod at startup.
- Standard annotation types are defined once, as named constants with their colors and meanings. An annotation stores its type, not its color, so custom types can be added later without rework.
- Annotation, bookmark and reading-position locations are stored as EPUB CFI, not as pixel positions or page numbers, so they survive font and screen-size changes.
- Uploads are validated on the server (real EPUB, no DRM, within limits). The browser also runs checks, only for convenience: it can say at once that a file is over 50 MB or is not an `.epub`, without waiting for the upload. These checks are not protection, so the server still validates everything itself. Book files are private and served only to their owner.

## Definition of done

Before a task counts as done and a PR is opened:

- Lint, typecheck, Prettier, Steiger and Vitest pass.
- New logic has unit tests. Changes to sign-in, upload or reading also pass the Playwright e2e tests.
- New screens are checked in both languages and both themes.
- `CLAUDE.md` is updated in the same PR: the Commands section when a command is added or changed, the Status line when a stage is finished.

## Repository layout

```text
.claude/rules/       Rules that load for matching paths
.claude/skills/      Workflow skills (see Git workflow)
.github/workflows/   Release workflow
scripts/release/     Release plan script and its tests
```

## Git workflow

- Branches: `main` (releases) ← `development` (integration) ← feature branches.
- Issue keys are `PL-N`; branches are `<prefix>PL-N-<slug>`.
- Commits follow Conventional Commits, with an area scope (`frontend`, `backend`, `tooling`).

Use the skills; they hold the full rules:

| Task                                        | Skill          |
| ------------------------------------------- | -------------- |
| Create a GitHub issue                       | `create-issue` |
| Commit changes                              | `add-commit`   |
| Rebase a branch onto `development`          | `sync-branch`  |
| Open a PR into `development`                | `create-pr`    |
| Commit, sync, push and open a PR in one run | `ship-pr`      |
| Prepare a release (`development` → `main`)  | `release-pr`   |

## Commands

Run the release script tests:

```bash
python -m unittest discover -s scripts/release/tests
```
