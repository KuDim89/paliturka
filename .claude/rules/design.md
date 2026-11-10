---
paths:
  - "app/**/*"
  - "src/**/*"
---

# Design system

## Source and precedence

- The design is the private Design artifact https://claude.ai/artifact/8UECDkUdg6bzWs2ZWCyrot: page `Палітурка` (all screens), `Лого` (logo) and `Токени` (tokens). Read it with the Artifact tool when a detail is not written here.
- The prototypes are a visual reference and the source of UI copy. They are not code to copy: their localStorage state, sample books, demo props and unwired buttons are not the spec.
- Product rules in `CLAUDE.md` win over prototype behaviour. Screens and their behaviour are in `.claude/rules/design-screens.md`.

## Tokens

- Every token is a CSS variable `--pl-<name>`. Light values go on `:root`, dark values under the dark theme.
- shadcn/ui variables point at the tokens, for example `--background: var(--pl-bg)`, `--card: var(--pl-surface)`, `--foreground: var(--pl-ink)`, `--primary: var(--pl-accent)`, `--primary-foreground: var(--pl-on-accent)`, `--border: var(--pl-line)`, `--input: var(--pl-line2)`, `--destructive: var(--pl-danger)`.
- Components use tokens only, never raw colors. Each token has one value per theme; a new screen reuses existing tokens instead of adding near-duplicates.

### Surfaces and text

| Token       | Light     | Dark      | Use                                              |
| ----------- | --------- | --------- | ------------------------------------------------ |
| `bg`        | `#F3EEE4` | `#151816` | Page background                                  |
| `surface`   | `#FBF8F2` | `#1E2220` | Cards, inputs, menus, panels                     |
| `pop`       | `#FFFFFF` | `#262A27` | Reader popovers: selection toolbar, Aa panel     |
| `ink`       | `#1E211F` | `#ECE6DA` | Main text and headings                           |
| `body`      | `#4F534D` | `#C3BDB0` | Secondary text, descriptions                     |
| `prose`     | `#33372F` | `#D6D0C3` | Long text: book summary, comments                |
| `muted`     | `#5A5E58` | `#A39F95` | Captions, metadata, placeholders                 |
| `line`      | `#DCD3C2` | `#343935` | Dividers, card borders                           |
| `line2`     | `#CFC5B3` | `#454B46` | Input and secondary button borders               |
| `card-line` | `#E2D9C8` | `#2C312D` | Thin lines inside annotation cards               |
| `track`     | `#E8E0D1` | `#2C312D` | Progress tracks, segmented control background    |
| `tab-on`    | `#FBF8F2` | `#3A403B` | Active segment of a segmented control            |
| `dash`      | `#A39F95` | `#5A5F59` | Dashed outlines of the empty shelf and drop zone |

### Accent

| Token             | Light                  | Dark                     | Use                                                   |
| ----------------- | ---------------------- | ------------------------ | ----------------------------------------------------- |
| `accent`          | `#2E4B3C`              | `#8FBC9F`                | Primary buttons, active states                        |
| `on-accent`       | `#F3EEE4`              | `#12201A`                | Text on accent                                        |
| `link`            | `#2E4B3C`              | `#9CC7AB`                | Links, text buttons                                   |
| `tint`            | `rgba(46,75,60,0.10)`  | `rgba(143,188,159,0.16)` | Icon circles, current item highlight                  |
| `focus-ring`      | `rgba(46,75,60,0.14)`  | `rgba(156,199,171,0.22)` | Input focus ring                                      |
| `chip-on`         | `#1E211F`              | `#ECE6DA`                | Active filter chip                                    |
| `chip-on-text`    | `#F3EEE4`              | `#151816`                | Text of the active chip                               |
| `chip-all`        | `#E8E0D1`              | `#2C312D`                | Background of the "All" chip in annotations           |
| `chip-all-border` | `#1E211F`              | `#ECE6DA`                | Border of the active "All" chip                       |
| `flash`           | `rgba(46,75,60,0.22)`  | `rgba(143,188,159,0.35)` | Short paragraph flash after jumping to a bookmark     |
| `new-ring`        | `#2E4B3C`              | `#9CC7AB`                | Ring around a just-added book (3 px bg + 2 px color)  |

### States

| Token       | Light                  | Dark                     | Use                              |
| ----------- | ---------------------- | ------------------------ | -------------------------------- |
| `err`       | `#B3261E`              | `#F2A39B`                | Error text and border            |
| `err-bg`    | `rgba(179,38,30,0.07)` | `rgba(242,163,155,0.10)` | Error banner background          |
| `err-line`  | `rgba(179,38,30,0.25)` | `rgba(242,163,155,0.35)` | Error banner border              |
| `err-ring`  | `rgba(179,38,30,0.14)` | `rgba(242,163,155,0.22)` | Ring around an invalid input     |
| `danger`    | `#9A2F2A`              | `#E58A80`                | Destructive actions ("Delete")   |
| `on-danger` | `#FBF8F2`              | `#1E1514`                | Text on danger                   |
| `danger-bg` | `rgba(154,47,42,0.08)` | `rgba(229,138,128,0.12)` | Delete confirmation background   |
| `warn`      | `#B4561A`              | `#E88A3C`                | Expired link, warnings           |
| `warn-bg`   | `rgba(208,106,31,0.13)`| `rgba(232,138,60,0.16)`  | Warning icon background          |

### Annotations

`hl-*` is the highlight background in the text, `dot-*` the color marker. They map to the standard annotation types in `CLAUDE.md`.

| Token        | Light     | Dark                       | Use                              |
| ------------ | --------- | -------------------------- | -------------------------------- |
| `hl-pink`    | `#F6CAD6` | `rgba(232,120,155,0.32)`   | Thoughts, quotes                 |
| `hl-green`   | `#CFE5C6` | `rgba(110,190,125,0.30)`   | New ideas                        |
| `hl-orange`  | `#F8D0A6` | `rgba(240,150,80,0.32)`    | Questions, unclear points        |
| `hl-yellow`  | `#F5E28C` | `rgba(240,210,90,0.28)`    | Reread, important                |
| `dot-pink`   | `#C8476C` | `#E0708F`                  | Pink marker                      |
| `dot-green`  | `#3F8A4E` | `#5FAF6E`                  | Green marker                     |
| `dot-orange` | `#D06A1F` | `#E88A3C`                  | Orange marker                    |
| `dot-yellow` | `#B8930F` | `#E3C431`                  | Yellow marker                    |
| `select`     | `#CFE0F3` | `rgba(120,170,220,0.30)`   | Selected text not saved yet      |

### Book statuses

| Token            | Light     | Dark      | Use     |
| ---------------- | --------- | --------- | ------- |
| `status-unread`  | `#A39F95` | `#7E7A72` | Unread  |
| `status-reading` | `#D06A1F` | `#E88A3C` | Reading |
| `status-read`    | `#3F8A4E` | `#5FAF6E` | Read    |

### Brand and decor

| Token         | Light                    | Dark                    | Use                                                  |
| ------------- | ------------------------ | ----------------------- | ---------------------------------------------------- |
| `band`        | `#2E4B3C`                | `#1F3A2E`               | Green "cover": sign-in side panel, landing band      |
| `band-text`   | `#F3EEE4`                | `#ECE6DA`               | Text on band                                         |
| `band-muted`  | `#C9D6CC`                | `#A9C2B1`               | Secondary text on band                               |
| `gold`        | `#D8BC7A`                | `#D8BC7A`               | Embossing: lines on band, avatar                     |
| `shelf`       | `#C9BBA3`                | `#4A433A`               | Bookshelf                                            |
| `logo-cover`  | `#2E4B3C`                | `#3B6650`               | Logo: cover                                          |
| `logo-ribbon` | `#B8964F`                | `#EBC66A`               | Logo: ribbon                                         |
| `logo-frame`  | `#B8964F`                | `#A9CDB5`               | Logo: frame on the cover                             |
| `logo-shade`  | `transparent`            | `rgba(0,0,0,0.18)`      | Logo: shade on the ribbon                            |
| `scrim`       | `rgba(30,33,31,0.45)`    | `rgba(0,0,0,0.60)`      | Overlay under dialogs and sheets                     |
| `book-cloth`  | `#2E4B3C`                | `#3E6B53`               | Book in the empty-shelf illustration                 |
| `drop-bg`     | `rgba(243,238,228,0.88)` | `rgba(21,24,22,0.82)`   | Overlay while dragging a file over the library       |

### Reader page

The page setting in the reader (light, sepia, dark) applies only to the book text area. The dark page uses the app's dark tokens.

| Page  | `bg`      | `surface` | `ink`     | `accent`  |
| ----- | --------- | --------- | --------- | --------- |
| Light | `#F7F2E8` | `#FBF8F2` | `#1E211F` | `#2E4B3C` |
| Sepia | `#F1E6D0` | `#F6ECDA` | `#3A2E21` | `#5B4630` |
| Dark  | `#151816` | `#1E2220` | `#ECE6DA` | `#8FBC9F` |

Sepia also overrides these tokens (values from the Reader prototype, not on the Tokens page): `pop` `#FFF8EC`, `muted` `#6E5F4C`, `line` `#DCCBAA`, `track` `#E6D8BC`, `tab-on` and `on-accent` `#FBF3E3`, `select` `#E8D9B5`, `tint` `rgba(91,70,48,0.10)`, `flash` `rgba(91,70,48,0.18)`. Sepia highlights use the light `hl-*` values.

### Decorative colors

The generated cloth covers, the landing shelf spines, the pin and the note paper use their own palettes (in the Library, Book and Main prototypes). These colors live only inside those illustration components, as named constants, and never become general tokens.

## Shadows

| Token             | Light                                                          | Dark                                                                |
| ----------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| `shadow-pop`      | `0 18px 40px -18px rgba(30,33,31,0.35)`                        | `0 18px 40px -16px rgba(0,0,0,0.75)`                                |
| `shadow-dialog`   | `0 30px 60px -20px rgba(0,0,0,0.5)`                            | `0 30px 60px -20px rgba(0,0,0,0.5)`                                 |
| `shadow-cover-sm` | `0 1px 0 rgba(0,0,0,0.08), 0 14px 26px -16px rgba(30,33,31,0.55)` | `0 1px 0 rgba(255,255,255,0.04), 0 14px 26px -14px rgba(0,0,0,0.9)` |
| `shadow-cover-lg` | `0 24px 40px -22px rgba(30,33,31,0.6)`                         | `0 24px 40px -22px rgba(0,0,0,0.9)`                                 |

`shadow-pop`: account menu, Aa panel, selection toolbar. `shadow-dialog`: dialogs and sheets. `shadow-cover-sm`: covers in the library grid. `shadow-cover-lg`: the large cover on the book page.

## Typography

Fonts: Literata and Onest from Google Fonts, with the Cyrillic subset.

| Style                | Size, px                 | Use                                               |
| -------------------- | ------------------------ | ------------------------------------------------- |
| Literata 500         | 58 / 48 / 34             | Page title (desktop / tablet / phone)             |
| Literata 500         | 30 / 24                  | Section heading                                   |
| Literata 400         | 18–19                    | Book text, quotes, summary                        |
| Literata 600 italic  | 22                       | Wordmark `paliturka`                              |
| Onest 500            | 15–17                    | Buttons, navigation                               |
| Onest 400            | 16                       | Main interface text, inputs                       |
| Onest 400            | 13–14                    | Captions, metadata, errors                        |
| Onest 600 caps       | 12–13                    | Eyebrows, group names, tracking 0.08–0.14em       |

Headings use letter-spacing −0.02em.

## Radii

`--pl-radius-pill` 999 (buttons, chips, segmented controls), `sheet` 22 (bottom sheets on phone), `dialog` 18, `menu` 16 (menus, cards, popovers), `banner` 12–14 (status and error banners), `field` 10 (inputs, menu items).

## Sizes

- Primary button 52 px high; inputs and dialog buttons 48; icon buttons 44 (the minimum touch target); buttons in the selection toolbar and Aa panel 40.
- Side gutters: 16 px on phone, 24 px on tablet and desktop. Content max width 1280 px.

## Layout

- Breakpoints: phone below 640 px, tablet 640–1023 px, desktop from 1024 px.
- On phone, dialogs become bottom sheets: 22 px top corners, a grab handle, the `scrim` overlay, primary button first.
- On phone, the language switch moves into the account menu (app screens) or the settings panel (landing).

## Motion

- Switching the theme plays a circular reveal; switching the language cross-fades.
- Bottom sheet 280 ms, reader side panel and page slide 320 ms, Aa popover 200 ms, account menu 240 ms open / 180 ms close.
- With `prefers-reduced-motion`, these animations are turned off.

## Logo

- Mark `Закладка`: a book cover (rounded rectangle) with a thin inner frame and a bookmark ribbon with a V-notch over the top and bottom edges, on a 64×64 viewBox.
- Wordmark `paliturka`: lowercase, Literata italic 600, letter-spacing −0.01em.
- Colors come from the `logo-*` tokens. In dark theme the mark adds a 3 px outline in the background color and the `logo-shade` on the ribbon.
- Sizes: 30 px mark and 22 px wordmark in app headers; the footer shows the wordmark only, at 20 px. Only light and dark variants exist.
