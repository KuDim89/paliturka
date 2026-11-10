---
paths:
  - "app/**/*"
  - "src/**/*"
---

# Screens

What each screen contains and how it behaves, from the design artifact (see `.claude/rules/design.md`). Quoted Ukrainian strings are the design's copy; every string also needs its `en` version in i18n. Where the prototype and `CLAUDE.md` disagree, `CLAUDE.md` wins.

## Shared

- App headers: logo, language switch (УКР / EN), theme toggle, account menu. On phone the language switch moves into the account menu.
- Form errors appear after submit, under the field, with the `err` border and ring; focus moves to the first invalid field. Server errors (wrong credentials, wrong password) appear as a banner above the form and disappear when the user types.
- Destructive actions use an inline confirmation (`danger-bg` panel with Cancel / Delete). Deleting an annotation or a comment shows a toast with «Повернути» (undo) for 5 s. Deleting a bookmark or a book has no undo.
- Email check: `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$`.

## Landing (`/`)

- Sticky header. Desktop: section links «Як це працює», «Можливості», «Контакти» (scroll to sections, underline the one in view), language, theme, «Увійти», «Створити акаунт». Tablet and phone: a settings button (panel with language and theme only) and a menu button (full-height menu with the section links, «Створити акаунт», «Увійти», privacy and terms links). Only one panel is open at a time.
- Hero: eyebrow «Особиста хмарна бібліотека», title «Усі ваші книжки — в одній палітурці.», lead text, «Створити акаунт» and «Мій акаунт» (to sign in), fine print «Безкоштовно · 500 МБ на акаунт · формат EPUB». Shelf illustration with animated notes on desktop and tablet; shelf only on phone.
- «Як це працює»: three steps (upload one book up to 50 MB with the duplicate warning; read anywhere with progress and status; annotate in four colors and export to Markdown).
- «Чотири кольори для думок»: the four annotation types and a link to sign up.
- Green band: for people who read on several devices; books are private, no ads or subscriptions; «Створити бібліотеку».
- Footer: wordmark, contact email (from config; the design's `hello@paliturka.app` is a placeholder), privacy and terms links, «© 2026 paliturka».
- A signed-in user who opens `/` is redirected to the library.

## Sign in and sign up

- One screen with tabs «Вхід» / «Реєстрація»; `?mode=up` opens sign up. Form up to 420 px wide. Desktop shows a green `band` side panel (44 % width) with a quote and «500 МБ на акаунт · EPUB · українською та англійською».
- Sign in: «З поверненням», email, password, «Забули пароль?» (to reset), «Увійти» → library. Wrong credentials banner: «Не вдалося увійти. Email або пароль неправильні…».
- Sign up: «Нова бібліотека», email, password (at least 8 characters), required checkbox agreeing to the terms and privacy policy (both linked), «Створити акаунт» → verification screen. Note under the button: a confirmation email will be sent; uploading needs a confirmed email. No password repeat field.
- Errors: empty email, malformed email, empty password, password under 8 characters (sign up only), terms not accepted.
- No Google button yet; adding it later must not need a layout rework.

## Password reset

Same layout as sign in. Steps:

- `request`: «Відновлення пароля», email, «Надіслати посилання», back to sign in.
- `sent`: «Перевірте пошту»; the text does not reveal whether the account exists; the link is valid for 1 hour; hint about spam and changing the email; resend button with a 60-second countdown.
- `new`: «Новий пароль» for the account email, new password and repeat (at least 8 characters), «Зберегти пароль».
- `done`: «Пароль змінено», the user is already signed in, «До бібліотеки».
- `expired`: «Посилання застаріло», the link is valid for 1 hour and works once, «Надіслати нове посилання».
- Errors: empty or malformed email, empty or short password, empty repeat, «Паролі не збігаються.».

## Email verification

- `sent`: «Підтвердіть email», the link is valid for 24 hours; info box: until confirmed, the user can read and browse the library but not upload; spam hint with a link to change the email; resend with a 60-second countdown; «Поки що перейти до бібліотеки →».
- `done`: «Email підтверджено», uploading is now possible, «До бібліотеки».
- `expired`: «Посилання застаріло» (valid 24 hours, works once), «Надіслати нове посилання», «Уже підтвердили з іншого пристрою? Увійдіть.».

## Account menu

Popover (280 px): «Ви увійшли як» + email, storage «N МБ з 500 МБ» with a bar, language row on phone, «Вийти з облікового запису», «Видалити акаунт» in `danger`. Closes on outside click or Esc.

## Account deletion

- `confirm`: back to library, «Видалити акаунт», list of what is removed (books and EPUB files with their total size, notes, highlights and comments, bookmarks and reading progress on every device), a suggestion to export notes to Markdown first, a password field and a required checkbox «Я розумію, що видалення остаточне і його не можна скасувати.», buttons «Видалити акаунт назавжди» (`danger`) and «Скасувати».
- Errors: empty password, checkbox not ticked, wrong password banner with a link to password reset.
- `done`: «Акаунт видалено», a confirmation email was sent, «На головну». Deletion is immediate; there is no grace period.

## Library

- Header with search («Назва або автор»; on phone it gets its own full-width row), language, theme, account menu.
- Title «Моя бібліотека» with a plural-aware count, storage meter «N МБ з 500 МБ» (tooltip with percent and free space on desktop), «Додати книжку» (file input accepting `.epub`; full width on phone).
- Filter chips with counts: «Усі», «Не прочитані», «Читаю», «Прочитані» (scroll sideways on phone). Sort: «Нещодавно відкриті» (default), «Нещодавно додані», «Назва А–Я», «Автор А–Я» (by surname).
- Grid of cards (min column 176 / 160 / 140 px): 2:3 cover, title, author or «Автор невідомий», status dot and label, progress bar and percent only while reading, a ⋯ menu with download EPUB and delete (delete uses the same confirmation as the book page).
- Covers: the EPUB's cover image; a generated cloth cover (title and author on a colored cloth) when the EPUB has none.
- Upload:
  - Drag a file anywhere: full-page overlay (`drop-bg`, dashed border) «Відпустіть, щоб додати книжку», «EPUB без DRM · до 50 МБ · одна книжка за раз».
  - Progress: a placeholder card first in the grid with percent, file name, «Завантаження…» and a cancel button.
  - Done: the book appears first with the `new-ring`; toast «Книжку «{title}» додано» with «Відкрити».
  - Duplicate: the duplicate dialog below.
  - Errors in a banner above the grid, with a close button.

### Upload errors

One set, used on both the library and the empty library:

| Error         | Title                     | Text (shortened)                                                                      |
| ------------- | ------------------------- | ------------------------------------------------------------------------------------- |
| Not EPUB      | «Цей файл не підходить.»  | «{file}» is not an EPUB; only DRM-free .epub files can be uploaded                    |
| Too large     | «Файл завеликий.»         | «{file}» is {n} MB, the limit is 50 MB per file                                       |
| Quota         | «Не вистачає місця.»      | the book takes {n} MB, only {free} MB of 500 MB is free; delete something first       |
| Several files | «По одній книжці за раз.» | drop just one .epub file                                                              |
| Damaged       | «Файл пошкоджений.»       | «{file}» could not be opened, it looks incomplete; try another file                   |
| DRM           | «Книжка захищена DRM.»    | «{file}» is copy-protected; upload a DRM-free version from a store or the publisher   |

## Empty library

Header without search. Shelf illustration (three dashed ghost books and one `book-cloth` book), «Полиця поки порожня», «Додайте першу книжку — і вона буде з вами на кожному пристрої.», a dashed drop zone («Перетягніть файл сюди або оберіть на пристрої»; on phone «Натисніть, щоб обрати EPUB»), hint «Лише EPUB без DRM · до 50 МБ · одна книжка за раз», «Використано 0 МБ з 500 МБ». An error turns the drop zone border `err` and shows the error box under it.

## Duplicate dialog

Small cover, «Ця книжка вже є у бібліотеці», text naming the file, the matching book and the date it was added, «Завантажити ще одну копію?». Buttons «Скасувати» (does not upload) and «Усе одно завантажити» (continues the upload). Desktop: centered card up to 520 px. Phone: bottom sheet with the primary button first.

## Book page

- Header: logo, «‹ Бібліотека», language, theme, account menu.
- Side column (300 px on desktop; on tablet and phone the cover sits beside the controls): large cover; «Продовжити · N%» to the last reading position; «Статус» select (Не прочитано / Читаю / Прочитано, set by hand); «Прогрес» with a bar; «EPUB» download; «Видалити» in `danger`.
- Delete book: an inline `alertdialog` under the buttons, «Видалити «{title}»?», says the EPUB file, N annotations, comments and reading progress are deleted immediately and permanently and that notes can be exported to .md first; «Скасувати» / «Видалити»; then back to the library, no undo.
- Summary: author, title, the summary in `prose` with a caption naming its source. No summary: a dashed box «У файлі немає опису» with an explanation and no action.
- Annotations: heading with «{shown} з {total}», «Експорт у .md», color filter chips «Усі» / «Рожевий» / «Зелений» / «Помаранчевий» / «Жовтий». Card: color dot, type name, «стор. ~N» link to the reader, short date (tooltip with full date and time), the quote as a highlight, «Змінити тип» (menu of the four types), delete with inline confirm and undo. One comment per annotation: «+ Додати коментар» or the comment with «Редагувати»; saving it empty removes it («Порожній коментар буде видалено»). With more than 3 cards the list scrolls inside, with «Ще {n} — прокрутіть список».
- «Мої коментарі до книжки»: the Markdown editor, placeholder «Що думаєте про книжку?», «Зберегти». Limit 5000 characters; a counter «n / 5000» appears above 4500. Errors: «Напишіть хоча б кілька слів, щоб зберегти коментар.», «Задовгий коментар — до 5000 символів.». New comments go on top; each has «Редагувати» / «Видалити»; an edited one shows «· змінено»; delete with inline confirm and undo.

### Markdown editor

One component for book comments and annotation comments, for new and edited text: toolbar «Ж» (bold), «К» (italic), list, quote, link; each wraps the selection in Markdown. Ctrl/Cmd + Enter saves, Esc cancels. Saved text renders as Markdown.

### Markdown export

File `<title-slug>-notes.md`: `# Title`, `_Author_`, `## Анотації` grouped by type (`### Рожевий — думка, цитата`), each quote with `— стор. ~N · date` and its comment, then `## Мої коментарі до книжки`. It exports all annotations, whatever the filter. Toast «Файл {file} завантажено»; if the download fails, it copies to the clipboard and says so.

## Reader

- Top bar: back to the book page, title and chapter, «Aa», light/dark toggle, panel button.
- Text column; in page mode a row with «Назад», «N з M», «Далі». Footer: percent and a 4 px progress bar.
- Opens at the last reading position with a dismissable banner «Продовжуємо з місця, де ви зупинились.». Bookmarks do not change where the book opens.
- Panel: on desktop a 340 px side panel (open state remembered), on tablet and phone a bottom sheet. Tabs «Зміст» (chapters with annotation and bookmark counts and start page; current chapter highlighted), «Анотації · N», «Закладки · N».
- «Aa» settings, saved in the account:
  - Text size 10–26 px in steps of 2, default 16.
  - Mode «Сторінки» / «Прокрутка».
  - Font Literata / Onest.
  - Spacing «Щільно» 1.55 / «Звично» 1.75 / «Просторо» 1.95.
  - Column width «Вузька» 560 / «Звична» 640 / «Широка» 760 px (desktop only).
  - Page «Світла» / «Сепія» / «Темна».
  - Interface language.
  - «Скинути налаштування».
- Selection toolbar (pill, above the selection): four color dots, «Коментар», bookmark toggle, remove (only on an existing highlight). A selection needs at least 2 characters, stays within one paragraph, and replaces highlights it overlaps. Clicking a highlight opens the same toolbar with the current color marked.
- Annotation comment: «Коментар до виділеного», the Markdown editor, placeholder «Що ви про це думаєте?».
- Bookmarks: toast «Закладку додано» / «Закладку прибрано» (3.5 s), a ribbon in the margin, a list with chapter, «стор. ~N», date and a snippet; clicking jumps there and flashes the paragraph (`flash`); delete with confirm, no undo. Empty state explains how to add one.
- Navigation in page mode: ← → PageUp PageDown Space, and horizontal swipe. No search inside the book in v1.

### End of book

When the reader reaches the end, the status becomes `read` and a card opens (centered up to 460 px; bottom sheet on phone): a check icon in a `tint` circle, «Ви дочитали книжку», title, author, page count and annotation count, a status row with a toggle («Скасувати» returns to reading, «Позначити прочитаною» sets it again), buttons «До сторінки книги» and «Залишитися тут». It also opens on «Далі» at the last page. It closes on Esc and keeps focus inside while open. The threshold for "the end" comes from `CLAUDE.md`, not the prototype.

## Terms and privacy

One screen with a tab switch «Умови користування» / «Конфіденційність», a summary box at the top, sections (8 for terms, 7 for privacy), «Оновлено {date}», reading time, a closing card pointing to the contacts. Desktop: a 240 px sticky contents sidebar; tablet and phone: contents as an inline box. The text is a draft.

## Design gaps

The design has no screens for these. Build them from the patterns above:

- Search with no results in the library.
- Summary caption for Open Library and Google Books (the design only has «Опис з метаданих EPUB»). The no-summary box appears only when every source gave nothing, so its text must not say the summary comes only from EPUB metadata.
- The library card ⋯ menu (items: download EPUB, delete).
