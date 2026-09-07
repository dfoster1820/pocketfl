# PocketFL

A from-scratch football GM sim in the spirit of Pocket GM 3: draft prospects, hire
front-office staff, sign and cut players, make trades, and simulate a season week
by week with a live scoreboard and play-by-play log. Pure HTML/CSS/JS — **no build
step, no server, no framework** — so it runs anywhere a browser does, including a
phone.

**`index.html` is fully self-contained** — CSS, JS, and even the app icon
are all embedded directly in it, so it works correctly as a single file:
double-click it, preview it, host it, or add it to your phone's home
screen, without needing any sibling files alongside it. `style.css` and
`app.js` are included too as separately-readable source (identical
content, just split out for easier editing) — if you edit those, re-inline
them into `index.html` before shipping, since `index.html` is what
actually runs.

## Run it locally

Just open `index.html` in a browser. That's it.

For a nicer local dev loop (so relative paths always behave), serve it over HTTP instead:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then visit the printed `localhost` URL.

## Put it on GitHub and deploy it

See **[GITHUB_SETUP.md](./GITHUB_SETUP.md)** for a full beginner-friendly
walkthrough — creating the repo, pushing, turning on free GitHub Pages
hosting, and adding the app to your phone's home screen with its custom
icon.

## How the game works

- **Start a franchise** — pick one of the 32 real NFL teams, organized into
  the real AFC/NFC conferences and North/South/East/West divisions.
- **Navigation** — a single row of tabs (Office / Team / League / News /
  Settings) fixed under the header. No hamburger menu, no sidebar drawer —
  just tabs, the same at every screen size.
- **Regular season** — an 18-game schedule per team (division rivals twice,
  the two "neighboring" divisions in-conference once each, and the matching
  division in the other conference once), packed into roughly 20-21 weeks
  with occasional bye weeks, same as a real league. Hit "Simulate Week" to
  sim every game; your team's result opens as a scoreboard with a
  quarter-by-quarter scoring log.
- **Standings** — grouped by conference and division, sorted by win% then
  point differential.
- **Playoffs** — a real NFL-style 7-seed bracket per conference: 4 division
  winners + 3 wildcards, the #1 seed gets a bye, then Wildcard → Divisional
  (with reseeding) → Conference Championship → Champions Bowl.
- **Front office staff** — a head coach (8 abilities: Player Development,
  Gameday, Offense/Defense Scheme, Motivation, Discipline, Playcalling,
  Adaptability), a chief scout (6: Evaluator, Star Spotter, Regional
  Connections, Film Study, Medical Red Flags, Interview Process), and a
  head physio (6: Prevention, Rehabilitation, Load Management, Nutrition
  Program, Return Timeline Accuracy, Sports Science IQ). The original two
  stats per role (Player Development/Gameday, Evaluator/Star Spotter,
  Prevention/Rehabilitation) are the ones that actually drive the
  simulation — development speed, a small in-game edge, draft scouting
  accuracy, and injury frequency/recovery; the rest add real
  characterization depth. Reroll any role's candidates from Office →
  Staff, or edit a hire's name/stats directly from the same screen.
- **Full editing tools** (Settings → Edit Players / Edit Staff, or the Edit
  button on any roster) — a six-tab player profile:
  - **Personal** — name, college (fictional), archetype, jersey number,
    age, morale, and (read-only) draft season/pick, or "UDFA" if undrafted.
  - **Skills** — Overall and Potential (the two numbers that actually drive
    the simulation), physical attributes (Height/Weight/Speed/Strength/
    Agility), mental attributes (Intelligence/Vision/Decisions/
    Discipline), and **10 position-specific technical skills** — a QB gets
    Short/Medium/Deep Pass, Throw on Run, Pocket Presence, etc.; a corner
    gets Man/Zone Coverage, Press, Ball Skills, Jamming, etc.; every one of
    the 10 positions has its own relevant set. That's 20 skills per player
    in total. **Injury Prone** (1-5) is the one sub-attribute that actually
    affects how often that specific player gets hurt; the rest are
    descriptive depth for now (see note in the app itself).
  - **Develop** — a season-by-season rating progression chart, an
    "Estimated Potential" scouting label (e.g. "Generational Talent"),
    editable development factors (Coaching/Team Mentors/Personality), and
    a full injury history log.
  - **Contract** (or **Scouting** for a college prospect) — character
    traits (Greed/Loyalty/Ambition/Personality/Work Ethic), average
    salary, a signing bonus, contract length, a Front/Balanced/Back
    contract shape that reshapes the year-by-year cap hit table, a trade
    block toggle, and **Cut Player** — there's no separate roster "Cut"
    button anymore; releasing a player is a contract decision made here.
  - **Games** — a real per-game log (This Season / Career) with actual
    box-score lines for every game, tracked for your own roster (kept off
    for the other 31 teams to keep save files a reasonable size — their
    season and career totals are still tracked normally).
  - **Career** — Rings, Player of the Year awards, All-Pro selections, and
    Conference Bowl appearances (all computed automatically each season),
    full career stats, draft info, and a Hall of Fame progress bar.
  Pick any of the 32 teams and open any player, coach/scout/physio, or the
  current draft class. Editing bypasses normal caps and limits on purpose —
  it's a sandbox tool, not a transaction.
- **Injuries** — a lightweight system tied to your Settings and physio
  staff; injured players are tagged "OUT" on the roster and are skipped for
  big plays and team-strength calculations until they heal.
- **Offseason** — players age, develop toward their potential (or decline
  past 30), contracts expire into free agency, and a new draft class of
  scouted prospects appears. CPU teams sign free agents to refill their own
  rosters too, so the league doesn't get lopsided over a long career.
- **Draft** — 3 rounds, 96 picks total, order set by reverse standings. CPU
  teams draft by best player available adjusted for roster need; you get a
  scouted range (not the exact rating), sized by your scout's accuracy.
- **Free agency** — sign released/expired players against a **player salary
  cap** you set yourself (Settings → Difficulty), on or off. Cap accounting
  now includes prorated signing bonus, not just base salary.
- **Trade desk** — offer any of your players for any of another team's; the
  CPU accepts or rejects based on a simple value formula (rating, age,
  potential). Blocked if it would push you over the roster limit.
- **53-man roster limit** — toggle on/off in Settings. When on, free-agent
  signings and trades that would push you over 53 are blocked; the roster
  screen flags it clearly if a mandatory draft pick ever puts you over.
- **Staff budget** — a *separate* cap from the player salary cap, also
  fully custom in Settings, that limits what you can spend hiring coaches,
  scouts, and physios.
- **Weekly standouts** (News tab) — after simulating a week, the top
  offensive and defensive performer league-wide (by a simple stat-weighted
  score) get called out with their actual stat line for that week.
- **Deep stats, saved every season** — full box-score categories: passing
  (attempts, completions, yards, TDs, INTs), rushing (attempts, yards, TDs,
  fumbles), receiving (targets, receptions, yards, TDs), defense (tackles,
  sacks, INTs, forced fumbles, passes defended), and kicking (FG made/att,
  long, XP made/att). Every player keeps a full **season-by-season log**
  (Team → Stats) plus **career totals** that persist even after a player
  retires.
- **Hall of Fame** (League → Hall of Fame) — induction is purely
  stats-based: when a player retires, their career totals are run through
  a weighted formula, and only the small fraction that clears an elite bar
  gets in — no vote, no vibes, just the numbers.
- **Settings** — Easy/Medium/Hard presets (or fully custom) controlling
  injury likelihood, scout accuracy, both salary caps (with exact custom
  limits, not just on/off), and the 53-man roster limit.
- **News** — a wire of front-office events plus a generated "social" feed
  reacting to last week's scoring plays (all fictional handles/players).
- **Cloud Sync** (Settings → Cloud Sync) — makes the *same franchise* show
  up on every device that opens your URL, using a private GitHub Gist as
  the shared storage. One device creates the cloud save and gets a Gist
  ID; any other device enters the same personal access token + that Gist
  ID to join it. After that, playing on either device pushes automatically
  (a few seconds after each action, batched so it doesn't spam GitHub's
  API), and opening the app anywhere will offer to load a newer cloud save
  if one exists. See the security note in the Cloud Sync screen itself —
  the token lives only in that browser's local storage, and a "secret"
  Gist is unlisted, not encrypted.
- **Save** — autosaves to the browser's local storage after every action
  (works fully offline, no cloud setup required), plus explicit **Export
  Save** (downloads a JSON file) and **Import Save** buttons in Settings.

## Project structure

```
index.html    — page shell, both screens (new game / main app), nav
style.css     — dark navy/blue design system + responsive layout
app.js        — everything else: league generation, scheduling, game
                simulation, staff/injuries, draft, free agency, trades,
                settings, and all rendering
test/smoke.js — a headless test that plays a full season, checks the
                schedule for conflicts, runs the full playoff bracket,
                drafts all 96 picks, hires staff, trades, and renders
                every screen
```

## Running the test suite

The "test" is a headless smoke test using jsdom: it boots a 32-team
franchise, verifies the schedule has no team double-booked in any week and
every team gets exactly 18 games, confirms the nav is a single tab strip
with no hamburger/sidebar, edits a player/coach/prospect directly, checks
that both salary caps (player and staff) enforce independently, checks the
53-man roster limit blocks signings and lopsided trades, sims a full
season and confirms deep box-score stats (passing/rushing/receiving/
defense/kicking) accumulate into career totals and season logs, runs the
full 7-seed playoff bracket, drafts all 96 picks, confirms CPU teams
refill their own rosters via free agency, changes difficulty settings,
saves/loads with schema migration, renders every screen and sub-tab
(including the new Stats and Hall of Fame views), and separately simulates
15 full seasons end-to-end to confirm Hall of Fame induction stays rare
and elite (not everyone gets in).

```bash
npm install
npm test
```

## Where to take it next

This is a big, sizeable build, not a finished clone. Natural next steps,
roughly in order of impact:

- **Offensive-line stats** — OL currently has no tracked stat category (no
  real football sim credits "pancake blocks" easily), so they're
  mathematically unable to reach the Hall of Fame under the current
  formula. A snap-count or team-success-based proxy stat would fix this.
- **Depth chart & positional need in the draft/UI** — right now roster
  building is loose; a depth chart view would make cuts and signings more
  strategic.
- **Richer play-by-play** — currently only scoring plays and turnovers are
  logged; full drive-by-drive detail would need a heavier simulation loop.
- **Position-relative Hall of Fame weighting** — the current formula
  rewards passing yardage heavily, so QBs dominate the Hall of Fame; a
  position-normalized score (e.g. percentile within position) would be
  fairer to defenders and kickers.
- **Custom roster import** — the Export/Import JSON buttons are already
  close to this; formalizing the player-list format would let people share
  custom rosters built with the Edit Players screen.

## Note on real teams and players

Team names, cities, conferences, and divisions are the real NFL structure —
that's just factual, public information, the same as any fantasy-football or
fan simulation app uses. **Player rosters are entirely invented**, though:
every player, coach, scout, and physio in the game is a fictional name with
generated ratings, not a real athlete. Tying real people's names to made-up
stats and career outcomes is a different, closer call on individual likeness
that this project intentionally avoids. If you want to use it for fantasy
purposes with real rosters, Export Save → edit the JSON → Import Save is the
place to swap in your own data.
