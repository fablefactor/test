# CLAUDE.md

## Project overview

"Pathway to B1" — a static, no-build English tutoring web app for Danish speakers learning English up to CEFR B1. Deployed to GitHub Pages at https://fablefactor.github.io/test/.

**Stack:** React 18 + Babel Standalone from CDN. No bundler, no build step — JSX is compiled at runtime in the browser.

**Files:**
- `index.html` — the entire app: all React components, CSS, and hooks in one file (~960 lines).
- `curriculum.js` — pure data: 18 topics (6 each for A1, A2, B1), loaded via `<script src>` before the Babel block.

**Deployment:** GitHub Pages serves `master` branch root. Develop on a feature branch; push to `master` only when asked to "go live". Never create a PR unless explicitly requested.

**Persistence:** `localStorage` under the `ptb1:` namespace. Resetting progress clears all keys *except* `ptb1:lang`.

---

## Non-obvious gotchas

### Babel Standalone = runtime compilation
There is no build step. Syntax errors in JSX only surface when the browser actually loads the page — you won't catch them from a linter or `node`. To verify JSX syntax before committing, run:
```
node -e "
const b=require('@babel/core');
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8').match(/<script type=\"text\/babel\">([\s\S]*)<\/script>/)[1];
b.transformSync(src,{presets:['@babel/preset-react']});
console.log('JSX ok');
"
```
This requires `@babel/core` and `@babel/preset-react` installed globally or in a local `node_modules`.

### `curriculum.js` is plain JS, not JSX
It's loaded by a regular `<script src>` tag before the Babel block, so it must be valid JavaScript only — no JSX syntax.

### Two-language mode (not three)
`lang` is either `'en'` (English immersion) or `'es'` (Spanish). In English immersion mode, translations are hidden; flashcard backs show a plain-English definition (`enDef`). In Spanish mode, all UI labels, theory text, example translations, and quiz explanations are in Spanish.

The localization helpers in `index.html` (defined just after `const FONT = ...`):
```js
const topicTitle   = (tp,lang)   => lang==='es' ? (tp.titleEs||tp.title)     : tp.title;
const theoryHeading= (sec,lang)  => lang==='es' ? (sec.headingEs||sec.heading): sec.heading;
const theoryBody   = (sec,lang)  => lang==='es' ? (sec.bodyEs||sec.body)      : sec.body;
const exTranslation= (ex,lang)   => lang==='es' ? (ex.es||'')                 : '';
const cardBack     = (card,lang) => lang==='es' ? (card.es||card.enDef||'')   : (card.enDef||card.es||'');
const cardBackLabel= (lang)      => lang==='es' ? 'Español'                   : 'Definition';
const quizExplain  = (q,lang)    => lang==='es' ? (q.explainEs||q.explain)    : q.explain;
const UI           = (lang,en,es)=> lang==='es' ? es                          : en;
```
Note the `UI` helper argument order: `UI(lang, englishString, spanishString)`.

### Curriculum data schema
Each topic object has:
- `titleEs` — Spanish topic title
- `theory[]` — each entry has `heading`, `headingEs`, `body`, `bodyEs`
- `examples[]` — each entry has `en`, `es` (no Danish `da` — that field was removed)
- `flashcards[]` — each entry has `front`, `es` (Spanish translation), `enDef` (plain-English definition). There is no `back` field.
- `quiz[]` — each entry has `explain`, `explainEs`

### Writing large files (curriculum.js is ~1700 lines)
A single `Write` call for a very large file can silently fail. Use a chunked sentinel pattern:

1. **`Write`** the first portion, ending with:
   ```
   //__APPEND_HERE__
   };
   ```
2. **`Edit`** to replace the sentinel block with the next chunk + same sentinel:
   ```
   old_string: "//__APPEND_HERE__\n};"
   new_string: "<next chunk>\n//__APPEND_HERE__\n};"
   ```
3. Repeat for each chunk (~3 topics per chunk works well). Final `Edit` drops the sentinel.

After a context compaction, `Write` may require a fresh `Read` first — read a few lines to satisfy the harness before writing.

### `lang` is passed as a prop, not a context
Every screen component receives `lang` (and `setLang` where needed) as an explicit prop. There is no React context. If you add a new screen, thread `lang` through manually.

### Web Speech API
`SpeechRecognition` and `SpeechSynthesis` are browser-only APIs. The app gracefully hides pronunciation features when unavailable, but don't try to test or mock them in Node.
