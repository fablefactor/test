# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project overview

A static, no-build, **no-AI** English tutoring web app ("Pathway to B1") deployed
to GitHub Pages at https://fablefactor.github.io/test/.

- **Stack:** React 18 + Babel Standalone loaded from CDN. No build step, no bundler.
  Everything runs directly in the browser by opening `index.html`.
- **Files:**
  - `index.html` — the entire app (all React components, CSS, hooks) in one file.
  - `curriculum.js` — curriculum data only (18 topics across CEFR A1/A2/B1).
- **Deployment:** GitHub Pages serves from the `master` branch root. Push to
  `master` to go live. Active development happens on a feature branch first.
- **Persistence:** browser `localStorage` under the `ptb1:` namespace.

## Key features

- Placement test, Leitner spaced-repetition flashcards, lesson flow
  (theory → examples → quiz), pronunciation practice (Web Speech API),
  weak-point drilling, XP, daily streaks, settings/reset screen.
- **Tutor language selector** (Settings): English or Spanish.
  - Each curriculum entry carries Spanish fields: `titleEs`, theory `headingEs`/`bodyEs`,
    examples `es`, flashcards `es` + `enDef`, quiz `explainEs`.
  - **Spanish mode:** show Spanish translations/explanations.
  - **English immersion mode:** hide example translations; flashcard backs show the
    plain-English definition (`enDef`) instead of a translation.
  - Stored as `ptb1:lang`; preserved across "reset all progress".

## Writing large files efficiently (IMPORTANT)

Writing a very large file (e.g. `curriculum.js`, ~hundreds of lines) in a **single**
`Write` call can silently fail / hit per-call output limits. Use this chunked pattern:

1. **First chunk — `Write`:** write the opening portion of the file and end it with a
   unique sentinel placeholder on its own line, just before the closing syntax, e.g.:
   ```
   //__APPEND_HERE__
   };
   ```
2. **Middle chunks — `Edit`:** replace the sentinel block with new content followed by
   the **same** sentinel again:
   ```
   old_string: "//__APPEND_HERE__\n};"
   new_string: "<next chunk of entries>\n//__APPEND_HERE__\n};"
   ```
   Repeat once per chunk. Keep each chunk to roughly 2–3 logical units (e.g. 3 topics).
3. **Final chunk — `Edit`:** replace the sentinel block with the last content and the
   real closing syntax only (drop the sentinel).

Notes:
- After a context summary/compaction, the harness may require a fresh `Read` of the
  file before the first `Write` — read a few lines first if `Write` reports
  "File has not been read yet".
- The "View PR" button in the Claude Code web/app UI is just a convenience shown for
  branches with pushed commits. It does **not** mean a PR was created. Only create a
  PR when the user explicitly asks.

## Git workflow

- Develop on the feature branch, commit with clear messages, then merge/push to
  `master` only when the user asks to "go live".
- Do not create pull requests unless explicitly requested.
