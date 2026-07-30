# Robot Strategy App — Full Project Handoff

Complete technical reference for the FRC 6369 robot strategy web app. Written to be dropped
into a repo alongside `CLAUDE.md` so a fresh Claude Code session has full context.

Last updated: July 2026

---

## 1. Project overview

### Purpose

Team 6369 "Mercenary Robotics" (with sibling team 6773) ran their kickoff strategy process out
of a 9-tab Google Sheet. This app replaces that sheet with a purpose-built web tool that adds
real-time collaboration, structured inputs, and a physics-based field path simulator that the
spreadsheet could never do.

It's used live during build season by high-school students, so the priorities are: works on
phones, no login friction, never loses data, and never breaks in a way a student can't recover
from.

### Original spreadsheet tabs → app tabs

| Original sheet tab | App tab | Section key |
|---|---|---|
| README | README (static) | — |
| THE_PLAN | The Plan | `plan` |
| WORK_GROUPS | Work Groups | `wg` |
| GAME_RULES | Game Rules | `gr` |
| CPM_ANALYSIS | CPM | `cpm` |
| STRAT_ANALYSIS | Strategy | `strat` |
| ROBOT_SPECS | Robot Specs | `specs` |
| PROTOTYPE_TASKS | Prototype | `proto` |
| EVALUATE_CONCEPTS | Eval Concepts | `eval` |

---

## 2. Deployment

### Live URLs

- `https://www.robot-strategy-app.com` (primary)
- `https://robot-strategy-app.com`
- `https://robot-strategy-app.vercel.app`

### Repo

`Grayson5921/Robot-Strategy-App` — two files at root:

```
index.html      ~107 KB, the entire application
vercel.json     SPA rewrite config
```

`vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This rewrite exists because early deploys 404'd on direct navigation. Keep it.

### Deploy workflow

The owner has historically deployed by **pasting file contents into the GitHub web editor**,
because drag-and-drop upload fails for files over roughly 75 KB and `index.html` is past that.
Vercel auto-deploys from `main` in about 30 seconds.

If moving to Claude Code, `git push` is strictly better and removes the size limit entirely.
Worth setting up early in the first session.

---

## 3. Supabase configuration

### Project

| Item | Value |
|---|---|
| Project URL | `https://qsiozultzyirdvnqazcc.supabase.co` |
| Anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzaW96dWx0enlpcmR2bnFhemNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDU4NDQsImV4cCI6MjA5MzQ4MTg0NH0.dsFX8pdYnEpNnxEHScU6SJREgS2QyCOhb3PRFGwK-Ao` |
| Client library | `https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js` |
| Owner email | `Ultima610@gmail.com` |

The client is created with a raised realtime rate limit:

```js
const sb = supabase.createClient(SB_URL, SB_KEY, {
  realtime: { params: { eventsPerSecond: 20 } }
});
```

### CDN choice matters

Originally jsdelivr. On iOS Safari that produced `TypeError: Load failed` and the app never
booted. **unpkg fixed it.** Don't revert.

### Schema

```sql
create table sheets (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  created_by    text,
  created_at    timestamptz default now(),
  password_hash text default null,
  is_protected  boolean default false
);

create table sheet_data (
  id         uuid primary key default gen_random_uuid(),
  sheet_id   uuid references sheets(id) on delete cascade,
  section    text not null,
  data       jsonb default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique(sheet_id, section)
);

-- legacy, unused since auth was removed; safe to drop
create table user_roles (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  role       text default 'member',
  granted_by text,
  created_at timestamptz default now()
);
```

The `unique(sheet_id, section)` constraint is what makes the upsert-on-conflict save path work.
Don't remove it.

`on delete cascade` means deleting a sheet wipes its data rows automatically.

### RLS

Fully public. There is no Supabase Auth in this app, so every policy is `using (true)`:

```sql
alter table sheets     enable row level security;
alter table sheet_data enable row level security;

create policy "public_read_sheets"   on sheets     for select using (true);
create policy "public_insert_sheets" on sheets     for insert with check (true);
create policy "public_update_sheets" on sheets     for update using (true);
create policy "public_delete_sheets" on sheets     for delete using (true);

create policy "public_read_data"     on sheet_data for select using (true);
create policy "public_insert_data"   on sheet_data for insert with check (true);
create policy "public_update_data"   on sheet_data for update using (true);
create policy "public_delete_data"   on sheet_data for delete using (true);
```

**A note worth being direct about:** the modern policy syntax is `to authenticated using (true)`
or `using (true)` — the older `auth.role() = 'authenticated'` form silently failed and caused a
day of debugging where sheets wouldn't load or create. If policies ever seem broken, check for
that pattern first.

### Realtime

Both tables must be in the `supabase_realtime` publication:

```sql
alter publication supabase_realtime add table sheet_data;
alter publication supabase_realtime add table sheets;
```

These are **already added**. Re-running them throws `ERROR: 42710: relation "sheet_data" is
already member of publication "supabase_realtime"`. That error is harmless but it aborts the
whole SQL script, so omit these two lines from any setup script you hand the owner.

### Full setup script (safe to re-run)

```sql
create table if not exists sheets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by text,
  created_at timestamptz default now(),
  password_hash text default null,
  is_protected boolean default false
);

create table if not exists sheet_data (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid references sheets(id) on delete cascade,
  section text not null,
  data jsonb default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique(sheet_id, section)
);

alter table sheets enable row level security;
alter table sheet_data enable row level security;

drop policy if exists "public_read_sheets"   on sheets;
drop policy if exists "public_insert_sheets" on sheets;
drop policy if exists "public_update_sheets" on sheets;
drop policy if exists "public_delete_sheets" on sheets;
drop policy if exists "public_read_data"     on sheet_data;
drop policy if exists "public_insert_data"   on sheet_data;
drop policy if exists "public_update_data"   on sheet_data;
drop policy if exists "public_delete_data"   on sheet_data;

create policy "public_read_sheets"   on sheets     for select using (true);
create policy "public_insert_sheets" on sheets     for insert with check (true);
create policy "public_update_sheets" on sheets     for update using (true);
create policy "public_delete_sheets" on sheets     for delete using (true);

create policy "public_read_data"     on sheet_data for select using (true);
create policy "public_insert_data"   on sheet_data for insert with check (true);
create policy "public_update_data"   on sheet_data for update using (true);
create policy "public_delete_data"   on sheet_data for delete using (true);

-- NOTE: do NOT add the two `alter publication supabase_realtime` lines here.
-- Both tables are already members; re-adding aborts the script with error 42710.
```

### Useful maintenance queries

Reset all sheet content so every section falls back to `defaultSection()` (keeps the sheets
themselves):

```sql
delete from sheet_data
where section in ('proto','specs','wg','plan','gr','cpm','strat','eval');
```

Reset just one section across all sheets:

```sql
delete from sheet_data where section in ('proto','specs');
```

Reset one named sheet:

```sql
delete from sheet_data
where sheet_id in (select id from sheets where name = 'Test');
```

### Free tier pausing

Supabase free projects **pause after about a week of inactivity**. Symptom in the app:
"Loading sheets..." hangs forever, and creating a sheet alerts `TypeError: Failed to fetch`
(desktop) or `TypeError: Load failed` (mobile). Fix is dashboard → project → **Restore**,
about one minute. This has happened more than once; it is not a code bug, and it's worth
checking before debugging anything else when fetches fail wholesale.

---

## 4. Application architecture

### Boot sequence

1. `<head>` loads the Supabase UMD bundle and Google Fonts (IBM Plex Mono, Barlow, Barlow Condensed)
2. All CSS lives in one `<style>` block, driven by CSS custom properties on `:root`
3. All HTML for login, picker, password modal, and all 9 tabs is inline and hidden by default
4. The trailing `<script>` defines everything, then shows the login screen
5. A second trailing IIFE contains the field simulator

### Global state

```js
let currentSheet = null;   // the sheets row currently open
let canEdit      = false;  // write permission for this sheet
let isAdmin      = false;  // admin logged in this session
let D            = {};     // all section data, keyed by section name
let saveTimers   = {};     // per-section debounce handles
let realtimeSub  = null;   // channel for the open sheet's data
let sheetsRTSub  = null;   // channel for the sheet list
let sheets       = [];     // cached sheet list
let cpmActiveTab = 0;      // which of the 10 CPM setups is showing
```

### DOM helpers

Every UI element is built imperatively through four helpers. Match this style in new code.

```js
el(tag, cls, html)              // create element with class and optional innerHTML
sel(opts, cur, cb, disabled)    // <select>; cb(value) on change
inp(v, ph, cb, disabled)        // <input>; cb(value) on BLUR or ENTER
txt(v, ph, cb, disabled)        // <textarea>; cb(value) on BLUR
```

`inp` and `txt` gate their callbacks on `canEdit`, so read-only mode is enforced at the helper
level rather than at every call site.

### The save path

```
user edits field
  → callback mutates D[section] in place
  → changed(section)
      → reads the section's notes textarea into D[section].notes
      → clearTimeout(saveTimers[section])
      → setTimeout(→ saveSection(section), 900)
  → saveSection(section)
      → sb.from('sheet_data').upsert(
            { sheet_id, section, data: D[section], updated_at },
            { onConflict: 'sheet_id,section' })
      → showToast('Saved ✓')
```

One jsonb blob per section per sheet. Coarse-grained, but it makes the whole thing simple and
means a section can gain fields without a migration.

### The realtime path

```
subscribeRealtime()
  → channel 'sheet-<id>' on postgres_changes
      event: UPDATE, table: sheet_data, filter: sheet_id=eq.<id>
  → on message:
      D[payload.new.section] = payload.new.data
      renderSection(section)
      showCollab(section)   // blue banner, 3 s
```

`subscribeSheetsList()` does the same for the `sheets` table so the picker updates live when
anyone creates, renames, or deletes a sheet.

### Rendering

`renderAll()` loops `SECTIONS` and calls `renderSection(sec)`, which dispatches to one of eight
render functions. Two safety properties, both load-bearing:

- `renderSection` is wrapped in try/catch and paints a red inline error into the section body on
  failure, so one bad section can't blank the entire app
- Every render function opens with `const c = document.getElementById('x-body'); if(!c) return;`
  because sections render before their tab has ever been displayed

`showTab(id, btn)` also re-renders the target section on switch, which keeps stale data from
lingering after a realtime update to a hidden tab.

---

## 5. Section data shapes

Authoritative source is `defaultSection(sec)`. Reproduced here for reference.

### `plan`
```js
{
  tasks: [ { phase: str, section: str, items: [ { t: str, d: bool } ] } ],
  notes: str
}
```
Ships with 8 phase groups: Kickoff Prep ×3, Define the Problem, Research, Generate Specs,
Develop Concepts, Choose Concept. Checkbox `d` toggles strikethrough.

### `wg`
```js
{
  students: [ str ],                                          // starts empty
  groups: [ { name: str, lead: str, cad: str, members: [str] } ],
  notes: str
}
```
Default subteams: Drive Base, Intake, Scoring, Climb, Index. Lead and CAD dropdowns populate
from `students`. Deleting a student also strips them from every group's members.

### `gr`
```js
{
  intake:      [ { loc, diff, val } ],
  rp:          [ { task, loc, pts, diff } ],
  scoring:     [ { task, loc, pts, diff } ],
  pps:         [ { task, time, pps } ],
  defense:     [ { task, loc, diff, val } ],
  penalty:     [ { task, loc, pts, impact } ],
  constraints: [ { name, val } ],
  qa:          [ { q, a } ],
  notes: str
}
```
`loc` (Location) was added to rp, scoring, defense, and penalty in a later pass. Only default
constraint is Max Frame Size `27.5 × 27.5" MAX`.

### `cpm`
```js
{
  setups: [ {  // exactly 10, lazily created by renderCPM
    label: str, scenario: str, cycles: str, points: str, time: str,
    intake: str, recover: str, spinup: str, speed: str, window: str, analysis: str
  } ]
}
```
**Known quirk:** `defaultSection('cpm')` returns the old flat shape (`scenario`, `cycles`, ...)
rather than `setups`. `renderCPM` ignores those and creates `setups` on first render. The flat
fields are dead data. Currently only `label` is rendered per setup — the stats, assumptions, and
analysis cards were removed by request, so those 10 fields per setup are unused for now but
retained for future use.

### `strat`
```js
{
  summary: str,
  archetypes: [ { name, pros, cpm, score } ],       // 4 rows, scores ~50/~80/~120/~200
  swot: { s: str, w: str, o: str, t: str },
  eng:  [ { sub, cap, ben, diff } ],
  prog: [ { cap, ben, diff, val } ],
  notes: str
}
```

### `specs`
```js
{
  caps:  [ { name, desc, when } ],   // starts empty
  quals: [ { name, target, notes } ],// 6 labeled rows, values empty
  prog:  [ { task, when, notes } ],  // starts empty
  notes: str
}
```
`quals` keeps labels (Weight, CG, Drivebase dimensions, Drive gear ratio, Drivebase type,
Reliability) since they're standard for any FRC robot. Everything else starts blank by request.

### `proto`
```js
{ tasks: [ { task, lead, members, pri } ], notes: str }   // starts empty
```
`lead` dropdown pulls from `D.wg.students`.

### `eval`
```js
{
  concepts: [ { name: str, desc: str, photo: str|null } ],  // photo = base64 data URL
  overview:   [ { c: str, base, c0, c1, ... } ],
  simplicity: [ { m: str, base, c0, c1, ... } ],
  riskMatrix: {
    riskLevels: [ str, str, str ],
    rows: [ { label: str, cells: [ { color: 'green'|'yellow'|'red', conceptIdxs: [int] } ] } ]
  },
  matrix: [ { lbl: str, desc: str, base: int, c0: int, c1: int, ... } ],
  notes: str
}
```

Concept columns are dynamic: keys are `base` plus `c` + concept array index. Adding or removing
a concept reshapes every table and matrix automatically.

**Known quirk:** the default `overview`, `simplicity`, and `matrix` rows use keys `c1, c2, c3`
but the render code generates `c0, c1, c2...` from index. So default `c1..c3` values are
orphaned and `c0` is created empty. Harmless (everything starts blank anyway) but worth fixing
if you touch this code.

**Photos** are stored as base64 data URLs inside the jsonb blob. This works but bloats rows
fast — a handful of phone photos can push a section past a megabyte. Migrating to Supabase
Storage with URL references would be the right fix.

---

## 6. Field Path Simulator

The most technically interesting part of the app. Lives in the CPM tab, below the subtabs, in a
self-contained IIFE. All DOM IDs are `sim-`prefixed; all internal vars are `s`-prefixed.

### Coordinate system

The uploaded field image defines the coordinate space. The user enters real field dimensions in
feet (default 54 × 27 for a standard FRC field). The canvas is fixed at 900 px wide and its
height is set from the image aspect ratio. Conversion:

```js
sPxToFt(x, y) → { fx: x * (fieldW / canvasW), fy: y * (fieldH / canvasH) }
sFtToPx(p)    → { x: p.fx * (canvasW / fieldW), y: p.fy * (canvasH / fieldH) }
```

Waypoints are stored in **feet**, so changing the field dimension inputs rescales the whole
layout without touching point data.

With no image uploaded, it draws a 1-foot grid as a fallback.

### Waypoints

```js
{ id: int, name: str, fx: float, fy: float,
  type: 'transit'|'shoot'|'intake'|'wait'|'climb'|'custom',
  duration: float,   // action seconds, 0 for transit
  desc: str }
```

Type colors: transit `#3a8ef5`, shoot `#e63a2e`, intake `#2ecc71`, wait `#f5a623`,
climb `#a855f7`, custom `#ec4899`.

Two canvas modes: **place** (click empty space to add, click a point to select) and **move**
(drag to reposition, clamped to field bounds).

### Path

`sPath` is an **array of point IDs**, not a set. The same point can appear any number of times,
which was a specific requirement — robots revisit the same scoring location repeatedly. Built
via a dropdown + "Add to path", with undo-last and clear. Each occurrence renders its step
number on the canvas dot; a point used at steps 2 and 5 shows `2,5`.

### Physics — continuous motion through transit points

This is the part worth understanding before changing it.

Naively, a path planner computes each segment independently assuming the robot starts and stops
at rest. That's wrong: a real robot carries speed through a waypoint it isn't stopping at. It
only needs to reach zero velocity at points where it performs an action.

The implementation resolves per-waypoint velocities with a **forward/backward pass**, the same
approach used in real motion profilers:

```js
mustStop(p) = p.type !== 'transit'   // action points force v = 0

// forward: how fast can we possibly be going at each point,
// accelerating from wherever we came from?
vFwd[0] = 0
vFwd[i] = mustStop(pts[i]) ? 0
        : min(vmax, sqrt(vFwd[i-1]² + 2·a·dist[i-1]))

// backward: how fast can we afford to be going at each point,
// given we must decelerate for what's coming?
vBwd[n-1] = 0
vBwd[i]   = mustStop(pts[i]) ? 0
          : min(vmax, sqrt(vBwd[i+1]² + 2·a·dist[i]))

// the real velocity is whichever constraint binds
speeds[i] = min(vFwd[i], vBwd[i])
speeds[0] = speeds[n-1] = 0   // endpoints always at rest
```

Then per-segment time uses an energy-balance trapezoid that handles arbitrary entry and exit
velocities, collapsing to a triangular profile automatically when the segment is too short to
reach `vmax`:

```js
simSegTime(dist, v0, v1, vmax, accel):
  vPeak   = min(vmax, sqrt(accel·dist + 0.5·(v0² + v1²)))
  dAccel  = (vPeak² − v0²) / (2·accel)
  dDecel  = (vPeak² − v1²) / (2·accel)
  dCruise = max(0, dist − dAccel − dDecel)
  return (vPeak − v0)/accel  +  dCruise/vPeak  +  (vPeak − v1)/accel
```

Total time = sum of segment travel times + sum of action durations at stop points.

The segment list surfaces a green **"continuous"** tag on segments the robot passes through
without stopping, plus entry→exit speeds in ft/s so students can sanity-check the model.

### Physics inputs

Max speed (ft/s, default 16), acceleration (ft/s², default 12), weight (lbs, default 120).

**Weight is currently collected but unused in the math.** Wiring it in — traction limits, or
deriving achievable acceleration from motor torque and mass — is a natural next feature and
would make the model meaningfully more accurate.

### Image prep guide

A dropdown (2026 / 2025 Reefscape / 2024 Crescendo / custom) plus a button that calls
`sendPrompt(...)` to ask Claude in chat for cropping instructions.

Why `sendPrompt` rather than a direct API call: an earlier version fetched
`api.anthropic.com/v1/messages` from inside the widget and failed with a CORS error. Browsers
block cross-origin requests to the Anthropic API from a page like this. In the deployed app this
button won't do anything useful outside of a Claude chat context — a static help modal with the
same content would be a better fit for production. Flagging it as a rough edge.

### Not persisted

Simulator state — image, waypoints, path, physics inputs — lives only in IIFE-local variables
and is lost on reload. Persisting it into `D.cpm.setups[i]` so each of the 10 setups carries its
own field layout is the highest-value outstanding feature.

---

## 7. Auth and permissions

### Current model

Login screen with two paths:

- **View as Guest** → `isAdmin = false`
- **Admin Login** → password prompt, compares `hashPw(input) === ADMIN_PW_HASH`

```js
const ADMIN_PW_HASH = hashPw('Mercs6369');

function hashPw(pw) {
  let h = 0;
  for (let i = 0; i < pw.length; i++) { h = ((h << 5) - h) + pw.charCodeAt(i); h |= 0; }
  return h.toString(36);
}
```

### Capability matrix

| Action | Admin | Guest |
|---|---|---|
| View sheet list | ✅ | ✅ |
| Open + edit unprotected sheet | ✅ | ✅ |
| Open protected sheet | ✅ bypasses password | Needs password, or View Only |
| Create sheet | ✅ | ❌ (UI hidden) |
| Rename sheet | ✅ inline in picker | ❌ |
| Delete sheet | ✅ with confirm | ❌ (UI hidden) |

Per-sheet passwords are independent of admin login: `hashPw(password)` is stored in
`sheets.password_hash` with `is_protected = true`. Guests opening a protected sheet get a modal
offering **Unlock to Edit** or **View Only**. View-only mode disables every input and shows a
banner on each tab; an **Unlock** button stays in the header.

### Being straight about the security

Three things are true and worth stating plainly rather than glossing over:

1. **The anon key is in client source.** Unavoidable for a static site, and it's what the key is
   designed for — but it means the security model is entirely RLS, and RLS here is wide open.
2. **RLS is `using (true)` everywhere.** Anyone who reads the page source can hit the Supabase
   REST API directly and read, write, or delete any row. The admin/guest split is UI-only.
3. **`hashPw` is not cryptographic.** It's a 32-bit string hash with trivial collisions, and the
   plaintext password sits in the source next to it.

For a student team's internal strategy notes on a URL that isn't advertised, this is a defensible
tradeoff — the realistic threat is a curious teammate, not an attacker. But it should never be
described as secure, and nothing genuinely sensitive should go in.

If real protection is wanted, the path is: Supabase Auth (email or Google), a `profiles` table
with a role column, and RLS policies keyed on `auth.uid()`. Note that Google OAuth was attempted
earlier and abandoned — see history below — so magic-link email is the lower-risk option.

---

## 8. Evolution and lessons learned

Useful because several of these were dead ends. Don't re-walk them.

### Auth attempts, in order

1. **Google OAuth, PKCE flow** — failed with `Lock "lock:mrc-auth" was released because another
   request stole it`. PKCE needs somewhere to persist the code verifier across the redirect;
   a static HTML file can't do that reliably.
2. **Google OAuth, implicit flow** — got further, but redirect loops persisted and the session
   didn't survive the round trip.
3. **Supabase Magic Link** — worked correctly. Rejected by the owner as too much friction for
   students mid-build-season.
4. **No auth, password-protected sheets** — shipped.
5. **Client-side admin password** — shipped, current state.

If auth comes back, start at magic link. Don't retry PKCE in a static file.

### Bugs worth remembering

| Symptom | Cause | Fix |
|---|---|---|
| Blank white screen | Supabase CDN path wrong | Use explicit `/dist/umd/supabase.js` |
| `Load failed` on iOS only | jsdelivr flaky on iOS Safari | Switch to unpkg |
| Sheets wouldn't load or create | RLS used `auth.role() = 'authenticated'` | Use `using (true)` |
| Redirect to `localhost` after login | Supabase Site URL still localhost | Set Site URL + Redirect URLs |
| Crash on tab switch | Render functions touched null DOM nodes | Null guard at top of every render fn |
| Focus stolen while typing | `oninput` triggered re-render | Save on blur/Enter only |
| Guest "Open Selected" never enabled | `getElementById('open-btn') \|\| getElementById('open-btn-guest')` — the hidden admin button always exists, so `\|\|` never reached the guest button | Removed disabled states entirely; added double-click-to-open |
| Old default data persisted | Defaults only apply when no row exists | `delete from sheet_data where section in (...)` |
| SQL script aborted at the end | Realtime tables already in publication (42710) | Omit the two `alter publication` lines |

### Design decisions and why

- **Single file** — the owner deploys via GitHub's web editor. One file is one paste.
- **jsonb per section** — no migrations when a section gains a field. Whole-section writes are
  a fine tradeoff at this data size.
- **Debounced 900 ms saves** — fast enough to feel automatic, slow enough not to hammer the API.
- **Realtime per-sheet channel** — filtered on `sheet_id`, so a sheet doesn't receive traffic
  from unrelated sheets.
- **Path as an ID array** — enables revisiting points, which a set couldn't.
- **Physics uses forward/backward passes** — a per-segment stop-and-go model overestimated cycle
  times badly enough to distort strategy conclusions.

---

## 9. Recommended first moves in Claude Code

### Immediately

1. **Set up `git push` deployment.** Removes the 75 KB paste ceiling and makes everything below
   practical.
2. **Drop `CLAUDE.md` in the repo root** so every future session starts with context.
3. **Verify the Supabase project isn't paused** before debugging any fetch failure.

### High value, low risk

4. **Persist simulator state** into `D.cpm.setups[cpmActiveTab]` — field image, waypoints, path,
   physics inputs. Each of the 10 setups gets its own field layout, saved and shared like every
   other section. This is the biggest functional gap.
5. **Move concept photos to Supabase Storage.** Base64 in jsonb will hit row size limits.
6. **Replace the `sendPrompt` guide button** with a static modal — it does nothing in production.
7. **Fix the `c0` vs `c1,c2,c3` key mismatch** in `defaultSection('eval')`.
8. **Delete the dead flat fields** in `defaultSection('cpm')`, or wire them back into the subtab UI.

### Larger, needs a decision first

9. **Split `index.html`** into `index.html` + `css/app.css` + `js/{app,sections,simulator}.js`.
   Much better for Claude Code's editing model. Only worth it once git push works, and it means
   the owner can no longer deploy by pasting one file — confirm that's acceptable.
10. **Real auth** if the sheets ever hold anything sensitive. Magic link, not OAuth.
11. **Offline fallback.** Was discussed when Supabase paused and never built. Note that browser
    storage is off-limits in this codebase's current conventions, so this needs a deliberate
    decision.
12. **Export to PDF or Word** for the engineering notebook — a real FRC workflow need, since
    everything in this worksheet ends up in the EN anyway.

---

## 10. Quick reference

### Constants

```js
DIFF = ['', 'Low', 'Med', 'High']
VAL  = ['', 'Low', 'Med', 'High']
PRI  = ['', 'Must Do', 'Consider', 'Skip']
MS   = ['', 'Alpha', 'Bravo', 'Charlie', 'Delta']   // milestones
SECTIONS = ['plan','wg','gr','cpm','strat','specs','proto','eval']
```

### CSS custom properties

```
--bg #0d0f14   --bg2 #13161e   --bg3 #1a1e28
--accent #e63a2e   --accent2 #ff6b5b   --gold #f5a623
--text #e8eaf0   --muted #7a8099   --dim #4a5068
--green #2ecc71   --blue #3a8ef5
--border rgba(255,255,255,0.08)   --border2 rgba(255,255,255,0.14)
--radius 6px
```

Fonts: Barlow (body), Barlow Condensed (headings), IBM Plex Mono (labels, metadata).

### Function index

**Auth / navigation** — `showAdminLogin`, `submitAdminLogin`, `loginGuest`, `enterPicker`,
`logoutToLogin`, `showPwModal`, `closePwModal`, `submitPw`, `openViewOnly`, `launchApp`,
`backToPicker`, `showTab`

**Sheets** — `loadSheets`, `renderSheetList`, `createSheet`, `openSheet`

**Data** — `defaultSection`, `loadAllSections`, `changed`, `saveSection`

**Realtime** — `subscribeRealtime`, `subscribeSheetsList`, `showCollab`

**Render** — `renderAll`, `renderSection`, `renderPlan`, `renderWG`, `renderGR`, `renderCPM`,
`renderStrat`, `renderSpecs`, `renderProto`, `renderEval`, `updateTotals`, `rmMember`

**Helpers** — `el`, `sel`, `inp`, `txt`, `showToast`, `hashPw`

**Simulator** — `simInit`, `simLoadImg`, `simSetMode`, `simClearAll`, `simRedraw`,
`simCalcPath`, `simSegTime`, `simAddPathStep`, `simUndoPath`, `simClearPath`,
`simRemovePathStep`, `simDeletePt`, `simUpdatePoint`, `simUpdatePathSel`, `simAskGuide`,
plus internals `sCW`, `sCH`, `sFW`, `sFH`, `sPxToFt`, `sFtToPx`, `simHitTest`,
`simMouseDown`, `simMouseMove`, `simRenderPath`, `simRenderPtList`, `simShowEdit`

### Credentials in one place

| What | Value |
|---|---|
| Admin password | `Mercs6369` |
| Supabase URL | `https://qsiozultzyirdvnqazcc.supabase.co` |
| Supabase anon key | see §3 |
| GitHub repo | `Grayson5921/Robot-Strategy-App` |
| Live site | `https://www.robot-strategy-app.com` |

Since these live in client-side source, treat "rotate the admin password" as "edit one line and
redeploy," not as a security operation.
