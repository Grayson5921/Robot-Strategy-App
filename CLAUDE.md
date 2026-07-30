# CLAUDE.md — Robot Strategy App

Context for Claude Code sessions on this repo. Read `PROJECT_HANDOFF.md` for full detail.

## What this is

A real-time collaborative FRC robot strategy worksheet for **team 6369 Mercenary Robotics**
(sibling team 6773). Replaces a 9-tab Google Sheet. Used by high-school students during
build season. Live at **https://www.robot-strategy-app.com**.

Owner: Grayson, student on 6369.

## Stack

- **One file**: `index.html` at repo root (~107 KB, vanilla JS, no build step, no framework)
- **Backend**: Supabase (Postgres + Realtime), accessed via CDN UMD bundle
- **Host**: Vercel, auto-deploys on push to `main` (~30 s)
- `vercel.json` rewrites all routes to `/index.html`

## Critical constraints

- **No build step.** Do not introduce npm, bundlers, or frameworks without asking first.
  The owner deploys by pasting file contents into the GitHub web editor.
- **Files over ~75 KB fail GitHub drag-and-drop upload.** Use the web editor's paste flow,
  or `git push`. Keep this in mind before splitting or growing files.
- **No `localStorage` / `sessionStorage`** in this codebase — all state is Supabase or in-memory.
- Supabase JS must load from **unpkg**, not jsdelivr. jsdelivr caused `TypeError: Load failed`
  on iOS Safari. Do not change this back.

## Architecture in one paragraph

`index.html` holds all CSS, HTML, and JS. On load it shows a login screen (guest or admin).
After login, a sheet picker lists all sheets from the `sheets` table. Opening a sheet loads its
8 sections from `sheet_data` into the global `D` object, then calls per-section render functions
that build DOM imperatively via `el()` / `inp()` / `txt()` / `sel()` helpers. Edits mutate `D`
in place and call `changed(section)`, which debounces 900 ms then upserts that section's JSON
blob. A Supabase Realtime channel listens for `UPDATE` on `sheet_data` and re-renders the
changed section for other viewers.

## Data model

Two tables. `sheets` (id, name, created_by, created_at, password_hash, is_protected) and
`sheet_data` (id, sheet_id FK cascade, section, data jsonb, updated_at, UNIQUE(sheet_id, section)).
RLS is fully public — `using (true)` on every policy — because there is no Supabase Auth.

Section keys: `plan`, `wg`, `gr`, `cpm`, `strat`, `specs`, `proto`, `eval`.
Each is one jsonb row. Shapes are defined in `defaultSection(sec)`.

## Auth (client-side only — see security note)

- Admin password: `Mercs6369`, stored as `ADMIN_PW_HASH = hashPw('Mercs6369')`
- `hashPw()` is a 32-bit string hash, **not** cryptographic
- Admin: create / rename / delete sheets, edit everything, bypass sheet passwords
- Guest: view all sheets, edit unprotected ones, password-prompt on protected ones

## Conventions to preserve

- **Save on blur or Enter, never on `oninput`.** Per-keystroke saves caused re-renders that
  stole focus mid-typing. `inp()` and `txt()` use `addEventListener('blur', ...)`.
- **Every render function starts with a null guard**: `const c=document.getElementById('x-body');
  if(!c)return;` — sections render before their tab is visible.
- **`renderSection` is wrapped in try/catch** so one broken section can't blank the app.
- **Textareas must wrap, not scroll sideways**: `overflow-x:hidden; word-wrap:break-word;
  white-space:pre-wrap; resize:vertical`.
- The field simulator lives in a trailing IIFE with `sim`-prefixed IDs and `s`-prefixed vars
  to avoid collisions. It wraps `window.showTab` to lazy-init the canvas.
- Colors come from CSS custom properties on `:root`. Don't hardcode hex values in new code.

## Known issues (unfixed, low priority)

1. `defaultSection('eval')` uses keys `c1,c2,c3` but `renderEval` generates `c0,c1,c2...`
   from concept index. Default values in `c1..c3` are orphaned; `c0` is created empty.
2. `defaultSection('cpm')` returns flat fields (`scenario`, `cycles`, ...) but `renderCPM`
   only reads `cpm.setups[]`, which it lazily creates. The flat fields are dead data.
3. Field simulator state (image, waypoints, path, physics inputs) is **not persisted** to
   Supabase. It resets on reload. This is the single most requested missing feature.
4. Supabase free tier pauses the project after ~1 week idle, producing
   `TypeError: Failed to fetch`. Not a code bug — needs a dashboard restore.

## Security note — say this plainly if asked

The Supabase anon key and the admin password hash are both in client-side source, and RLS is
fully open. Anyone who views source can read the key, and anyone can write to the tables
directly via the REST API. For a student team's internal strategy notes this is a reasonable
tradeoff, but it is **not** access control. Don't describe it as secure. If real protection is
ever needed, the fix is Supabase Auth plus RLS policies keyed on `auth.uid()`.

## Deploy

```
git add index.html && git commit -m "..." && git push
```
Vercel picks it up automatically. Hard-refresh (Ctrl+Shift+R) to clear cache when verifying.
