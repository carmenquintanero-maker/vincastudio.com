# Spanish version (/es/)

The pages in `es/` are generated from the English pages. Don't edit them by hand.

- `es.json` — English text → Spanish translation. Edit translations here.
- `i18n-build.mjs` — builds `es/` from the English pages + `es.json`, and adds the EN/ES switch and hreflang tags to both languages. Whole-heading word-order fixes and Spanish-only CSS tweaks live at the top of this file.
- `i18n-extract.mjs` — lists every translatable string in the English pages (writes `strings.json`).
- `i18n-check.mjs` — flags leftover English or broken relative paths in `es/` pages.

After changing English copy:

    node i18n/i18n-extract.mjs . i18n/strings.json   # find new strings, add them to es.json
    node i18n/i18n-build.mjs .                       # rebuild es/ (lists any untranslated text)
    node i18n/i18n-check.mjs es/*.html es/proyectos/*.html

New pages also need entries in `pages` inside `i18n-build.mjs`, a rewrite + .html redirect in `vercel.json`, and the sitemap.

Legal pages (`legal-notice.html`, `privacy.html`, `cookies.html` and their `es/` versions) are written by hand in both languages — the Spanish text is the legally binding one, so it is not machine-mapped from English. They are listed in `manualPages` in `i18n-build.mjs`, which only adds hreflang + the language switch and makes footer links point at the right language. Edit both versions when the legal text changes.
