# Handover: Sagamapu — steps to finalize

## Context

App: "Pathway to B1" English tutor (React + Babel Standalone, no build step).
Repo: `fablefactor/sagamapu` (renamed from `fablefactor/test`).
Feature branch: `claude/english-tutor-artifact-fvk23e`.
Deploy target: Netlify at `https://sagamapu.netlify.app`.

All code is done and on the feature branch. What remains is configuration + wiring.

---

## Git state note

The remote branch tip is ahead of local by one commit (CLAUDE.md was pushed
via GitHub MCP after the git proxy died during the repo rename). On session
start, run:

```
git fetch origin claude/english-tutor-artifact-fvk23e
git reset --hard origin/claude/english-tutor-artifact-fvk23e
```

---

## Step 1 — Create Supabase project (user does this manually)

1. Go to https://supabase.com → New project (call it `sagamapu`)
2. In the SQL editor run:

```sql
create table user_progress (
  user_id uuid primary key references auth.users,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);
alter table user_progress enable row level security;
create policy "own_data" on user_progress for all
  using (auth.uid() = user_id);
```

3. From Project Settings → API, copy:
   - **Project URL** (`SUPABASE_URL`)
   - **anon / public key** (`SUPABASE_ANON_KEY`)

---

## Step 2 — Fill in credentials in index.html (Claude does this)

Near the top of `index.html`, replace the two placeholder constants:

```js
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

with the real values from Step 1. Then verify JSX and push to the feature branch.

JSX check command:
```
node -e "
const b=require('@babel/core');
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8').match(/<script type=\"text\/babel\">([\s\S]*)<\/script>/)[1];
b.transformSync(src,{presets:['@babel/preset-react']});
console.log('JSX ok');
"
```

---

## Step 3 — Connect Netlify (user does this manually)

1. Go to https://app.netlify.com → Add new site → Import from Git → GitHub
2. Choose `fablefactor/sagamapu`
3. Settings:
   - Branch: `master`
   - Publish directory: `.` (repo root)
   - Build command: *(leave blank)*
4. Under Site settings → General → Site name: set to `sagamapu`
5. Note the live URL: `https://sagamapu.netlify.app`

---

## Step 4 — Add Netlify URL to Supabase redirect allowlist (user does this manually)

In Supabase → Authentication → URL Configuration:
- **Site URL**: `https://sagamapu.netlify.app`
- **Redirect URLs**: add `https://sagamapu.netlify.app`

This is required for magic-link login to work after email click.

---

## Step 5 — Merge feature branch to master (go live)

Once Steps 1–4 are done and the app is verified working on the feature branch:

```
git checkout master
git merge claude/english-tutor-artifact-fvk23e
git push -u origin master
```

Netlify auto-deploys on push to `master`.

---

## What's already done

- Full Supabase auth (magic link email, no password)
- Per-user cloud sync via `user_progress` JSONB table with RLS
- Debounced sync (1500 ms) + immediate sync on tab hide and sign-out
- App only mounts after `restoreFromSupabase` completes (AppShell pattern)
- Graceful fallback to localStorage-only when `sbClient` is null
- Sign-out button in Settings screen
- Simplification pass: shared `QuizOption`/`QuizFeedback` components, module-level constants, `dueMap`/`masteryMap` computed once
- CLAUDE.md updated with all project gotchas
