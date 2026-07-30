# Designing Your Digital Teammate — Workshop Platform

A self-contained, static web app for the workshop **"Designing Your Digital
Teammate"** (Utrecht University, School of Economics). A student team works
through it together on one shared screen: they map their team's
16Personalities composition, design a CustomGPT system prompt that fits the
team, stress-test it, and download their results as one pseudonymised team
file. The closing screen hands each member off to an individual Qualtrics
survey.

---
## How a session runs

1. **Team setup** — the team picks its size and receives a generated team
   code (e.g. `KJ9-5MS`). No names are entered anywhere; members are
   numbered Member 1…N.
2. **Individual input** — members take turns at the keyboard entering their
   16Personalities type and five percentages, exactly as their results email
   states them ("72% Introverted" → pick *Introverted (I)*, type 72).
3. **Part 1 – Team profile** — role-group diamond, dimension map, blind
   spots. A typo in someone's entry can be fixed via *edit* on the roster.
4. **Part 2 – Design canvas** — six sections (B1–B6) assemble a live
   CustomGPT system prompt.
5. **Part 3 – Test & refine** — mandatory topic A plus two chosen topics,
   with a four-step worksheet per topic; then the final prompt.
6. **Part 4 – Save & reflect** — the team downloads its team file (see
   below), then each member scans the QR code and completes the Qualtrics
   survey on their own device, identifying themselves only by **team code +
   member code** (M1…Mn).

Everything autosaves to the browser's localStorage after every change — a
refresh or crash mid-workshop offers "Resume" on the landing page. "Start
over" (Menu, top right) erases the browser copy.

`?demo=1` loads a five-member sample team with seeded answers for
demonstrations and facilitator training. Exports made from it are stamped
`demo: true` (exclude those from analysis).

## The team export

Each team downloads **one file**: `team_<code>.json` — the complete record
(member types and dimensions, Part 1 interpretation, design answers B1–B6,
evaluation notes, and both prompt versions v1/v2 with the revision diff).
A human-readable `summary_<code>.md` is offered as an optional extra.

To build analysis tables, collect the JSON files into a folder and run:

```
python3 tools/collate.py data/                 # → data/collated/
python3 tools/collate.py data/ --exclude-demo  # drop ?demo=1 test exports
```

This writes stacked `members.csv` (one row per member) and `teams.csv`
(one row per team, including the v1/v2 fields and Part 1 answers as
columns) plus regenerated per-team summaries. It handles pilot-era
(schema 1.0) and current (1.1) files in the same run.

Dimension columns are named after the right-hand pole and hold a 0–100
position (`energy_extraverted_pct = 28` ⇔ "72% Introverted"; 50 = not set).
Full column reference: [docs/data-dictionary.md](docs/data-dictionary.md).

```r
library(tidyverse)
members <- read_csv("data/collated/members.csv",
                    col_types = cols(team_code = "c", member_id = "c"))
teams   <- read_csv("data/collated/teams.csv",
                    col_types = cols(.default = "c"))
```

## Data protection

- **No names, ever.** Teams are identified by a generated code, members by
  number. These codes are the only linkage keys to the Qualtrics survey.
- **The site is static and stateless.** Answers live only in the browser
  (localStorage) until the team downloads them; the download is the only
  copy that leaves the page.
- **No external requests.** React, Babel, the QR generator, fonts and the
  logo are all served from this repository. No CDNs, no trackers, no
  analytics. The page carries `noindex` so search engines skip it.

## Repository layout

```
index.html            entry page (script load order matters — see comments)
css/styles.css        fonts + design tokens + all app styles
js/config.js          ← the only file you normally edit (survey link etc.)
js/constants.js       16P types, role groups, dimensions, shared components
js/storage.js         localStorage autosave / resume / clear
js/onboarding.js      landing, team setup, member handoff, results entry
js/team-profile.js    Part 1
js/design-canvas.js   Part 2 (B1–B6) + prompt builder + live preview
js/evaluate.js        Part 3 (topics A–D) + revision screen (v1/v2 capture)
js/export.js          export data assembly (team JSON + summary), screen
js/handoff.js         closing screen: QR code, codes, Qualtrics handoff
js/app.js             state machine, routing, persistence wiring
js/vendor/            react 18.3.1, react-dom, @babel/standalone, qrcode-generator (pinned, self-hosted)
assets/               UU logo, favicon, self-hosted woff2 fonts
docs/                 data dictionary for exports
tools/collate.py      stack many team_*.json into members.csv / teams.csv
scripts/serve.py      tiny local dev server
preview.command       macOS: double-click to preview locally
```

**No build step.** The JSX in `js/*.js` is compiled in the browser by the
vendored Babel at load time (the original prototype worked the same way).
Edit a file, refresh, done. Wording lives in plain string constants — e.g.
the B1–B6 questions at the top of `js/design-canvas.js`, the evaluation
topics at the top of `js/evaluate.js`.

## Previewing and deploying

- **Locally:** double-click `preview.command` (or run
  `python3 scripts/serve.py`) and open <http://127.0.0.1:4173>. Opening
  `index.html` straight from Finder won't work — browsers block the script
  loading on `file://` URLs.
- **Deploying:** push/upload to `main`. GitHub Pages (Settings → Pages →
  deploy from branch `main`, root) serves the repository as-is.

## Research-relevant implementation notes

- **Dimension semantics:** 16Personalities percentages are complementary,
  so each dimension is stored as a single 0–100 position equal to the
  right-pole percentage. Members enter pole + percentage verbatim from
  their results; the slider is a synced visual. An earlier prototype's
  slider recorded an ambiguous value — data collected with it is not
  comparable.
- **Type-consistency check:** if the entered percentages imply a different
  four-letter type than the selected card, a non-blocking warning asks the
  member to double-check. Entries are never auto-corrected.
- **Part 3 defaults:** only mandatory topic A is pre-selected; viewing a
  topic card does not select it (explicit include toggle), so topic choice
  is the team's own.
- **Prompt vs refinements:** `system_prompt` in the export is the prompt as
  assembled from B1–B6; Part 3 refinements are recorded separately per
  topic (`eval_*_refinement`), mirroring what teams saw on screen.
