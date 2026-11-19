# Fonts

Literata and Onest, served from these files through `next/font/local` (`src/shared/ui/fonts/index.ts`), so the build needs no internet and the versions are fixed. Both are under the SIL Open Font License 1.1 (`OFL.txt` next to each font), which allows changing and redistributing them; neither declares a Reserved Font Name.

| File                             | Axes                        |
| -------------------------------- | --------------------------- |
| `literata/Literata.woff2`        | `opsz` 7–72, `wght` 400–700 |
| `literata/Literata-Italic.woff2` | `opsz` 7–72, `wght` 400–600 |
| `onest/Onest.woff2`              | `wght` 400–600              |

The axes match the design. Each file keeps the Latin and Cyrillic glyphs (Google Fonts' `latin` and `cyrillic` subsets, Ukrainian included) in one file, because `next/font/local` cannot split a family by `unicode-range`.

## How they were made

Source: the variable TTFs in [google/fonts](https://github.com/google/fonts) at commit `cc5661d43cd4f9aad5567033a8e15ca28dc35c86` (`ofl/literata`, `ofl/onest`). Tools: `fonttools` 4.62.1 and `brotli` from pip, in a virtual environment outside the repository.

```bash
U="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116"

fonttools varLib.instancer "Literata[opsz,wght].ttf" wght=400:700 -o lit.ttf
fonttools varLib.instancer "Literata-Italic[opsz,wght].ttf" wght=400:600 -o lit-i.ttf
fonttools varLib.instancer "Onest[wght].ttf" wght=400:600 -o one.ttf

fonttools subset lit.ttf --unicodes="$U" --layout-features='*' --flavor=woff2 --output-file=Literata.woff2
fonttools subset lit-i.ttf --unicodes="$U" --layout-features='*' --flavor=woff2 --output-file=Literata-Italic.woff2
fonttools subset one.ttf --unicodes="$U" --layout-features='*' --flavor=woff2 --output-file=Onest.woff2
```
