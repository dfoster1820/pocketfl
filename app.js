/* =========================================================================
   GRIDIRON OFFICE — a from-scratch football GM sim
   Single-file vanilla JS. No build step, no server. Works offline once loaded.
   32 real NFL teams — real AFC/NFC conferences, real North/South/East/West
   divisions — with entirely fictional players, coaches, and scouts.
   ========================================================================= */

/* ----------------------------- Constants -------------------------------- */

const SAVE_KEY = "gridiron_office_save_v4";
const ROSTER_LIMIT = 53;
const HOF_THRESHOLD = 1000;

const POSITIONS = ["QB","RB","WR","TE","OL","DL","LB","CB","S","K"];
const ROSTER_TEMPLATE = { QB:3, RB:3, WR:5, TE:2, OL:6, DL:5, LB:4, CB:4, S:3, K:1 };

const CONFERENCES = ["AFC", "NFC"];
const DIVISIONS = ["North", "South", "East", "West"];

const TEAM_DEFS = [
  { city:"Baltimore",    name:"Ravens",     conference:"AFC", division:"North" },
  { city:"Cincinnati",   name:"Bengals",    conference:"AFC", division:"North" },
  { city:"Cleveland",    name:"Browns",     conference:"AFC", division:"North" },
  { city:"Pittsburgh",   name:"Steelers",   conference:"AFC", division:"North" },
  { city:"Houston",      name:"Texans",     conference:"AFC", division:"South" },
  { city:"Indianapolis", name:"Colts",      conference:"AFC", division:"South" },
  { city:"Jacksonville", name:"Jaguars",    conference:"AFC", division:"South" },
  { city:"Tennessee",    name:"Titans",     conference:"AFC", division:"South" },
  { city:"Buffalo",      name:"Bills",      conference:"AFC", division:"East"  },
  { city:"Miami",        name:"Dolphins",   conference:"AFC", division:"East"  },
  { city:"New England",  name:"Patriots",   conference:"AFC", division:"East"  },
  { city:"New York",     name:"Jets",       conference:"AFC", division:"East"  },
  { city:"Denver",       name:"Broncos",    conference:"AFC", division:"West"  },
  { city:"Kansas City",  name:"Chiefs",     conference:"AFC", division:"West"  },
  { city:"Las Vegas",    name:"Raiders",    conference:"AFC", division:"West"  },
  { city:"Los Angeles",  name:"Chargers",   conference:"AFC", division:"West"  },
  { city:"Chicago",      name:"Bears",      conference:"NFC", division:"North" },
  { city:"Detroit",      name:"Lions",      conference:"NFC", division:"North" },
  { city:"Green Bay",    name:"Packers",    conference:"NFC", division:"North" },
  { city:"Minnesota",    name:"Vikings",    conference:"NFC", division:"North" },
  { city:"Atlanta",      name:"Falcons",    conference:"NFC", division:"South" },
  { city:"Carolina",     name:"Panthers",   conference:"NFC", division:"South" },
  { city:"New Orleans",  name:"Saints",     conference:"NFC", division:"South" },
  { city:"Tampa Bay",    name:"Buccaneers", conference:"NFC", division:"South" },
  { city:"Dallas",       name:"Cowboys",    conference:"NFC", division:"East"  },
  { city:"New York",     name:"Giants",     conference:"NFC", division:"East"  },
  { city:"Philadelphia", name:"Eagles",     conference:"NFC", division:"East"  },
  { city:"Washington",   name:"Commanders", conference:"NFC", division:"East"  },
  { city:"Arizona",      name:"Cardinals",  conference:"NFC", division:"West"  },
  { city:"Los Angeles",  name:"Rams",       conference:"NFC", division:"West"  },
  { city:"San Francisco",name:"49ers",      conference:"NFC", division:"West"  },
  { city:"Seattle",      name:"Seahawks",   conference:"NFC", division:"West"  },
];

const FIRST_NAMES = ["Marcus","Jalen","Tyrell","Dexter","Colton","Reggie","Andre","Skyler","Bo","Dominic",
  "Ezra","Malik","Trent","Gunnar","Isaiah","Cade","Rashad","Owen","DeShawn","Wyatt",
  "Kellen","Amir","Brock","Tremaine","Silas","Jaxon","Marquis","Rico","Holden","Deion",
  "Chase","Kobe","Nathaniel","Zion","Grady","Preston","Julian","Maddox","Sterling","Enzo"];
const LAST_NAMES = ["Carter","Whitfield","Dobbins","Marsh","Okafor","Beaumont","Sloan","Reyes","Kavanagh","Truitt",
  "Boone","Fentress","Larkspur","Odom","Mackey","Pruitt","Sandoval","Hargrove","Delaney","Nakamura",
  "Fairweather","Cotter","Brannigan","Vasquez","Steadman","Okonkwo","Pemberton","Riggs","Castellano","Emeka",
  "Winslow","Hutto","Aldrich","Kirkland","Osei","Whitlock","Bramwell","Dunmore","Escamilla","Tarrow"];

const INJURY_CHANCE = { None: 0, Low: 0.008, Medium: 0.016, High: 0.03 };
const SCOUT_SPREAD = { High: 5, Medium: 8, Low: 12 };
const COLLEGES = ["Redrock A&M", "Cascade State", "Ironwood University", "Bay Crest College", "Sable Tech",
  "Highland Poly", "Millstone University", "Granite Valley State", "Thornfield College", "Emberline University",
  "Copper Ridge State", "Duskrow Tech", "Silverlake University", "Ashcombe College", "Windrift State",
  "Cinderpass University", "Sundale A&M", "Redstone College", "Kingsmere University", "Vantage State"];

/* ------------------------------ Utilities -------------------------------- */

const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const choice = (arr) => arr[randInt(0, arr.length - 1)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const uid = (() => { let n = 1; return (p) => `${p}_${n++}_${Date.now().toString(36)}`; })();

function normalish(min, max) {
  const a = rand(min, max), b = rand(min, max), c = rand(min, max);
  return (a + b + c) / 3;
}
function fullName() { return `${choice(FIRST_NAMES)} ${choice(LAST_NAMES)}`; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = randInt(0, i); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function starString(n) {
  n = clamp(Math.round(n), 0, 5);
  return "★".repeat(n) + `<span class="off">${"★".repeat(5 - n)}</span>`;
}
function ovrClass(ovr) {
  if (ovr >= 88) return "ovr-elite";
  if (ovr >= 76) return "ovr-good";
  if (ovr >= 62) return "ovr-avg";
  return "ovr-low";
}
function grade(v) {
  if (v >= 92) return "A+"; if (v >= 87) return "A"; if (v >= 82) return "A-";
  if (v >= 77) return "B+"; if (v >= 72) return "B"; if (v >= 67) return "B-";
  if (v >= 62) return "C+"; if (v >= 57) return "C"; if (v >= 50) return "C-";
  return "D";
}
function salaryFor(ovr) { return Math.round(Math.max(0.4, ((ovr - 48) / 51) * 21) * 10) / 10; }

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------ Stats shapes ------------------------------ */

function freshStats() {
  return {
    gp: 0,
    passing: { att: 0, comp: 0, yards: 0, tds: 0, ints: 0 },
    rushing: { att: 0, yards: 0, tds: 0, fum: 0 },
    receiving: { tgt: 0, rec: 0, yards: 0, tds: 0 },
    defense: { tkl: 0, sacks: 0, ints: 0, ff: 0, pd: 0 },
    kicking: { fgm: 0, fga: 0, xpm: 0, xpa: 0, long: 0 },
  };
}
function addStatsInto(dst, src) {
  for (const cat of Object.keys(src)) {
    if (typeof src[cat] === "number") { dst[cat] = (dst[cat] || 0) + src[cat]; continue; }
    dst[cat] = dst[cat] || {};
    for (const k of Object.keys(src[cat])) {
      if (k === "long") dst[cat][k] = Math.max(dst[cat][k] || 0, src[cat][k]);
      else dst[cat][k] = (dst[cat][k] || 0) + src[cat][k];
    }
  }
}
function statLine(stats, pos) {
  const s = stats;
  if (pos === "QB" && (s.passing.att > 0 || s.rushing.att > 0)) return `${s.passing.comp}/${s.passing.att}, ${s.passing.yards} yd, ${s.passing.tds} TD, ${s.passing.ints} INT`;
  if (pos === "RB") return `${s.rushing.att} att, ${s.rushing.yards} yd, ${s.rushing.tds} TD · ${s.receiving.rec} rec, ${s.receiving.yards} yd`;
  if (pos === "WR" || pos === "TE") return `${s.receiving.rec} rec, ${s.receiving.yards} yd, ${s.receiving.tds} TD`;
  if (["DL","LB","CB","S"].includes(pos)) return `${s.defense.tkl} tkl, ${s.defense.sacks} sk, ${s.defense.ints} INT, ${s.defense.pd} PD`;
  if (pos === "K") return `${s.kicking.fgm}/${s.kicking.fga} FG (lg ${s.kicking.long}), ${s.kicking.xpm}/${s.kicking.xpa} XP`;
  return `${s.gp} GP`;
}
function careerScore(career) {
  const p = career;
  return p.passing.yards / 25 + p.passing.tds * 4 - p.passing.ints * 2
    + p.rushing.yards / 10 + p.rushing.tds * 6
    + p.receiving.yards / 10 + p.receiving.tds * 6 + p.receiving.rec * 0.5
    + p.defense.tkl * 1 + p.defense.sacks * 6 + p.defense.ints * 8 + p.defense.ff * 4 + p.defense.pd * 2
    + p.kicking.fgm * 3
    + p.gp * 0.3;
}

/* ------------------------------ Game State -------------------------------- */

let S = null;

function freshState() {
  return {
    season: 1, week: 0, phase: "preseason", // preseason | regular | playoffs | offseason | draft | champion
    userTeamId: null,
    teams: [], players: {}, freeAgents: [],
    schedule: [], playoffs: null,
    draft: null,
    settings: {
      difficulty: "Medium", injuryLikelihood: "Low", scoutAccuracy: "Medium",
      playerCapOn: true, playerCapLimit: 220,
      staffCapOn: true, staffCapLimit: 30,
      rosterLimitOn: true,
    },
    history: [],
    hallOfFame: [],
    teamSeasonHistory: [],
    lastWeekAwards: null,
    log: [],
    updatedAt: Date.now(),
  };
}

function migrateSettings(s) {
  const d = freshState().settings;
  s.settings = Object.assign({}, d, s.settings || {});
  if (s.hallOfFame === undefined) s.hallOfFame = [];
  if (s.teamSeasonHistory === undefined) s.teamSeasonHistory = [];
  Object.values(s.players || {}).forEach(p => {
    if (!p.stats || typeof p.stats.yards === "number") p.stats = freshStats(); // old shape -> reset
    if (!p.career) p.career = freshStats();
    if (!p.seasonLog) p.seasonLog = [];
    if (p.college === undefined) p.college = choice(COLLEGES);
    if (p.jerseyNumber === undefined) p.jerseyNumber = randInt(1, 99);
    if (p.bonus === undefined) p.bonus = 0;
    if (p.weightContract === undefined) p.weightContract = "Balanced";
    if (p.heightIn === undefined) p.heightIn = randInt(69, 79);
    if (p.weightLb === undefined) p.weightLb = randInt(180, 320);
    if (p.speed === undefined) p.speed = p.ovr || 60;
    if (p.strength === undefined) p.strength = p.ovr || 60;
    if (p.agility === undefined) p.agility = p.ovr || 60;
    if (p.injuryProne === undefined) p.injuryProne = 3;
    if (p.draftSeason === undefined) p.draftSeason = null;
    if (p.draftPick === undefined) p.draftPick = null;
  });
  return s;
}

function saveGame() {
  S.updatedAt = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* export/import still works */ }
  scheduleCloudPush();
}
function loadSavedState() {
  try { const raw = localStorage.getItem(SAVE_KEY); return raw ? migrateSettings(JSON.parse(raw)) : null; } catch (e) { return null; }
}

/* ------------------------------ Cloud Sync (GitHub Gist) ----------------------- */
/* Saves live in localStorage by default (per browser, per device). To make the
   same URL show the same franchise on every device, we optionally mirror the
   save to a GitHub Gist via the REST API, using a personal access token the
   player provides. The token/Gist ID are connection config, NOT game data —
   kept in a separate localStorage key so they never end up in an Export Save
   file or get overwritten by migrateSettings(). */

const CLOUD_KEY = "gridiron_cloud_v1";
const CLOUD_FILENAME = "gridiron-office-save.json";
let cloudStatus = { state: "idle", message: "" }; // idle | syncing | ok | error
let cloudPushTimer = null;

function loadCloudConfig() {
  try { const raw = localStorage.getItem(CLOUD_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
function saveCloudConfig(cfg) { try { localStorage.setItem(CLOUD_KEY, JSON.stringify(cfg)); } catch (e) { /* ignore */ } }
function clearCloudConfig() { try { localStorage.removeItem(CLOUD_KEY); } catch (e) { /* ignore */ } }
function cloudConfigured() { const c = loadCloudConfig(); return !!(c && c.token && c.gistId); }

function ghHeaders(token) {
  return { "Authorization": `token ${token}`, "Accept": "application/vnd.github+json", "Content-Type": "application/json" };
}

async function cloudCreate(token) {
  const body = { description: "PocketFL save (auto-managed — do not delete the JSON key)", public: false, files: { [CLOUD_FILENAME]: { content: JSON.stringify(S) } } };
  const res = await fetch("https://api.github.com/gists", { method: "POST", headers: ghHeaders(token), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`GitHub rejected the request (${res.status}). Check the token has the "gist" scope.`);
  const data = await res.json();
  saveCloudConfig({ token, gistId: data.id });
  return data.id;
}

async function cloudPull(token, gistId) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers: ghHeaders(token) });
  if (!res.ok) throw new Error(`Could not read that Gist (${res.status}). Check the token and Gist ID.`);
  const data = await res.json();
  const file = data.files && data.files[CLOUD_FILENAME];
  if (!file) throw new Error(`That Gist doesn't contain a ${CLOUD_FILENAME} file.`);
  const content = file.truncated ? await (await fetch(file.raw_url)).text() : file.content;
  return JSON.parse(content);
}

async function cloudPush(token, gistId, stateObj) {
  const body = { files: { [CLOUD_FILENAME]: { content: JSON.stringify(stateObj) } } };
  const res = await fetch(`https://api.github.com/gists/${gistId}`, { method: "PATCH", headers: ghHeaders(token), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Sync failed (${res.status}).`);
  return true;
}

function scheduleCloudPush() {
  if (!cloudConfigured() || !S) return;
  if (cloudPushTimer) clearTimeout(cloudPushTimer);
  cloudPushTimer = setTimeout(() => {
    const cfg = loadCloudConfig();
    if (!cfg) return;
    cloudStatus = { state: "syncing", message: "Syncing…" };
    if (activeView === "settings") renderSettings();
    cloudPush(cfg.token, cfg.gistId, S)
      .then(() => { cloudStatus = { state: "ok", message: `Synced ${new Date().toLocaleTimeString()}` }; if (activeView === "settings") renderSettings(); })
      .catch(err => { cloudStatus = { state: "error", message: err.message }; if (activeView === "settings") renderSettings(); });
  }, 3000);
}

/* --------------------------- League Generation ----------------------------- */

function makePlayer(pos, opts = {}) {
  const age = opts.age ?? randInt(21, 33);
  let base;
  if (pos === "QB") base = normalish(48, 95);
  else if (pos === "OL" || pos === "DL") base = normalish(52, 92);
  else base = normalish(50, 93);
  let ovr = Math.round(clamp(base - Math.max(0, age - 29) * 0.8, 40, 99));
  const potBonus = age <= 25 ? randInt(4, 22) : randInt(0, 6);
  const pot = Math.round(clamp(ovr + potBonus, ovr, 99));
  const id = uid("p");
  return {
    id, name: fullName(), pos, age, ovr, pot,
    teamId: opts.teamId ?? null,
    contractYears: opts.contractYears ?? randInt(1, 4),
    salary: salaryFor(ovr),
    salaryOverride: false,
    bonus: opts.bonus ?? 0,
    weightContract: "Balanced",
    college: opts.college ?? choice(COLLEGES),
    jerseyNumber: opts.jerseyNumber ?? randInt(1, 99),
    draftSeason: opts.draftSeason ?? null,
    draftPick: opts.draftPick ?? null,
    heightIn: opts.heightIn ?? randInt(69, 79),
    weightLb: opts.weightLb ?? randInt(180, 320),
    speed: clamp(ovr + randInt(-8, 8), 40, 99),
    strength: clamp(ovr + randInt(-8, 8), 40, 99),
    agility: clamp(ovr + randInt(-8, 8), 40, 99),
    injuryProne: randInt(1, 5),
    stats: freshStats(), career: freshStats(), seasonLog: [],
    injuredWeeksLeft: 0,
    retired: false,
    rookie: !!opts.rookie,
  };
}

function buildRoster(teamId) {
  const ids = [];
  for (const pos of POSITIONS) {
    for (let i = 0; i < ROSTER_TEMPLATE[pos]; i++) {
      const p = makePlayer(pos, { teamId });
      S.players[p.id] = p;
      ids.push(p.id);
    }
  }
  return ids;
}

function randStaffStats(role) {
  if (role === "coach") return { dev: randInt(1, 5), gameday: randInt(1, 5) };
  if (role === "scout") return { evaluator: randInt(1, 5), starSpotter: randInt(1, 5) };
  return { prevention: randInt(1, 5), rehab: randInt(1, 5) }; // physio
}
function makeStaff() {
  return {
    coach: { name: fullName(), ...randStaffStats("coach") },
    scout: { name: fullName(), ...randStaffStats("scout") },
    physio: { name: fullName(), ...randStaffStats("physio") },
  };
}
function generateStaffCandidates(role, n = 3) {
  const out = [];
  for (let i = 0; i < n; i++) out.push({ name: fullName(), ...randStaffStats(role) });
  return out;
}
function staffCost(member) {
  const vals = Object.entries(member).filter(([k]) => k !== "name").map(([, v]) => v);
  return Math.round(vals.reduce((a, b) => a + b, 0) * 1.3 * 10) / 10;
}
function teamStaffCost(team) { return staffCost(team.staff.coach) + staffCost(team.staff.scout) + staffCost(team.staff.physio); }

function hireStaff(role, candidate) {
  const team = teamById(S.userTeamId);
  if (S.settings.staffCapOn) {
    const withoutOld = teamStaffCost(team) - staffCost(team.staff[role]);
    if (withoutOld + staffCost(candidate) > S.settings.staffCapLimit) return { ok: false, reason: "Over the staff budget." };
  }
  team.staff[role] = { ...candidate };
  addLog(`Hired ${candidate.name} as ${role === "coach" ? "head coach" : role === "scout" ? "chief scout" : "head physio"}.`);
  saveGame();
  return { ok: true };
}
function editStaffDirect(team, role, fields) {
  team.staff[role] = { ...team.staff[role], ...fields };
  addLog(`Edited ${teamName(team.id)}'s ${role}.`);
  saveGame();
}

function newFranchise(userTeamId) {
  S = freshState();
  S.userTeamId = userTeamId;
  S.teams = TEAM_DEFS.map((t, i) => ({
    id: `team_${i}`, city: t.city, name: t.name, conference: t.conference, division: t.division,
    players: [], staff: makeStaff(), wins: 0, losses: 0, ties: 0, pf: 0, pa: 0,
  }));
  S.teams.forEach(t => { t.players = buildRoster(t.id); });
  generateSchedule();
  S.phase = "preseason";
  S.week = 0;
  addLog(`Franchise founded. You take over the ${teamName(userTeamId)}.`);
  saveGame();
}

function teamName(teamId) {
  const t = S.teams.find(x => x.id === teamId);
  return t ? `${t.city} ${t.name}` : "Free Agents";
}
function teamById(id) { return S.teams.find(t => t.id === id); }
function addLog(msg) { S.log.unshift({ season: S.season, week: S.week, msg }); S.log = S.log.slice(0, 60); }

/* ------------------------------ Roster limit helpers ----------------------- */

function rosterWouldExceed(team, deltaCount) { return S.settings.rosterLimitOn && (team.players.length + deltaCount > ROSTER_LIMIT); }
function trimRosterIfNeeded(team) {
  if (!S.settings.rosterLimitOn) return;
  let guard = 0;
  while (team.players.length > ROSTER_LIMIT && guard < 20) {
    const sorted = team.players.map(id => S.players[id]).sort((a, b) => a.ovr - b.ovr);
    const cut = sorted[0];
    team.players = team.players.filter(id => id !== cut.id);
    cut.teamId = null;
    S.freeAgents.push(cut.id);
    guard++;
  }
}

/* ------------------------------ Scheduling --------------------------------- */

function generateSchedule() {
  const byConfDiv = {};
  S.teams.forEach(t => { const k = `${t.conference}|${t.division}`; (byConfDiv[k] = byConfDiv[k] || []).push(t.id); });

  const gamesRaw = [];
  const homeCount = {}; S.teams.forEach(t => homeCount[t.id] = 0);

  function addBalanced(a, b) {
    let home, away;
    if (homeCount[a] < homeCount[b]) { home = a; away = b; }
    else if (homeCount[b] < homeCount[a]) { home = b; away = a; }
    else { if (Math.random() < 0.5) { home = a; away = b; } else { home = b; away = a; } }
    homeCount[home]++; gamesRaw.push({ home, away });
  }
  function addDivisionPair(a, b) {
    gamesRaw.push({ home: a, away: b }); homeCount[a]++;
    gamesRaw.push({ home: b, away: a }); homeCount[b]++;
  }

  Object.values(byConfDiv).forEach(ids => {
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) addDivisionPair(ids[i], ids[j]);
  });

  CONFERENCES.forEach(conf => {
    for (let i = 0; i < DIVISIONS.length; i++) {
      const dA = DIVISIONS[i], dB = DIVISIONS[(i + 1) % DIVISIONS.length];
      const idsA = byConfDiv[`${conf}|${dA}`], idsB = byConfDiv[`${conf}|${dB}`];
      idsA.forEach(a => idsB.forEach(b => addBalanced(a, b)));
    }
  });

  for (let i = 0; i < DIVISIONS.length; i++) {
    const idsA = byConfDiv[`${CONFERENCES[0]}|${DIVISIONS[i]}`];
    const idsB = byConfDiv[`${CONFERENCES[1]}|${DIVISIONS[i]}`];
    idsA.forEach(a => idsB.forEach(b => addBalanced(a, b)));
  }

  const minWeeks = Math.round((gamesRaw.length * 2) / S.teams.length); // 18, theoretical minimum
  let packed = null;
  for (let w = minWeeks; w <= minWeeks + 10 && !packed; w++) {
    for (let attempt = 0; attempt < 80 && !packed; attempt++) packed = tryPack(gamesRaw, w);
  }
  if (!packed) packed = looselyPack(gamesRaw, minWeeks);

  S.schedule = packed.map((games, idx) => ({
    week: idx + 1,
    games: games.map(g => ({ home: g.home, away: g.away, homeScore: null, awayScore: null, played: false, log: [] })),
  }));
}

function tryPack(gamesPool, weeks) {
  const pool = shuffle(gamesPool);
  const buckets = Array.from({ length: weeks }, () => []);
  const used = Array.from({ length: weeks }, () => new Set());
  for (const g of pool) {
    let placed = false;
    for (let w = 0; w < weeks; w++) {
      if (!used[w].has(g.home) && !used[w].has(g.away)) {
        buckets[w].push(g); used[w].add(g.home); used[w].add(g.away); placed = true; break;
      }
    }
    if (!placed) return null;
  }
  return buckets;
}
function looselyPack(gamesPool, weeks) {
  const pool = shuffle(gamesPool);
  const buckets = [];
  let w = 0;
  while (pool.length) {
    buckets[w] = buckets[w] || [];
    const used = new Set(buckets[w].flatMap(g => [g.home, g.away]));
    let progressed = false;
    for (let i = pool.length - 1; i >= 0; i--) {
      const g = pool[i];
      if (!used.has(g.home) && !used.has(g.away)) {
        buckets[w].push(g); used.add(g.home); used.add(g.away); pool.splice(i, 1); progressed = true;
      }
    }
    w++;
    if (!progressed && w > weeks * 3) break;
  }
  return buckets;
}

/* ------------------------------ Team Ratings -------------------------------- */

function topN(playerIds, pos, n) {
  return playerIds.map(id => S.players[id])
    .filter(p => p && p.pos === pos && !p.retired && !(p.injuredWeeksLeft > 0))
    .sort((a, b) => b.ovr - a.ovr)
    .slice(0, n);
}
function avg(list) { return list.length ? list.reduce((s, p) => s + p.ovr, 0) / list.length : 45; }

function teamOffenseRating(team) {
  const qb = topN(team.players, "QB", 1), rb = topN(team.players, "RB", 2), wr = topN(team.players, "WR", 3);
  const te = topN(team.players, "TE", 1), ol = topN(team.players, "OL", 4);
  return avg(qb) * 0.30 + avg(rb) * 0.15 + avg(wr) * 0.25 + avg(te) * 0.10 + avg(ol) * 0.20;
}
function teamDefenseRating(team) {
  const dl = topN(team.players, "DL", 3), lb = topN(team.players, "LB", 3), cb = topN(team.players, "CB", 2), s = topN(team.players, "S", 2);
  return avg(dl) * 0.35 + avg(lb) * 0.30 + avg(cb) * 0.20 + avg(s) * 0.15;
}
function teamOverall(team) { return Math.round((teamOffenseRating(team) + teamDefenseRating(team)) / 2); }
function gamedayBonus(team) { return (team.staff.coach.gameday - 3) * 0.6; }

/* ------------------------------ Game Simulation ------------------------------ */

function pool(team, positions) {
  return team.players.map(id => S.players[id]).filter(p => p && positions.includes(p.pos) && !p.retired && !(p.injuredWeeksLeft > 0));
}
function weightedPick(list) {
  if (!list.length) return null;
  const weights = list.map(p => Math.pow(p.ovr, 1.6));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand(0, total);
  for (let i = 0; i < list.length; i++) { r -= weights[i]; if (r <= 0) return list[i]; }
  return list[list.length - 1];
}
function pickSkillPlayer(team) { return weightedPick(pool(team, ["RB", "WR", "TE", "QB"])); }
function pickReceiver(team) { return weightedPick(pool(team, ["WR", "TE", "RB"])); }
function pickRusher(team) {
  if (Math.random() < 0.08) { const qbs = pool(team, ["QB"]); if (qbs.length) return qbs[0]; }
  return weightedPick(pool(team, ["RB"]));
}
function pickDefender(team) { return weightedPick(pool(team, ["DL", "LB", "CB", "S"])); }
function qbOf(team) { return pool(team, ["QB"])[0] || null; }
function kOf(team) { return pool(team, ["K"])[0] || null; }

function generateBasePlay(off, def) {
  const isPass = Math.random() < 0.6;
  const qb = qbOf(off);
  if (isPass) {
    if (qb) qb.stats.passing.att += 1;
    const complete = Math.random() < 0.63;
    if (complete) {
      const receiver = pickReceiver(off);
      const yds = Math.max(0, randInt(-3, 20));
      if (qb) { qb.stats.passing.comp += 1; qb.stats.passing.yards += yds; }
      if (receiver) { receiver.stats.receiving.tgt += 1; receiver.stats.receiving.rec += 1; receiver.stats.receiving.yards += yds; }
    } else {
      const receiver = pickReceiver(off);
      if (receiver) receiver.stats.receiving.tgt += 1;
      if (Math.random() < 0.08) {
        const rusher = pickDefender(def);
        if (rusher) rusher.stats.defense.sacks += 1;
        if (qb) qb.stats.passing.yards -= randInt(2, 9);
      } else if (Math.random() < 0.12) {
        const db = pickDefender(def);
        if (db) db.stats.defense.pd += 1;
      }
    }
  } else {
    const rusher = pickRusher(off);
    const yds = Math.max(0, randInt(-2, 9));
    if (rusher) { rusher.stats.rushing.att += 1; rusher.stats.rushing.yards += yds; }
  }
  const tackler = pickDefender(def);
  if (tackler && Math.random() < 0.85) tackler.stats.defense.tkl += 1;
}

function simulateGame(homeTeam, awayTeam) {
  const offH = teamOffenseRating(homeTeam), defH = teamDefenseRating(homeTeam);
  const offA = teamOffenseRating(awayTeam), defA = teamDefenseRating(awayTeam);
  let homeScore = 0, awayScore = 0;
  const log = [];
  const possessions = randInt(20, 24);
  let onOffenseIsHome = Math.random() < 0.5;

  for (let i = 0; i < possessions; i++) {
    const off = onOffenseIsHome ? homeTeam : awayTeam;
    const def = onOffenseIsHome ? awayTeam : homeTeam;
    const offRating = onOffenseIsHome ? offH : offA;
    const defRating = onOffenseIsHome ? defA : defH;
    let edge = offRating - defRating + (onOffenseIsHome ? 1.5 : 0);
    edge += gamedayBonus(off) - gamedayBonus(def) * 0.5;

    const tdProb = clamp(0.16 + edge * 0.006, 0.05, 0.46);
    const fgAttemptProb = clamp(0.16 + edge * 0.002, 0.08, 0.26);
    const toProb = clamp(0.13 - edge * 0.003, 0.03, 0.26);
    const roll = Math.random();
    const quarter = Math.min(4, Math.floor((i / possessions) * 4) + 1);

    generateBasePlay(off, def);

    if (roll < tdProb) {
      const scorer = pickSkillPlayer(off);
      const yards = randInt(12, 78);
      let kind = "rushing";
      if (scorer) {
        if (scorer.pos === "RB" || scorer.pos === "QB") {
          scorer.stats.rushing.att += 1; scorer.stats.rushing.yards += yards; scorer.stats.rushing.tds += 1;
        } else {
          kind = "receiving";
          const qb = qbOf(off);
          if (qb) { qb.stats.passing.att += 1; qb.stats.passing.comp += 1; qb.stats.passing.yards += yards; qb.stats.passing.tds += 1; }
          scorer.stats.receiving.tgt += 1; scorer.stats.receiving.rec += 1; scorer.stats.receiving.yards += yards; scorer.stats.receiving.tds += 1;
        }
      }
      if (onOffenseIsHome) homeScore += 7; else awayScore += 7;
      log.push({ q: quarter, text: `TD — ${scorer ? scorer.name : "Offense"} (${off.name}) ${yards}-yd ${kind} score` });
      const k = kOf(off);
      if (k) { k.stats.kicking.xpa += 1; if (Math.random() < 0.94) k.stats.kicking.xpm += 1; }
    } else if (roll < tdProb + fgAttemptProb) {
      const dist = randInt(27, 53);
      const made = Math.random() < 0.82;
      const k = kOf(off);
      if (k) {
        k.stats.kicking.fga += 1;
        if (made) { k.stats.kicking.fgm += 1; k.stats.kicking.long = Math.max(k.stats.kicking.long, dist); }
      }
      if (made) { if (onOffenseIsHome) homeScore += 3; else awayScore += 3; log.push({ q: quarter, text: `FG — ${k ? k.name : "Kicker"} (${off.name}) good from ${dist}` }); }
      else log.push({ q: quarter, text: `FG — ${k ? k.name : "Kicker"} (${off.name}) missed from ${dist}` });
    } else if (roll < tdProb + fgAttemptProb + toProb) {
      if (Math.random() < 0.45) {
        const qb = qbOf(off);
        if (qb) qb.stats.passing.ints += 1;
        const defender = pickDefender(def);
        if (defender) defender.stats.defense.ints += 1;
      } else {
        const fumbler = pickSkillPlayer(off);
        if (fumbler) fumbler.stats.rushing.fum = (fumbler.stats.rushing.fum || 0) + 1;
        const defender = pickDefender(def);
        if (defender) defender.stats.defense.ff += 1;
      }
      log.push({ q: quarter, text: `Turnover — ${off.name} gives it away` });
    }
    onOffenseIsHome = !onOffenseIsHome;
  }

  [homeTeam, awayTeam].forEach(team => {
    team.players.forEach(id => {
      const p = S.players[id];
      if (p.injuredWeeksLeft > 0) return;
      p.stats.gp += 1;
      const chance = INJURY_CHANCE[S.settings.injuryLikelihood]
        * clamp(1.3 - team.staff.physio.prevention * 0.12, 0.55, 1.3)
        * clamp(0.6 + p.injuryProne * 0.16, 0.6, 1.4);
      if (chance > 0 && Math.random() < chance) {
        const duration = Math.max(1, randInt(1, 4) - Math.floor(team.staff.physio.rehab / 2));
        p.injuredWeeksLeft = duration;
        if (team.id === S.userTeamId) addLog(`${p.name} injured — out ${duration} wk${duration > 1 ? "s" : ""}.`);
      }
    });
  });

  return { homeScore, awayScore, log };
}

/* ------------------------------ Season Flow --------------------------------- */

function startSeason() { S.phase = "regular"; S.week = 1; addLog(`Season ${S.season} kicks off.`); saveGame(); }
function currentWeekGames() { const wk = S.schedule.find(w => w.week === S.week); return wk ? wk.games : []; }

function decrementInjuries() {
  Object.values(S.players).forEach(p => { if (p.injuredWeeksLeft > 0) p.injuredWeeksLeft -= 1; });
}

function simulateWeek() {
  const games = currentWeekGames();
  const before = {};
  games.forEach(g => {
    [g.home, g.away].forEach(tid => {
      teamById(tid).players.forEach(pid => { before[pid] = JSON.parse(JSON.stringify(S.players[pid].stats)); });
    });
  });
  const results = [];
  for (const g of games) {
    if (g.played) continue;
    const home = teamById(g.home), away = teamById(g.away);
    const r = simulateGame(home, away);
    g.homeScore = r.homeScore; g.awayScore = r.awayScore; g.played = true; g.log = r.log;
    home.pf += r.homeScore; home.pa += r.awayScore;
    away.pf += r.awayScore; away.pa += r.homeScore;
    if (r.homeScore > r.awayScore) { home.wins++; away.losses++; }
    else if (r.awayScore > r.homeScore) { away.wins++; home.losses++; }
    else { home.ties++; away.ties++; }
    results.push(g);
  }
  S.lastWeekAwards = computeWeeklyAwards(games, before);
  addLog(`Week ${S.week} simulated.`);
  decrementInjuries();
  if (S.week >= S.schedule.length) startPlayoffs(); else S.week += 1;
  saveGame();
  return results;
}

function computeWeeklyAwards(games, before) {
  let bestOff = null, bestOffScore = -Infinity, bestDef = null, bestDefScore = -Infinity;
  games.forEach(g => {
    [g.home, g.away].forEach(tid => {
      teamById(tid).players.forEach(pid => {
        const p = S.players[pid]; const b = before[pid]; if (!b) return;
        const rushYds = p.stats.rushing.yards - b.rushing.yards, rushTD = p.stats.rushing.tds - b.rushing.tds, rushAtt = p.stats.rushing.att - b.rushing.att;
        const recYds = p.stats.receiving.yards - b.receiving.yards, recTD = p.stats.receiving.tds - b.receiving.tds, rec = p.stats.receiving.rec - b.receiving.rec;
        const passYds = p.stats.passing.yards - b.passing.yards, passTD = p.stats.passing.tds - b.passing.tds, comp = p.stats.passing.comp - b.passing.comp, att = p.stats.passing.att - b.passing.att, ints = p.stats.passing.ints - b.passing.ints;
        const offScore = rushYds * 0.1 + rushTD * 6 + recYds * 0.1 + recTD * 6 + passYds * 0.04 + passTD * 4 - ints * 2;
        if (offScore > bestOffScore) { bestOffScore = offScore; bestOff = { playerId: pid, teamId: tid, rushYds, rushTD, rushAtt, recYds, recTD, rec, passYds, passTD, comp, att, ints }; }
        const tkl = p.stats.defense.tkl - b.defense.tkl, sacks = p.stats.defense.sacks - b.defense.sacks, dints = p.stats.defense.ints - b.defense.ints, ff = p.stats.defense.ff - b.defense.ff, pd = p.stats.defense.pd - b.defense.pd;
        const defScore = tkl * 1 + sacks * 6 + dints * 8 + ff * 4 + pd * 2;
        if (defScore > bestDefScore) { bestDefScore = defScore; bestDef = { playerId: pid, teamId: tid, tkl, sacks, ints: dints, ff, pd }; }
      });
    });
  });
  return { week: S.week, offense: bestOffScore > 0 ? bestOff : null, defense: bestDefScore > 0 ? bestDef : null };
}

function sortByRecord(list) {
  return list.slice().sort((a, b) => {
    const wpA = (a.wins + a.ties * 0.5) / Math.max(1, a.wins + a.losses + a.ties);
    const wpB = (b.wins + b.ties * 0.5) / Math.max(1, b.wins + b.losses + b.ties);
    if (wpB !== wpA) return wpB - wpA;
    return (b.pf - b.pa) - (a.pf - a.pa);
  });
}
function standingsSorted() { return sortByRecord(S.teams); }

/* ------------------------------ Playoffs (7-seed, NFL-style) ------------------- */

function seedConference(conf) {
  const divTeams = DIVISIONS.map(d => S.teams.filter(t => t.conference === conf && t.division === d));
  const winners = divTeams.map(list => sortByRecord(list)[0]);
  const winnerIds = new Set(winners.map(t => t.id));
  const rest = S.teams.filter(t => t.conference === conf && !winnerIds.has(t.id));
  const wildcards = sortByRecord(rest).slice(0, 3);
  return [...sortByRecord(winners), ...wildcards].map(t => t.id);
}

function startPlayoffs() {
  S.phase = "playoffs";
  const conferences = {};
  CONFERENCES.forEach(conf => { conferences[conf] = { seeds: seedConference(conf), wildcard: null, divisional: null, championship: null }; });
  S.playoffs = { conferences, championsBowl: null };
  addLog(`Playoffs are set.`);
}

function resolveTie(g, a, b) { if (g.homeScore === g.awayScore) return Math.random() < 0.5 ? a : b; return g.homeScore > g.awayScore ? a : b; }

function playWildcard(seeds) {
  const pairs = [[1, 6], [2, 5], [3, 4]];
  const games = pairs.map(([i, j]) => {
    const home = seeds[i], away = seeds[j];
    const g = simulateGame(teamById(home), teamById(away));
    const winner = resolveTie(g, home, away);
    return { seedA: i + 1, seedB: j + 1, home, away, ...g, winner, winnerSeed: winner === home ? i + 1 : j + 1 };
  });
  return { byeSeed: 1, byeTeam: seeds[0], games };
}
function playDivisional(conf) {
  const wc = conf.wildcard;
  const remaining = [{ seed: 1, team: wc.byeTeam }, ...wc.games.map(g => ({ seed: g.winnerSeed, team: g.winner }))];
  remaining.sort((a, b) => a.seed - b.seed);
  const matchups = [[remaining[0], remaining[3]], [remaining[1], remaining[2]]];
  return matchups.map(([a, b]) => {
    const g = simulateGame(teamById(a.team), teamById(b.team));
    const winner = resolveTie(g, a.team, b.team);
    return { seedA: a.seed, seedB: b.seed, home: a.team, away: b.team, ...g, winner, winnerSeed: winner === a.team ? a.seed : b.seed };
  });
}
function playChampionship(conf) {
  const [a, b] = conf.divisional;
  const homeSide = a.winnerSeed <= b.winnerSeed ? a : b, awaySide = a.winnerSeed <= b.winnerSeed ? b : a;
  const g = simulateGame(teamById(homeSide.winner), teamById(awaySide.winner));
  const winner = resolveTie(g, homeSide.winner, awaySide.winner);
  return { home: homeSide.winner, away: awaySide.winner, ...g, winner };
}
function simPlayoffRound() {
  const po = S.playoffs;
  let didSomething = false;
  for (const conf of CONFERENCES) {
    const c = po.conferences[conf];
    if (!c.wildcard) { c.wildcard = playWildcard(c.seeds); didSomething = true; }
    else if (!c.divisional) { c.divisional = playDivisional(c); didSomething = true; }
    else if (!c.championship) { c.championship = playChampionship(c); didSomething = true; }
  }
  if (!didSomething && !po.championsBowl) {
    const c1 = po.conferences[CONFERENCES[0]].championship.winner;
    const c2 = po.conferences[CONFERENCES[1]].championship.winner;
    const g = simulateGame(teamById(c1), teamById(c2));
    const winner = resolveTie(g, c1, c2);
    po.championsBowl = { home: c1, away: c2, ...g, winner };
    S.history.push({ season: S.season, champion: winner });
    addLog(`${teamName(winner)} win the Champions Bowl!`);
    S.phase = "champion";
  }
  saveGame();
}
function nextPlayoffLabel() {
  const po = S.playoffs;
  for (const conf of CONFERENCES) {
    const c = po.conferences[conf];
    if (!c.wildcard) return "Simulate Wildcard Round";
    if (!c.divisional) return "Simulate Divisional Round";
    if (!c.championship) return "Simulate Conference Championships";
  }
  return "Simulate Champions Bowl";
}

/* ------------------------------ Hall of Fame -------------------------------- */

function checkHallOfFame(p) {
  const score = careerScore(p.career);
  if (score >= HOF_THRESHOLD && !S.hallOfFame.some(h => h.playerId === p.id)) {
    S.hallOfFame.push({
      playerId: p.id, name: p.name, pos: p.pos, inductedSeason: S.season,
      score: Math.round(score), career: JSON.parse(JSON.stringify(p.career)),
    });
    addLog(`🏈 ${p.name} (${p.pos}) is inducted into the Hall of Fame!`);
  }
}

/* ------------------------------ Offseason ------------------------------------ */

function processOffseason() {
  const newFAs = [];
  for (const t of S.teams) {
    S.teamSeasonHistory.push({ season: S.season, teamId: t.id, wins: t.wins, losses: t.losses, ties: t.ties, pf: t.pf, pa: t.pa });
    const devMult = 0.7 + t.staff.coach.dev * 0.12;
    const keep = [];
    for (const pid of t.players) {
      const p = S.players[pid];
      p.seasonLog.push({ season: S.season, teamId: t.id, stats: JSON.parse(JSON.stringify(p.stats)) });
      addStatsInto(p.career, p.stats);
      p.age += 1;
      if (p.age <= 29) p.ovr = Math.round(clamp(p.ovr + (p.pot - p.ovr) * rand(0.08, 0.25) * devMult + rand(-1, 2), 40, 99));
      else p.ovr = Math.round(clamp(p.ovr - rand(0.5, 3.5), 35, 99));
      if (!p.salaryOverride) p.salary = salaryFor(p.ovr);
      p.stats = freshStats();
      p.injuredWeeksLeft = 0;

      if (p.age >= 35 && Math.random() < 0.35) {
        p.retired = true; p.teamId = null;
        checkHallOfFame(p);
        continue;
      }
      p.contractYears -= 1;
      if (p.contractYears <= 0) { p.teamId = null; newFAs.push(pid); continue; }
      keep.push(pid);
    }
    t.players = keep;
    t.wins = 0; t.losses = 0; t.ties = 0; t.pf = 0; t.pa = 0;
  }
  for (let i = 0; i < 30; i++) {
    const pos = choice(POSITIONS);
    const p = makePlayer(pos, { age: randInt(26, 33), teamId: null, contractYears: randInt(1, 3) });
    S.players[p.id] = p; newFAs.push(p.id);
  }
  S.freeAgents = [...S.freeAgents, ...newFAs].filter(id => S.players[id]);
  pruneFreeAgentPool();
  buildDraftClass();
  S.phase = "draft";
  addLog(`Offseason: rosters aged, contracts settled, rookie class arrived.`);
  saveGame();
}

function buildDraftClass() {
  const rounds = 3;
  const count = rounds * S.teams.length;
  const prospects = [];
  const userScout = teamById(S.userTeamId).staff.scout;
  const baseSpread = SCOUT_SPREAD[S.settings.scoutAccuracy];
  const spread = clamp(baseSpread - (userScout.evaluator - 3), 2, 16);
  for (let i = 0; i < count; i++) {
    const pos = choice(POSITIONS);
    const p = makePlayer(pos, { age: randInt(21, 23), teamId: null, contractYears: 3, rookie: true });
    p._scoutLow = clamp(p.ovr - spread, 35, 99);
    p._scoutHigh = clamp(p.ovr + spread, 35, 99);
    S.players[p.id] = p; prospects.push(p.id);
  }
  if (userScout.starSpotter >= 4) {
    const gem = prospects.map(id => S.players[id]).sort((a, b) => b.ovr - a.ovr)[0];
    if (gem) gem._gem = true;
  }
  const order = draftOrderFromStandings();
  const fullOrder = [];
  for (let r = 0; r < rounds; r++) fullOrder.push(...order);
  S.draft = { class: prospects, order: fullOrder, pickIndex: 0, rounds, picks: [] };
}
function draftOrderFromStandings() {
  const hasRecord = S.teams.some(t => t.wins + t.losses + t.ties > 0);
  const ids = S.teams.map(t => t.id);
  if (!hasRecord) return shuffle(ids);
  return sortByRecord(S.teams).slice().reverse().map(t => t.id);
}
function draftOnClockTeam() { const d = S.draft; if (!d || d.pickIndex >= d.order.length) return null; return d.order[d.pickIndex]; }

function makeDraftPick(prospectId) {
  const d = S.draft; const teamId = draftOnClockTeam(); if (!teamId) return;
  const team = teamById(teamId); const p = S.players[prospectId];
  p.teamId = teamId; team.players.push(prospectId);
  p.draftSeason = S.season; p.draftPick = d.pickIndex + 1;
  d.class = d.class.filter(id => id !== prospectId);
  d.picks.push({ round: Math.floor(d.pickIndex / (d.order.length / d.rounds)) + 1, teamId, playerId: prospectId });
  d.pickIndex += 1;
  addLog(`${teamName(teamId)} draft ${p.name} (${p.pos}).`);
  if (teamId !== S.userTeamId) trimRosterIfNeeded(team);
  saveGame();
}
function cpuAutoPick() {
  const d = S.draft; const teamId = draftOnClockTeam(); if (!teamId) return false;
  if (teamId === S.userTeamId) return false;
  const team = teamById(teamId);
  const needCounts = {}; POSITIONS.forEach(pos => needCounts[pos] = team.players.filter(id => S.players[id].pos === pos).length);
  let best = null, bestScore = -Infinity;
  for (const pid of d.class) {
    const p = S.players[pid];
    const needBoost = (ROSTER_TEMPLATE[p.pos] - (needCounts[p.pos] || 0)) * 2;
    const score = p.ovr + needBoost + rand(-4, 4);
    if (score > bestScore) { bestScore = score; best = pid; }
  }
  if (best) makeDraftPick(best);
  return true;
}
function runDraftUntilUserTurn() {
  let guard = 0;
  while (draftOnClockTeam() && draftOnClockTeam() !== S.userTeamId && guard < 800) { if (!cpuAutoPick()) break; guard++; }
}
function finishDraftIfDone() {
  if (S.draft && draftOnClockTeam() === null) {
    S.phase = "offseason";
    cpuFreeAgencyPass();
    saveGame();
    return true;
  }
  return false;
}

function pruneFreeAgentPool() {
  const FA_POOL_CAP = 150;
  if (S.freeAgents.length <= FA_POOL_CAP) return;
  const sorted = S.freeAgents.map(id => S.players[id]).sort((a, b) => b.ovr - a.ovr);
  const keep = sorted.slice(0, FA_POOL_CAP);
  const drop = sorted.slice(FA_POOL_CAP);
  S.freeAgents = keep.map(p => p.id);
  drop.forEach(p => { delete S.players[p.id]; });
}

function cpuFreeAgencyPass() {
  const rosterTarget = Object.values(ROSTER_TEMPLATE).reduce((a, b) => a + b, 0); // 36
  for (const t of S.teams) {
    if (t.id === S.userTeamId) continue;
    let guard = 0;
    while (t.players.length < rosterTarget && S.freeAgents.length && guard < 60) {
      const pick = S.freeAgents.map(id => S.players[id]).sort((a, b) => b.ovr - a.ovr)[0];
      if (!pick) break;
      pick.teamId = t.id; pick.contractYears = randInt(2, 4);
      t.players.push(pick.id);
      S.freeAgents = S.freeAgents.filter(id => id !== pick.id);
      guard++;
    }
  }
}

function beginNewSeason() {
  S.season += 1; S.week = 0; S.phase = "preseason"; S.playoffs = null; S.draft = null;
  generateSchedule();
  addLog(`Season ${S.season} preseason begins.`);
  saveGame();
}

/* ------------------------------ Free Agency ----------------------------------- */

function teamCapUsed(team) {
  return team.players.reduce((s, id) => {
    const p = S.players[id];
    return s + p.salary + (p.contractYears > 0 ? p.bonus / p.contractYears : 0);
  }, 0);
}
function contractBreakdown(p) {
  const n = Math.max(1, p.contractYears);
  const avg = p.salary;
  const bonusPerYear = p.bonus / n;
  let mults;
  if (p.weightContract === "Front") mults = Array.from({ length: n }, (_, i) => 1.3 - (0.6 * i / Math.max(1, n - 1)));
  else if (p.weightContract === "Back") mults = Array.from({ length: n }, (_, i) => 0.7 + (0.6 * i / Math.max(1, n - 1)));
  else mults = Array.from({ length: n }, () => 1);
  return mults.map((m, i) => {
    const salary = Math.round(avg * m * 10) / 10;
    const bonus = Math.round(bonusPerYear * 10) / 10;
    return { yearLabel: `Year ${i + 1}`, salary, bonus, capHit: Math.round((salary + bonus) * 10) / 10 };
  });
}

function signFreeAgent(playerId) {
  const team = teamById(S.userTeamId); const p = S.players[playerId];
  if (S.settings.rosterLimitOn && team.players.length >= ROSTER_LIMIT) return { ok: false, reason: `Roster is full (${ROSTER_LIMIT}-man limit).` };
  if (S.settings.playerCapOn && teamCapUsed(team) + p.salary > S.settings.playerCapLimit) return { ok: false, reason: "Over the salary cap." };
  p.teamId = team.id; p.contractYears = randInt(2, 4);
  team.players.push(playerId);
  S.freeAgents = S.freeAgents.filter(id => id !== playerId);
  addLog(`Signed ${p.name} (${p.pos}).`);
  saveGame();
  return { ok: true };
}
function releasePlayer(teamId, playerId) {
  const team = teamById(teamId);
  team.players = team.players.filter(id => id !== playerId);
  const p = S.players[playerId]; p.teamId = null;
  S.freeAgents.push(playerId);
  addLog(`Released ${p.name}.`);
  saveGame();
}

/* ------------------------------ Trades ----------------------------------------- */

function playerValue(p) { return p.ovr * 2 + (99 - p.age) * 0.4 + p.pot * 0.3; }
function proposeTrade(otherTeamId, offerIds, requestIds) {
  const user = teamById(S.userTeamId), other = teamById(otherTeamId);
  const userNewCount = user.players.length - offerIds.length + requestIds.length;
  if (S.settings.rosterLimitOn && userNewCount > ROSTER_LIMIT) {
    return { accepted: false, blocked: true, reason: `That trade would put you over the ${ROSTER_LIMIT}-man limit.` };
  }
  const offerVal = offerIds.reduce((s, id) => s + playerValue(S.players[id]), 0);
  const reqVal = requestIds.reduce((s, id) => s + playerValue(S.players[id]), 0);
  const accepted = offerVal >= reqVal * 0.92;
  if (accepted) {
    user.players = user.players.filter(id => !offerIds.includes(id)).concat(requestIds);
    other.players = other.players.filter(id => !requestIds.includes(id)).concat(offerIds);
    offerIds.forEach(id => S.players[id].teamId = otherTeamId);
    requestIds.forEach(id => S.players[id].teamId = S.userTeamId);
    trimRosterIfNeeded(other);
    addLog(`Trade completed with ${teamName(otherTeamId)}.`);
    saveGame();
  }
  return { accepted, offerVal: Math.round(offerVal), reqVal: Math.round(reqVal) };
}

/* ================================ RENDERING ==================================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null) return;
    e.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  });
  return e;
}

let activeView = "office";
let officeSubTab = "overview";
let teamSubTab = "roster";
let leagueSubTab = "standings";
let settingsSubTab = "difficulty";
let rosterFilter = "ALL";
let faFilter = "ALL";
let tradeTargetId = null, tradeOffer = new Set(), tradeRequest = new Set();
let viewingTeamId = null; // for Team screen's team switcher; null = user's team
let editPlayersTeamId = null, editPlayersMode = "roster"; // roster | prospects
let editStaffTeamId = null;

function currentViewingTeamId() { return viewingTeamId || S.userTeamId; }

function showModal(node) { $("#modal-body").innerHTML = ""; $("#modal-body").appendChild(node); $("#modal-backdrop").classList.remove("hidden"); }
function closeModal() { $("#modal-backdrop").classList.add("hidden"); }
function confirmish(msg) { return window.confirm(msg); }
function statBox(v, l) { return el("div", { class: "stat-box" }, [el("div", { class: "v" }, String(v)), el("div", { class: "l" }, l)]); }
function subTabs(items, current, onPick) {
  const row = el("div", { class: "chip-row" });
  items.forEach(([key, label]) => row.appendChild(el("button", { class: `chip ${current === key ? "active" : ""}`, onclick: () => onPick(key) }, label)));
  return row;
}
function field(labelText, inputEl) { return el("label", { class: "field" }, [el("span", { class: "field-label" }, labelText), inputEl]); }
function numInput(value, onChange, opts = {}) {
  const i = el("input", { type: "number", value: String(value) });
  if (opts.min != null) i.min = opts.min;
  if (opts.max != null) i.max = opts.max;
  if (opts.step != null) i.step = opts.step;
  i.addEventListener("change", () => onChange(parseFloat(i.value)));
  return i;
}
function numInputWithBounds(value, onChange, opts = {}) {
  const wrap = el("div", { class: "num-with-bounds" });
  const input = numInput(value, onChange, opts);
  wrap.appendChild(input);
  if (opts.min != null) {
    wrap.appendChild(el("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => { input.value = String(opts.min); onChange(opts.min); } }, "Min"));
  }
  if (opts.max != null) {
    wrap.appendChild(el("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => { input.value = String(opts.max); onChange(opts.max); } }, "Max"));
  }
  return wrap;
}
function textInput(value, onChange) {
  const i = el("input", { type: "text", value: value });
  i.addEventListener("change", () => onChange(i.value));
  return i;
}
function selectInput(options, value, onChange) {
  const s = el("select");
  options.forEach(opt => s.appendChild(el("option", { value: opt }, opt)));
  s.value = value;
  s.addEventListener("change", () => onChange(s.value));
  return s;
}

function setActiveView(view) {
  activeView = view;
  $$(".view").forEach(v => v.classList.add("hidden"));
  const target = $(`#view-${view}`); if (target) target.classList.remove("hidden");
  $$(".tab-btn[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  renderView(view);
}

function renderAll() {
  $("#hdr-team-name").textContent = teamName(S.userTeamId);
  $("#hdr-season").textContent = `Season ${S.season}`;
  const phaseLabel = { preseason: "Preseason", regular: `Week ${S.week}/${S.schedule.length}`, playoffs: "Playoffs", champion: "Offseason", offseason: "Offseason", draft: "Draft" }[S.phase] || S.phase;
  $("#hdr-phase").textContent = phaseLabel;
  renderView(activeView);
}
function renderView(view) {
  if (!S) return;
  const map = { office: renderOffice, team: renderTeam, league: renderLeague, news: renderNews, settings: renderSettings };
  (map[view] || renderOffice)();
}

/* ---- OFFICE ---- */
function renderOffice() {
  const root = $("#view-office");
  root.innerHTML = "";
  root.appendChild(el("h2", { class: "section-title" }, teamName(S.userTeamId)));
  root.appendChild(subTabs([["overview", "Overview"], ["staff", "Staff"]], officeSubTab, (k) => { officeSubTab = k; renderOffice(); }));
  if (officeSubTab === "overview") renderOfficeOverview(root); else renderOfficeStaff(root);
}
function renderOfficeOverview(root) {
  const team = teamById(S.userTeamId);
  const ovr = teamOverall(team);
  const rank = standingsSorted().findIndex(t => t.id === team.id) + 1;
  root.appendChild(el("p", { class: "section-sub" }, `${team.conference} · ${team.division} Division · League rank #${rank} of ${S.teams.length}`));
  root.appendChild(el("div", { class: "panel" }, [el("h3", {}, "This Season"), el("div", { class: "stat-grid" }, [
    statBox(ovr, "Team Overall"),
    statBox(`${team.wins}-${team.losses}${team.ties ? "-" + team.ties : ""}`, "Record"),
    statBox(team.pf, "Points For"),
    statBox(team.pa, "Points Against"),
    statBox(`$${(S.settings.playerCapLimit - teamCapUsed(team)).toFixed(1)}M`, "Cap Space"),
    statBox(`${team.players.length}/${ROSTER_LIMIT}`, "Roster Size"),
  ])]));

  const actionsPanel = el("div", { class: "panel" }, [el("h3", {}, "Front Office")]);
  const btnRow = el("div", { class: "row-gap" });

  if (S.phase === "preseason") {
    btnRow.appendChild(el("button", { class: "btn btn-primary", onclick: () => { startSeason(); renderAll(); } }, `Kick Off Season ${S.season}`));
  } else if (S.phase === "regular") {
    const games = currentWeekGames();
    const userGame = games.find(g => g.home === team.id || g.away === team.id);
    btnRow.appendChild(el("button", { class: "btn btn-primary", onclick: () => {
      const results = simulateWeek(); renderAll();
      const mine = results.find(g => g.home === team.id || g.away === team.id);
      if (mine) showGameModal(mine);
    } }, `Simulate Week ${S.week}`));
    if (userGame) { const opp = userGame.home === team.id ? userGame.away : userGame.home; actionsPanel.appendChild(el("p", { class: "muted" }, `This week: ${userGame.home === team.id ? "vs" : "@"} ${teamName(opp)}`)); }
    else actionsPanel.appendChild(el("p", { class: "muted" }, "Bye week — no game scheduled."));
  } else if (S.phase === "playoffs") {
    btnRow.appendChild(el("button", { class: "btn btn-primary", onclick: () => {
      simPlayoffRound(); renderAll();
      if (S.playoffs.championsBowl) showGameModal({ ...S.playoffs.championsBowl }, true);
      else setActiveView("league");
    } }, nextPlayoffLabel()));
  } else if (S.phase === "champion") {
    actionsPanel.appendChild(el("p", { class: "muted" }, `🏆 ${teamName(S.history[S.history.length - 1].champion)} won the Season ${S.season} Champions Bowl.`));
    btnRow.appendChild(el("button", { class: "btn btn-primary", onclick: () => { processOffseason(); runDraftUntilUserTurn(); renderAll(); leagueSubTab = "draft"; setActiveView("league"); } }, "Begin Offseason & Draft"));
  } else if (S.phase === "draft") {
    btnRow.appendChild(el("button", { class: "btn btn-primary", onclick: () => { leagueSubTab = "draft"; setActiveView("league"); } }, "Go to Draft Room"));
  } else if (S.phase === "offseason") {
    btnRow.appendChild(el("button", { class: "btn btn-primary", onclick: () => { beginNewSeason(); renderAll(); } }, `Start Season ${S.season + 1}`));
    actionsPanel.appendChild(el("p", { class: "muted" }, "Draft's done — hit free agency or make a trade before kickoff."));
  }
  actionsPanel.appendChild(btnRow);
  root.appendChild(actionsPanel);

  const logPanel = el("div", { class: "panel" }, [el("h3", {}, "Front Office Wire")]);
  if (!S.log.length) logPanel.appendChild(el("p", { class: "muted" }, "Nothing yet."));
  S.log.slice(0, 8).forEach(l => logPanel.appendChild(el("div", { class: "list-row" }, [el("span", {}, l.msg), el("span", { class: "muted" }, `S${l.season}${l.week ? " W" + l.week : ""}`)])));
  root.appendChild(logPanel);
}
function renderOfficeStaff(root) {
  const team = teamById(S.userTeamId);
  root.appendChild(el("p", { class: "section-sub" }, `Staff budget: $${(S.settings.staffCapLimit - teamStaffCost(team)).toFixed(1)}M left of $${S.settings.staffCapLimit}M${S.settings.staffCapOn ? "" : " (off)"}`));
  const roles = [
    ["coach", "Head Coach", [["dev", "Player Development"], ["gameday", "Gameday"]]],
    ["scout", "Chief Scout", [["evaluator", "Evaluator"], ["starSpotter", "Star Spotter"]]],
    ["physio", "Head Physio", [["prevention", "Prevention"], ["rehab", "Rehabilitation"]]],
  ];
  roles.forEach(([role, label, stats]) => {
    const s = team.staff[role];
    const panel = el("div", { class: "panel" });
    panel.appendChild(el("div", { class: "staff-card" }, [
      el("div", {}, [el("div", { class: "staff-role" }, label), el("div", { class: "staff-name" }, s.name)]),
      el("div", { class: "row-gap" }, [
        el("button", { class: "btn btn-ghost btn-sm", onclick: () => showEditStaffModal(team, role, label, stats) }, "Edit"),
        el("button", { class: "btn btn-gold btn-sm", onclick: () => showHireModal(role, label) }, "Scout Candidates"),
      ]),
    ]));
    const grid = el("div", { class: "stat-grid" });
    stats.forEach(([key, l]) => grid.appendChild(el("div", { class: "stat-box" }, [el("div", { class: "stars", html: starString(s[key]) }), el("div", { class: "l" }, l)])));
    panel.appendChild(grid);
    root.appendChild(panel);
  });
}
function showHireModal(role, label) {
  const candidates = generateStaffCandidates(role, 3);
  const statKeys = role === "coach" ? [["dev", "Player Development"], ["gameday", "Gameday"]]
    : role === "scout" ? [["evaluator", "Evaluator"], ["starSpotter", "Star Spotter"]]
    : [["prevention", "Prevention"], ["rehab", "Rehabilitation"]];
  const node = el("div");
  node.appendChild(el("h2", { class: "section-title" }, `${label} Candidates`));
  node.appendChild(el("p", { class: "section-sub" }, "Pick one to hire — this replaces your current hire immediately."));
  candidates.forEach(c => {
    const row = el("div", { class: "candidate-row" }, [
      el("div", {}, [
        el("div", { style: "font-weight:700" }, c.name),
        ...statKeys.map(([key, l]) => el("div", { class: "muted" }, [el("span", { class: "stars", html: starString(c[key]) }), ` ${l}`])),
        el("div", { class: "muted" }, `Cost: $${staffCost(c).toFixed(1)}M`),
      ]),
      el("button", { class: "btn btn-gold btn-sm", onclick: () => { const r = hireStaff(role, c); if (!r.ok) { alert(r.reason); return; } closeModal(); renderOffice(); } }, "Hire"),
    ]);
    node.appendChild(row);
  });
  node.appendChild(el("button", { class: "btn btn-ghost", onclick: closeModal }, "Cancel"));
  showModal(node);
}
function showEditStaffModal(team, role, label, statDefs) {
  const s = team.staff[role];
  const draft = { ...s };
  const node = el("div");
  node.appendChild(el("h2", { class: "section-title" }, `Edit ${label}`));
  node.appendChild(el("p", { class: "section-sub" }, teamName(team.id)));
  const form = el("div", { class: "form-grid" });
  form.appendChild(field("Name", textInput(draft.name, v => draft.name = v)));
  statDefs.forEach(([key, l]) => form.appendChild(field(l + " (1-5)", numInput(draft[key], v => draft[key] = clamp(Math.round(v), 1, 5), { min: 1, max: 5, step: 1 }))));
  node.appendChild(form);
  node.appendChild(el("div", { class: "row-gap", style: "margin-top:14px" }, [
    el("button", { class: "btn btn-primary", onclick: () => { editStaffDirect(team, role, draft); closeModal(); renderView(activeView); } }, "Save"),
    el("button", { class: "btn btn-ghost", onclick: closeModal }, "Cancel"),
  ]));
  showModal(node);
}
function showGameModal(g, isChampionship) {
  const node = el("div");
  node.appendChild(el("h2", { class: "section-title" }, isChampionship ? "Champions Bowl" : "Final"));
  node.appendChild(el("div", { class: "scoreboard" }, [
    el("div", { class: "sb-team" }, [el("div", { class: "nm" }, teamName(g.home)), el("div", { class: "sb-score" }, String(g.homeScore))]),
    el("div", { class: "sb-vs" }, "final"),
    el("div", { class: "sb-team" }, [el("div", { class: "nm" }, teamName(g.away)), el("div", { class: "sb-score" }, String(g.awayScore))]),
  ]));
  const log = el("div", { class: "play-log" });
  (g.log || []).forEach(p => log.appendChild(el("div", { class: "pl-row" }, [el("span", { class: "pl-q" }, `Q${p.q}`), el("span", {}, p.text)])));
  if (!g.log || !g.log.length) log.appendChild(el("p", { class: "muted" }, "A defensive struggle — no major scoring plays logged."));
  node.appendChild(log);
  if (isChampionship) node.appendChild(el("p", {}, `🏆 ${teamName(g.winner)} are champions.`));
  node.appendChild(el("button", { class: "btn btn-primary", onclick: closeModal }, "Close"));
  showModal(node);
}

/* ---- TEAM ---- */
function renderTeam() {
  const root = $("#view-team");
  root.innerHTML = "";
  root.appendChild(el("h2", { class: "section-title" }, "Team"));
  root.appendChild(subTabs([["roster", "Roster"], ["stats", "Stats"], ["caphit", "Cap Hit"], ["schedule", "Schedule"], ["freeagency", "Free Agents"], ["trade", "Trade"]], teamSubTab, (k) => { teamSubTab = k; renderTeam(); }));

  const needsSwitcher = !["freeagency", "trade"].includes(teamSubTab);
  if (needsSwitcher) {
    const sel = selectInput(S.teams.map(t => t.id), currentViewingTeamId(), (v) => { viewingTeamId = v === S.userTeamId ? null : v; renderTeam(); });
    sel.innerHTML = "";
    S.teams.forEach(t => sel.appendChild(el("option", { value: t.id }, `${teamName(t.id)}${t.id === S.userTeamId ? " (you)" : ""}`)));
    sel.value = currentViewingTeamId();
    root.appendChild(el("div", { class: "panel", style: "padding:12px 14px" }, [el("div", { class: "field-label" }, "Viewing team"), sel]));
  } else if (viewingTeamId && viewingTeamId !== S.userTeamId) {
    root.appendChild(el("p", { class: "muted" }, `Trade & Free Agency always act on your team (${teamName(S.userTeamId)}).`));
  }

  if (teamSubTab === "roster") renderRoster(root, currentViewingTeamId());
  else if (teamSubTab === "stats") renderTeamStats(root, currentViewingTeamId());
  else if (teamSubTab === "caphit") renderCapHit(root, currentViewingTeamId());
  else if (teamSubTab === "schedule") renderTeamSchedule(root, currentViewingTeamId());
  else if (teamSubTab === "freeagency") renderFreeAgency(root);
  else renderTrade(root);
}

function renderRoster(root, teamId) {
  const team = teamById(teamId);
  const overLimit = S.settings.rosterLimitOn && team.players.length > ROSTER_LIMIT;
  root.appendChild(el("p", { class: "section-sub" }, `${team.players.length}${S.settings.rosterLimitOn ? "/" + ROSTER_LIMIT : ""} players · Cap used $${teamCapUsed(team).toFixed(1)}M / $${S.settings.playerCapLimit}M${S.settings.playerCapOn ? "" : " (off)"}`));
  if (overLimit) root.appendChild(el("p", {}, el("span", { class: "tag-out" }, `Over the ${ROSTER_LIMIT}-man limit by ${team.players.length - ROSTER_LIMIT} — release players below.`)));
  const chips = el("div", { class: "chip-row" });
  ["ALL", ...POSITIONS].forEach(pos => chips.appendChild(el("button", { class: `chip ${rosterFilter === pos ? "active" : ""}`, onclick: () => { rosterFilter = pos; renderTeam(); } }, pos)));
  root.appendChild(chips);

  const players = team.players.map(id => S.players[id]).filter(p => rosterFilter === "ALL" || p.pos === rosterFilter).sort((a, b) => b.ovr - a.ovr);
  const panel = el("div", { class: "panel" });
  const table = el("table");
  table.appendChild(el("tr", {}, ["Player", "Pos", "Age", "OVR", "POT", "Stat line", "$M", ""].map(h => el("th", { class: ["Age", "OVR", "POT", "$M"].includes(h) ? "num" : "" }, h))));
  const tbody = el("tbody");
  players.forEach(p => {
    tbody.appendChild(el("tr", {}, [
      el("td", {}, [p.name, p.injuredWeeksLeft > 0 ? el("span", { class: "tag-out" }, `OUT ${p.injuredWeeksLeft}w`) : null]),
      el("td", {}, el("span", { class: "pos-badge" }, p.pos)),
      el("td", { class: "num" }, String(p.age)),
      el("td", { class: `num ovr ${ovrClass(p.ovr)}` }, String(p.ovr)),
      el("td", { class: "num" }, String(p.pot)),
      el("td", { class: "muted" }, statLine(p.stats, p.pos)),
      el("td", { class: "num" }, p.salary.toFixed(1)),
      el("td", {}, el("button", { class: "btn btn-ghost btn-sm", onclick: () => showEditPlayerModal(p, () => renderTeam()) }, "Edit")),
    ]));
  });
  table.appendChild(tbody); panel.appendChild(table); root.appendChild(panel);
}

function showEditPlayerModal(p, onSave, opts = {}) {
  const isProspect = !!opts.isProspect;
  const team = p.teamId ? teamById(p.teamId) : null;
  const nameParts = p.name.split(" ");
  const draft = {
    firstName: nameParts[0] || "", lastName: nameParts.slice(1).join(" ") || "",
    college: p.college, jerseyNumber: p.jerseyNumber, age: p.age, pos: p.pos,
    ovr: p.ovr, pot: p.pot, heightIn: p.heightIn, weightLb: p.weightLb,
    speed: p.speed, strength: p.strength, agility: p.agility, injuryProne: p.injuryProne,
    salary: p.salary, bonus: p.bonus, contractYears: p.contractYears, weightContract: p.weightContract,
    scoutLow: p._scoutLow, scoutHigh: p._scoutHigh,
  };
  let tab = "personal";
  const node = el("div");
  node.appendChild(el("h2", { class: "section-title" }, isProspect ? "Edit College Prospect" : "Edit Player"));
  const tabsRow = el("div", { class: "chip-row" });
  const body = el("div");

  function renderTabs() {
    tabsRow.innerHTML = "";
    [["personal", "Personal"], ["skills", "Skills"], ["contract", isProspect ? "Scouting" : "Contract"]].forEach(([k, l]) => {
      tabsRow.appendChild(el("button", { class: `chip ${tab === k ? "active" : ""}`, onclick: () => { tab = k; renderTabs(); renderBody(); } }, l));
    });
  }
  function renderBody() {
    body.innerHTML = "";
    body.appendChild(tab === "personal" ? personalTab() : tab === "skills" ? skillsTab() : contractTab());
  }
  function personalTab() {
    const form = el("div", { class: "form-grid" });
    form.appendChild(field("First Name", textInput(draft.firstName, v => draft.firstName = v)));
    form.appendChild(field("Last Name", textInput(draft.lastName, v => draft.lastName = v)));
    form.appendChild(field("College", textInput(draft.college, v => draft.college = v)));
    form.appendChild(field("Position", selectInput(POSITIONS, draft.pos, v => draft.pos = v)));
    form.appendChild(field("Jersey Number", numInput(draft.jerseyNumber, v => draft.jerseyNumber = clamp(Math.round(v), 0, 99), { min: 0, max: 99 })));
    form.appendChild(field("Age", numInput(draft.age, v => draft.age = Math.round(v), { min: 18, max: 45 })));
    form.appendChild(field("Draft Season", el("div", { class: "muted", style: "padding-top:8px" }, p.draftSeason ? `Season ${p.draftSeason}` : "UDFA")));
    form.appendChild(field("Draft Pick", el("div", { class: "muted", style: "padding-top:8px" }, p.draftPick ? `#${p.draftPick} overall` : "UDFA")));
    if (team) form.appendChild(field("Team", el("div", { class: "muted", style: "padding-top:8px" }, teamName(team.id))));
    return form;
  }
  function skillsTab() {
    const wrap = el("div");
    wrap.appendChild(el("div", { class: "stat-grid", style: "margin-bottom:14px" }, [statBox(draft.ovr, "Overall"), statBox(draft.pot, "Potential")]));
    const form = el("div", { class: "form-grid" });
    form.appendChild(field("Overall (OVR)", numInputWithBounds(draft.ovr, v => { draft.ovr = clamp(Math.round(v), 0, 99); renderBody(); }, { min: 0, max: 99 })));
    form.appendChild(field("Potential (POT)", numInputWithBounds(draft.pot, v => { draft.pot = clamp(Math.round(v), 0, 99); renderBody(); }, { min: 0, max: 99 })));
    form.appendChild(field("Height (in)", numInputWithBounds(draft.heightIn, v => draft.heightIn = Math.round(v), { min: 60, max: 84 })));
    form.appendChild(field("Weight (lb)", numInputWithBounds(draft.weightLb, v => draft.weightLb = Math.round(v), { min: 150, max: 380 })));
    form.appendChild(field("Speed", numInputWithBounds(draft.speed, v => draft.speed = clamp(Math.round(v), 40, 99), { min: 40, max: 99 })));
    form.appendChild(field("Strength", numInputWithBounds(draft.strength, v => draft.strength = clamp(Math.round(v), 40, 99), { min: 40, max: 99 })));
    form.appendChild(field("Agility", numInputWithBounds(draft.agility, v => draft.agility = clamp(Math.round(v), 40, 99), { min: 40, max: 99 })));
    form.appendChild(field("Injury Prone (1=durable, 5=fragile)", numInputWithBounds(draft.injuryProne, v => draft.injuryProne = clamp(Math.round(v), 1, 5), { min: 1, max: 5 })));
    wrap.appendChild(form);
    wrap.appendChild(el("p", { class: "muted", style: "margin-top:12px" }, "Overall and Potential drive the simulation directly. Height/Weight/Speed/Strength/Agility are descriptive for now — Injury Prone is the one sub-attribute that actually affects how often this player gets hurt. Min/Max jump straight to each stat's floor or ceiling."));
    return wrap;
  }
  function contractTab() {
    const wrap = el("div");
    if (isProspect) {
      const form = el("div", { class: "form-grid" });
      form.appendChild(field("Scouted Low", numInput(draft.scoutLow, v => draft.scoutLow = clamp(Math.round(v), 0, 99), { min: 0, max: 99 })));
      form.appendChild(field("Scouted High", numInput(draft.scoutHigh, v => draft.scoutHigh = clamp(Math.round(v), 0, 99), { min: 0, max: 99 })));
      wrap.appendChild(form);
      wrap.appendChild(el("p", { class: "muted", style: "margin-top:10px" }, "This is the range shown to you on draft day — it's separate from the player's true (hidden) Overall on the Skills tab."));
      return wrap;
    }
    const form = el("div", { class: "form-grid" });
    form.appendChild(field("Salary ($M/yr avg)", numInput(draft.salary, v => draft.salary = Math.max(0, v), { min: 0, step: 0.1 })));
    form.appendChild(field("Signing Bonus ($M total)", numInput(draft.bonus, v => draft.bonus = Math.max(0, v), { min: 0, step: 0.1 })));
    form.appendChild(field("Contract Years", numInput(draft.contractYears, v => { draft.contractYears = Math.max(0, Math.round(v)); renderBody(); }, { min: 0, max: 7 })));
    form.appendChild(field("Contract Shape", selectInput(["Front", "Balanced", "Back"], draft.weightContract, v => { draft.weightContract = v; renderBody(); })));
    wrap.appendChild(form);

    const table = el("table", { style: "margin-top:14px" });
    table.appendChild(el("tr", {}, ["Year", "Salary", "Bonus", "Cap Hit"].map(h => el("th", { class: h === "Year" ? "" : "num" }, h))));
    const tbody = el("tbody");
    contractBreakdown(draft).forEach(row => {
      tbody.appendChild(el("tr", {}, [el("td", {}, row.yearLabel), el("td", { class: "num" }, `$${row.salary.toFixed(1)}M`), el("td", { class: "num" }, `$${row.bonus.toFixed(1)}M`), el("td", { class: "num" }, `$${row.capHit.toFixed(1)}M`)]));
    });
    table.appendChild(tbody);
    wrap.appendChild(table);

    if (team) {
      wrap.appendChild(el("div", { style: "margin-top:16px" }, [
        el("button", { class: "btn btn-danger", onclick: () => {
          if (confirmish(`Release ${p.name}? This ends the contract and cuts them from ${teamName(team.id)}.`)) {
            releasePlayer(team.id, p.id); closeModal(); onSave();
          }
        } }, "Cut Player"),
      ]));
    }
    return wrap;
  }

  renderTabs(); renderBody();
  node.appendChild(tabsRow); node.appendChild(body);
  node.appendChild(el("div", { class: "row-gap", style: "margin-top:14px" }, [
    el("button", { class: "btn btn-primary", onclick: () => {
      const newName = `${draft.firstName} ${draft.lastName}`.trim() || p.name;
      Object.assign(p, {
        name: newName, pos: draft.pos, college: draft.college, jerseyNumber: draft.jerseyNumber, age: draft.age,
        ovr: draft.ovr, pot: draft.pot, heightIn: draft.heightIn, weightLb: draft.weightLb,
        speed: draft.speed, strength: draft.strength, agility: draft.agility, injuryProne: draft.injuryProne,
      });
      if (isProspect) { p._scoutLow = draft.scoutLow; p._scoutHigh = draft.scoutHigh; }
      else { p.salary = draft.salary; p.bonus = draft.bonus; p.contractYears = draft.contractYears; p.weightContract = draft.weightContract; p.salaryOverride = true; }
      addLog(`Edited ${isProspect ? "prospect" : "player"} ${p.name}.`); saveGame(); closeModal(); onSave();
    } }, "Save Changes"),
    el("button", { class: "btn btn-ghost", onclick: closeModal }, "Cancel"),
  ]));
  showModal(node);
}

function renderTeamStats(root, teamId) {
  const team = teamById(teamId);
  const players = team.players.map(id => S.players[id]).sort((a, b) => b.ovr - a.ovr);
  const panel = el("div", { class: "panel" }, [el("h3", {}, `Season ${S.season} Stats`)]);
  const table = el("table");
  table.appendChild(el("tr", {}, ["Player", "Pos", "GP", "Stat line"].map(h => el("th", { class: h === "GP" ? "num" : "" }, h))));
  const tbody = el("tbody");
  players.forEach(p => tbody.appendChild(el("tr", {}, [el("td", {}, p.name), el("td", {}, el("span", { class: "pos-badge" }, p.pos)), el("td", { class: "num" }, String(p.stats.gp)), el("td", {}, statLine(p.stats, p.pos))])));
  table.appendChild(tbody); panel.appendChild(table); root.appendChild(panel);

  const careerPanel = el("div", { class: "panel" }, [el("h3", {}, "Career Totals (this roster)")]);
  const ctable = el("table");
  ctable.appendChild(el("tr", {}, ["Player", "Pos", "GP", "Career line"].map(h => el("th", { class: h === "GP" ? "num" : "" }, h))));
  const cbody = el("tbody");
  players.forEach(p => cbody.appendChild(el("tr", {}, [el("td", {}, p.name), el("td", {}, el("span", { class: "pos-badge" }, p.pos)), el("td", { class: "num" }, String(p.career.gp)), el("td", {}, statLine(p.career, p.pos))])));
  ctable.appendChild(cbody); careerPanel.appendChild(ctable); root.appendChild(careerPanel);
}

function renderCapHit(root, teamId) {
  const team = teamById(teamId);
  root.appendChild(el("p", { class: "section-sub" }, `Total cap hit: $${teamCapUsed(team).toFixed(1)}M of $${S.settings.playerCapLimit}M${S.settings.playerCapOn ? "" : " (cap off)"}`));
  const panel = el("div", { class: "panel" });
  const table = el("table");
  table.appendChild(el("tr", {}, ["Player", "Pos", "Yrs Left", "Salary", "Bonus", "Cap Hit"].map(h => el("th", { class: h === "Player" || h === "Pos" ? "" : "num" }, h))));
  const tbody = el("tbody");
  team.players.map(id => S.players[id]).sort((a, b) => (b.salary + b.bonus / Math.max(1, b.contractYears)) - (a.salary + a.bonus / Math.max(1, a.contractYears))).forEach(p => {
    const capHit = p.salary + (p.contractYears > 0 ? p.bonus / p.contractYears : 0);
    tbody.appendChild(el("tr", {}, [
      el("td", {}, p.name), el("td", {}, el("span", { class: "pos-badge" }, p.pos)), el("td", { class: "num" }, String(p.contractYears)),
      el("td", { class: "num" }, `$${p.salary.toFixed(1)}M`), el("td", { class: "num" }, `$${p.bonus.toFixed(1)}M`), el("td", { class: "num" }, `$${capHit.toFixed(1)}M`),
    ]));
  });
  table.appendChild(tbody); panel.appendChild(table); root.appendChild(panel);
}

function renderTeamSchedule(root, teamId) {
  const team = teamById(teamId);
  const panel = el("div", { class: "panel" });
  S.schedule.forEach(wk => {
    const g = wk.games.find(x => x.home === team.id || x.away === team.id);
    if (!g) { panel.appendChild(el("div", { class: "list-row" }, [el("span", {}, `Week ${wk.week}`), el("span", { class: "muted" }, "BYE")])); return; }
    const isHome = g.home === team.id, opp = isHome ? g.away : g.home;
    const row = el("div", { class: "list-row" }, [
      el("span", {}, `Week ${wk.week} — ${isHome ? "vs" : "@"} ${teamName(opp)}`),
      el("span", { class: "muted num" }, g.played ? `${g.homeScore}–${g.awayScore}` : "—"),
    ]);
    if (g.played) { row.style.cursor = "pointer"; row.addEventListener("click", () => showGameModal(g)); }
    panel.appendChild(row);
  });
  root.appendChild(panel);
}

function renderFreeAgency(root) {
  const team = teamById(S.userTeamId);
  root.appendChild(el("p", { class: "section-sub" }, `Cap space: $${(S.settings.playerCapLimit - teamCapUsed(team)).toFixed(1)}M${S.settings.playerCapOn ? "" : " (cap off)"} · Roster ${team.players.length}${S.settings.rosterLimitOn ? "/" + ROSTER_LIMIT : ""}`));
  const chips = el("div", { class: "chip-row" });
  ["ALL", ...POSITIONS].forEach(pos => chips.appendChild(el("button", { class: `chip ${faFilter === pos ? "active" : ""}`, onclick: () => { faFilter = pos; renderTeam(); } }, pos)));
  root.appendChild(chips);
  const list = S.freeAgents.map(id => S.players[id]).filter(Boolean).filter(p => faFilter === "ALL" || p.pos === faFilter).sort((a, b) => b.ovr - a.ovr);
  const panel = el("div", { class: "panel" });
  if (!list.length) panel.appendChild(el("div", { class: "empty-state" }, "No free agents match that filter."));
  list.forEach(p => {
    panel.appendChild(el("div", { class: "list-row" }, [
      el("div", {}, [el("span", { class: "pos-badge" }, p.pos), " ", el("strong", {}, p.name), el("span", { class: "muted" }, ` · Age ${p.age} · OVR `), el("span", { class: `ovr ${ovrClass(p.ovr)}` }, p.ovr), el("span", { class: "muted" }, ` · $${p.salary.toFixed(1)}M`)]),
      el("button", { class: "btn btn-gold btn-sm", onclick: () => { const r = signFreeAgent(p.id); if (!r.ok) alert(r.reason); renderTeam(); } }, "Sign"),
    ]));
  });
  root.appendChild(panel);
}

function renderTrade(root) {
  root.appendChild(el("p", { class: "section-sub" }, "Pick a team, then choose players from both sides to swap."));
  const teamSel = el("select");
  teamSel.appendChild(el("option", { value: "" }, "Choose a team..."));
  S.teams.filter(t => t.id !== S.userTeamId).forEach(t => teamSel.appendChild(el("option", { value: t.id }, teamName(t.id))));
  if (tradeTargetId) teamSel.value = tradeTargetId;
  teamSel.addEventListener("change", (e) => { tradeTargetId = e.target.value || null; tradeOffer.clear(); tradeRequest.clear(); renderTeam(); });
  root.appendChild(el("div", { class: "panel" }, [el("h3", {}, "Trade Partner"), teamSel]));
  if (!tradeTargetId) return;
  const me = teamById(S.userTeamId), them = teamById(tradeTargetId);
  const cols = el("div", { style: "display:grid; grid-template-columns:1fr 1fr; gap:16px;" });
  cols.appendChild(tradeColumn(`You send (${teamName(me.id)})`, me, tradeOffer));
  cols.appendChild(tradeColumn(`You get (${teamName(them.id)})`, them, tradeRequest));
  root.appendChild(cols);
  const actionPanel = el("div", { class: "panel" });
  actionPanel.appendChild(el("button", { class: "btn btn-primary", onclick: () => {
    if (!tradeOffer.size || !tradeRequest.size) { alert("Select at least one player on each side."); return; }
    const res = proposeTrade(tradeTargetId, [...tradeOffer], [...tradeRequest]);
    if (res.blocked) { alert(res.reason); return; }
    alert(res.accepted ? "Trade accepted!" : `${teamName(tradeTargetId)} rejected the offer (they value their side at ${res.reqVal} vs your ${res.offerVal}).`);
    if (res.accepted) { tradeOffer.clear(); tradeRequest.clear(); }
    renderTeam();
  } }, "Propose Trade"));
  root.appendChild(actionPanel);
}
function tradeColumn(title, team, selectedSet) {
  const panel = el("div", { class: "panel" }, [el("h3", {}, title)]);
  team.players.map(id => S.players[id]).sort((a, b) => b.ovr - a.ovr).forEach(p => {
    const row = el("label", { class: "list-row", style: "cursor:pointer" }, [
      el("span", {}, [el("span", { class: "pos-badge" }, p.pos), " ", p.name, el("span", { class: "muted" }, ` OVR ${p.ovr}`)]),
      el("input", { type: "checkbox", ...(selectedSet.has(p.id) ? { checked: "checked" } : {}) }),
    ]);
    row.querySelector("input").addEventListener("change", (e) => { if (e.target.checked) selectedSet.add(p.id); else selectedSet.delete(p.id); });
    panel.appendChild(row);
  });
  return panel;
}

/* ---- LEAGUE ---- */
function renderLeague() {
  const root = $("#view-league");
  root.innerHTML = "";
  root.appendChild(el("h2", { class: "section-title" }, "League"));
  root.appendChild(subTabs([["standings", "Standings"], ["playoffs", "Playoffs"], ["draft", "Draft"], ["hof", "Hall of Fame"]], leagueSubTab, (k) => { leagueSubTab = k; renderLeague(); }));
  if (leagueSubTab === "standings") renderStandings(root);
  else if (leagueSubTab === "playoffs") renderPlayoffs(root);
  else if (leagueSubTab === "draft") renderDraft(root);
  else renderHallOfFame(root);
}
function renderStandings(root) {
  CONFERENCES.forEach(conf => {
    const confPanel = el("div", { class: "panel" });
    confPanel.appendChild(el("h3", {}, `${conf} Conference`));
    DIVISIONS.forEach(div => {
      confPanel.appendChild(el("p", { class: "muted", style: "margin:10px 0 4px" }, `${div} Division`));
      const table = el("table");
      table.appendChild(el("tr", {}, ["Team", "W", "L", "T", "PF", "PA"].map(h => el("th", { class: h === "Team" ? "" : "num" }, h))));
      const tbody = el("tbody");
      sortByRecord(S.teams.filter(t => t.conference === conf && t.division === div)).forEach(t => {
        tbody.appendChild(el("tr", {}, [
          el("td", {}, `${teamName(t.id)}${t.id === S.userTeamId ? " ★" : ""}`),
          el("td", { class: "num" }, String(t.wins)), el("td", { class: "num" }, String(t.losses)), el("td", { class: "num" }, String(t.ties)),
          el("td", { class: "num" }, String(t.pf)), el("td", { class: "num" }, String(t.pa)),
        ]));
      });
      table.appendChild(tbody); confPanel.appendChild(table);
    });
    root.appendChild(confPanel);
  });
}
function renderPlayoffs(root) {
  if (!S.playoffs) { root.appendChild(el("div", { class: "empty-state" }, "Playoffs open once the regular season wraps up.")); return; }
  const po = S.playoffs;
  CONFERENCES.forEach(conf => {
    const c = po.conferences[conf];
    const panel = el("div", { class: "panel" });
    panel.appendChild(el("h3", {}, `${conf} Conference`));
    panel.appendChild(el("p", { class: "muted" }, "Seeds: " + c.seeds.map((id, i) => `#${i + 1} ${teamName(id)}`).join(" · ")));
    if (c.wildcard) {
      const round = el("div", { class: "bracket-round" }, [el("h4", {}, "Wildcard")]);
      round.appendChild(bracketGameRow(`#1 ${teamName(c.wildcard.byeTeam)}`, "BYE", c.wildcard.byeTeam));
      c.wildcard.games.forEach(g => round.appendChild(bracketGameRow(`#${g.seedA} ${teamName(g.home)} ${g.homeScore}`, `${g.awayScore} ${teamName(g.away)} #${g.seedB}`, g.winner)));
      panel.appendChild(round);
    }
    if (c.divisional) {
      const round = el("div", { class: "bracket-round" }, [el("h4", {}, "Divisional")]);
      c.divisional.forEach(g => round.appendChild(bracketGameRow(`#${g.seedA} ${teamName(g.home)} ${g.homeScore}`, `${g.awayScore} ${teamName(g.away)} #${g.seedB}`, g.winner)));
      panel.appendChild(round);
    }
    if (c.championship) {
      const round = el("div", { class: "bracket-round" }, [el("h4", {}, "Conference Championship")]);
      round.appendChild(bracketGameRow(`${teamName(c.championship.home)} ${c.championship.homeScore}`, `${c.championship.awayScore} ${teamName(c.championship.away)}`, c.championship.winner));
      panel.appendChild(round);
    }
    root.appendChild(panel);
  });
  if (po.championsBowl) {
    const panel = el("div", { class: "panel" }, [el("h3", {}, "🏆 Champions Bowl")]);
    panel.appendChild(bracketGameRow(`${teamName(po.championsBowl.home)} ${po.championsBowl.homeScore}`, `${po.championsBowl.awayScore} ${teamName(po.championsBowl.away)}`, po.championsBowl.winner));
    root.appendChild(panel);
  }
}
function bracketGameRow(leftText, rightText, winnerId) {
  return el("div", { class: "bracket-game" }, [
    el("span", { class: winnerId && leftText.includes(teamName(winnerId)) ? "winner" : "" }, leftText),
    el("span", { class: winnerId && rightText.includes(teamName(winnerId)) ? "winner" : "" }, rightText),
  ]);
}
function renderDraft(root) {
  if (!S.draft) { root.appendChild(el("div", { class: "empty-state" }, "No draft in progress. It opens after the Champions Bowl.")); return; }
  const d = S.draft;
  const onClock = draftOnClockTeam();
  if (!onClock) {
    root.appendChild(el("p", { class: "section-sub" }, "Draft complete."));
    root.appendChild(el("button", { class: "btn btn-primary", onclick: () => { finishDraftIfDone(); renderAll(); setActiveView("office"); } }, "Head to Free Agency"));
  } else {
    const pickNum = d.pickIndex + 1;
    const round = Math.floor(d.pickIndex / (d.order.length / d.rounds)) + 1;
    root.appendChild(el("p", { class: "section-sub" }, `Round ${round} · Pick ${pickNum} of ${d.order.length} — on the clock: ${teamName(onClock)}`));
    if (onClock === S.userTeamId) {
      const list = el("div");
      d.class.slice().sort((a, b) => (S.players[b]._scoutHigh + S.players[b]._scoutLow) - (S.players[a]._scoutHigh + S.players[a]._scoutLow)).forEach(id => {
        const p = S.players[id];
        list.appendChild(el("div", { class: "draft-card on-clock" }, [
          el("span", { class: "pos-badge" }, p.pos),
          el("div", { style: "flex:1" }, [
            el("div", { style: "font-weight:700" }, [p.name, p._gem ? el("span", { class: "tag-out", style: "background:rgba(201,201,201,0.2); color:var(--gold-lt)" }, "SCOUTS LOVE HIM") : null]),
            el("div", { class: "muted" }, `Age ${p.age} · Scouted ${p._scoutLow}-${p._scoutHigh} · Grade ${grade((p._scoutLow + p._scoutHigh) / 2 + p.pot * 0.15)}`),
          ]),
          el("div", { class: "row-gap" }, [
            el("button", { class: "btn btn-ghost btn-sm", onclick: () => showEditPlayerModal(p, () => renderDraft(root.parentElement || root), { isProspect: true }) }, "Edit"),
            el("button", { class: "btn btn-gold btn-sm", onclick: () => { makeDraftPick(p.id); runDraftUntilUserTurn(); renderAll(); } }, "Draft"),
          ]),
        ]));
      });
      root.appendChild(list);
    } else {
      root.appendChild(el("button", { class: "btn btn-primary", onclick: () => { runDraftUntilUserTurn(); renderAll(); } }, "Advance CPU Picks"));
    }
  }
  if (d.picks.length) {
    const panel = el("div", { class: "panel" }, [el("h3", {}, "Picks So Far")]);
    d.picks.slice().reverse().slice(0, 14).forEach(pk => {
      const p = S.players[pk.playerId];
      panel.appendChild(el("div", { class: "list-row" }, [el("span", {}, `R${pk.round} — ${teamName(pk.teamId)} select ${p.name} (${p.pos})`), el("span", { class: "muted" }, `OVR ${p.ovr}`)]));
    });
    root.appendChild(panel);
  }
}
function renderHallOfFame(root) {
  root.appendChild(el("p", { class: "section-sub" }, "Career-stat-based induction — no vote, just the numbers."));
  const panel = el("div", { class: "panel" });
  if (!S.hallOfFame.length) { panel.appendChild(el("div", { class: "empty-state" }, "No inductees yet. Play out some careers.")); root.appendChild(panel); return; }
  const table = el("table");
  table.appendChild(el("tr", {}, ["Player", "Pos", "Inducted", "Score", "Career line"].map(h => el("th", { class: h === "Score" || h === "Inducted" ? "num" : "" }, h))));
  const tbody = el("tbody");
  S.hallOfFame.slice().sort((a, b) => b.score - a.score).forEach(h => {
    tbody.appendChild(el("tr", {}, [
      el("td", {}, h.name), el("td", {}, el("span", { class: "pos-badge" }, h.pos)),
      el("td", { class: "num" }, `S${h.inductedSeason}`), el("td", { class: "num ovr ovr-elite" }, String(h.score)),
      el("td", {}, statLine(h.career, h.pos)),
    ]));
  });
  table.appendChild(tbody); panel.appendChild(table); root.appendChild(panel);
}

/* ---- NEWS ---- */
const SOCIAL_HANDLES = ["@GridironGuru", "@FourthAndLong", "@DeepBallDaily", "@TheBlitzReport", "@EndZoneEcho", "@RedZoneRadar"];
function renderNews() {
  const root = $("#view-news");
  root.innerHTML = "";
  root.appendChild(el("h2", { class: "section-title" }, "News"));
  root.appendChild(el("p", { class: "section-sub" }, "Front office wire, plus league chatter generated from recent results."));

  if (S.lastWeekAwards && (S.lastWeekAwards.offense || S.lastWeekAwards.defense)) {
    const awardsPanel = el("div", { class: "panel" }, [el("h3", {}, `Week ${S.lastWeekAwards.week} Standouts`)]);
    const off = S.lastWeekAwards.offense, def = S.lastWeekAwards.defense;
    const offPlayer = off ? S.players[off.playerId] : null;
    const defPlayer = def ? S.players[def.playerId] : null;
    if (offPlayer) {
      awardsPanel.appendChild(el("div", { class: "list-row" }, [
        el("span", {}, [el("strong", {}, "Offensive Player of the Week — "), `${offPlayer.name} (${offPlayer.pos}, ${teamName(off.teamId)})`]),
        el("span", { class: "muted" }, offenseAwardLine(off)),
      ]));
    }
    if (defPlayer) {
      awardsPanel.appendChild(el("div", { class: "list-row" }, [
        el("span", {}, [el("strong", {}, "Defensive Player of the Week — "), `${defPlayer.name} (${defPlayer.pos}, ${teamName(def.teamId)})`]),
        el("span", { class: "muted" }, defenseAwardLine(def)),
      ]));
    }
    if (offPlayer || defPlayer) root.appendChild(awardsPanel);
  }

  const panel = el("div", { class: "panel" }, [el("h3", {}, "The Wire")]);
  if (!S.log.length) panel.appendChild(el("p", { class: "muted" }, "Nothing yet."));
  S.log.slice(0, 20).forEach(l => panel.appendChild(el("div", { class: "list-row" }, [el("span", {}, l.msg), el("span", { class: "muted" }, `S${l.season}${l.week ? " W" + l.week : ""}`)])));
  root.appendChild(panel);
  const socialPanel = el("div", { class: "panel" }, [el("h3", {}, "Social")]);
  const posts = buildSocialPosts();
  if (!posts.length) socialPanel.appendChild(el("p", { class: "muted" }, "Quiet out there — play a week to generate some chatter."));
  posts.forEach(post => socialPanel.appendChild(el("div", { class: "list-row" }, [el("span", {}, [el("strong", {}, post.handle + " "), post.text]), el("span", { class: "muted" }, post.tag)])));
  root.appendChild(socialPanel);
}
function offenseAwardLine(o) {
  const parts = [];
  if (o.att > 0) parts.push(`${o.comp}/${o.att}, ${o.passYds} yd, ${o.passTD} TD${o.ints ? `, ${o.ints} INT` : ""}`);
  if (o.rushAtt > 0) parts.push(`${o.rushAtt} car, ${o.rushYds} yd, ${o.rushTD} TD`);
  if (o.rec > 0) parts.push(`${o.rec} rec, ${o.recYds} yd, ${o.recTD} TD`);
  return parts.join(" · ") || "—";
}
function defenseAwardLine(d) { return `${d.tkl} tkl, ${d.sacks} sk, ${d.ints} INT, ${d.ff} FF, ${d.pd} PD`; }
function buildSocialPosts() {
  const posts = [];
  const lastWeek = S.schedule.filter(w => w.games.some(g => g.played)).slice(-1)[0];
  if (!lastWeek) return posts;
  lastWeek.games.filter(g => g.played).forEach(g => {
    const scorers = (g.log || []).filter(p => p.text.startsWith("TD"));
    if (!scorers.length) return;
    const pick = choice(scorers);
    posts.push({ handle: choice(SOCIAL_HANDLES), text: `${pick.text.replace("TD — ", "")} 🔥`, tag: `Wk ${lastWeek.week}` });
  });
  return shuffle(posts).slice(0, 8);
}

/* ---- SETTINGS ---- */
function renderSettings() {
  const root = $("#view-settings");
  root.innerHTML = "";
  root.appendChild(el("h2", { class: "section-title" }, "Settings"));
  root.appendChild(subTabs([["difficulty", "Difficulty"], ["editplayers", "Edit Players"], ["editstaff", "Edit Staff"], ["cloud", "Cloud Sync"]], settingsSubTab, (k) => { settingsSubTab = k; renderSettings(); }));
  if (settingsSubTab === "difficulty") renderSettingsDifficulty(root);
  else if (settingsSubTab === "editplayers") renderEditPlayers(root);
  else if (settingsSubTab === "editstaff") renderEditStaffScreen(root);
  else renderCloudSync(root);
}
function renderCloudSync(root) {
  const cfg = loadCloudConfig();
  root.appendChild(el("p", { class: "section-sub" }, "Mirror your save to a private GitHub Gist so the same franchise shows up on every device that opens this URL."));

  const warnPanel = el("div", { class: "panel" }, [el("h3", {}, "Before you connect")]);
  warnPanel.appendChild(el("p", { class: "muted" }, "You'll need a GitHub personal access token. Create one at github.com → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token. Check only the \"gist\" box — nothing else — then copy the token."));
  warnPanel.appendChild(el("p", { class: "muted" }, "The token is stored only in this browser's local storage (never in your Export Save file). A \"secret\" Gist isn't truly private — anyone with the exact Gist ID/URL could view your save — but it's unlisted and won't contain anything sensitive beyond your franchise data."));
  root.appendChild(warnPanel);

  if (!cfg) {
    const setupPanel = el("div", { class: "panel" }, [el("h3", {}, "Connect")]);
    const tokenInput = el("input", { type: "password", placeholder: "GitHub personal access token (gist scope)" });
    const gistInput = el("input", { type: "text", placeholder: "Existing Gist ID (only needed to join a save from another device)" });
    setupPanel.appendChild(field("Personal Access Token", tokenInput));
    setupPanel.appendChild(el("div", { style: "height:10px" }));
    setupPanel.appendChild(field("Gist ID (optional)", gistInput));
    const statusLine = el("p", { class: "muted", style: "margin-top:10px" }, "");
    setupPanel.appendChild(statusLine);
    setupPanel.appendChild(el("div", { class: "row-gap", style: "margin-top:10px" }, [
      el("button", { class: "btn btn-primary", onclick: async () => {
        const token = tokenInput.value.trim(); if (!token) { statusLine.textContent = "Enter a token first."; return; }
        statusLine.textContent = "Creating cloud save…";
        try { const id = await cloudCreate(token); statusLine.textContent = `Connected! Gist ID: ${id}`; renderSettings(); }
        catch (e) { statusLine.textContent = e.message; }
      } }, "Create New Cloud Save"),
      el("button", { class: "btn btn-ghost", onclick: async () => {
        const token = tokenInput.value.trim(); const gistId = gistInput.value.trim();
        if (!token || !gistId) { statusLine.textContent = "Enter both the token and the Gist ID from your other device."; return; }
        statusLine.textContent = "Connecting…";
        try {
          const remote = await cloudPull(token, gistId);
          saveCloudConfig({ token, gistId });
          if (confirmish("Load the franchise from that Gist now? (Cancel keeps what's on this device and will overwrite the cloud save on next sync.)")) {
            S = migrateSettings(remote); saveGame(); enterMainApp();
          } else { renderSettings(); }
        } catch (e) { statusLine.textContent = e.message; }
      } }, "Connect to Existing"),
    ]));
    root.appendChild(setupPanel);
    return;
  }

  const statePanel = el("div", { class: "panel" }, [el("h3", {}, "Connected")]);
  statePanel.appendChild(el("div", { class: "stat-grid" }, [
    statBox(cfg.gistId, "Gist ID"),
    statBox(cloudStatus.state === "idle" ? "Ready" : cloudStatus.message, "Status"),
  ]));
  statePanel.appendChild(el("p", { class: "muted", style: "margin-top:10px" }, `View it at gist.github.com/${cfg.gistId} — copy this Gist ID plus your token to any other device's Cloud Sync screen and tap "Connect to Existing" to link the same save.`));
  statePanel.appendChild(el("div", { class: "row-gap", style: "margin-top:12px" }, [
    el("button", { class: "btn btn-primary", onclick: async () => {
      cloudStatus = { state: "syncing", message: "Syncing…" }; renderSettings();
      try { await cloudPush(cfg.token, cfg.gistId, S); cloudStatus = { state: "ok", message: `Synced ${new Date().toLocaleTimeString()}` }; }
      catch (e) { cloudStatus = { state: "error", message: e.message }; }
      renderSettings();
    } }, "Sync Now"),
    el("button", { class: "btn btn-ghost", onclick: async () => {
      if (!confirmish("Pull the cloud save and replace what's on this device?")) return;
      try { const remote = await cloudPull(cfg.token, cfg.gistId); S = migrateSettings(remote); saveGame(); enterMainApp(); }
      catch (e) { cloudStatus = { state: "error", message: e.message }; renderSettings(); }
    } }, "Pull Latest"),
    el("button", { class: "btn btn-danger", onclick: () => { if (confirmish("Disconnect cloud sync on this device? Your Gist itself is not deleted.")) { clearCloudConfig(); renderSettings(); } } }, "Disconnect"),
  ]));
  root.appendChild(statePanel);
}
function renderSettingsDifficulty(root) {
  root.appendChild(el("p", { class: "section-sub" }, "Difficulty affects injuries and scouting accuracy. Caps and roster size are yours to set."));
  const panel = el("div", { class: "panel" }, [el("h3", {}, "Difficulty Preset")]);
  const presetRow = el("div", { class: "chip-row" });
  ["Easy", "Medium", "Hard"].forEach(preset => presetRow.appendChild(el("button", { class: `chip ${S.settings.difficulty === preset ? "active" : ""}`, onclick: () => { applyPreset(preset); renderSettings(); } }, preset)));
  presetRow.appendChild(el("button", { class: `chip ${S.settings.difficulty === "Custom" ? "active" : ""}` }, "Custom"));
  panel.appendChild(presetRow);
  root.appendChild(panel);

  root.appendChild(settingChipRow("Injury Likelihood", "injuryLikelihood", ["None", "Low", "Medium", "High"]));
  root.appendChild(settingChipRow("Scout Accuracy", "scoutAccuracy", ["High", "Medium", "Low"]));

  const capPanel = el("div", { class: "panel" }, [el("h3", {}, "Player Salary Cap")]);
  capPanel.appendChild(toggleRow(S.settings.playerCapOn, v => { S.settings.playerCapOn = v; S.settings.difficulty = "Custom"; saveGame(); renderSettings(); }));
  capPanel.appendChild(field("Cap limit ($M)", numInput(S.settings.playerCapLimit, v => { S.settings.playerCapLimit = Math.max(0, v); S.settings.difficulty = "Custom"; saveGame(); }, { min: 0, step: 5 })));
  root.appendChild(capPanel);

  const staffCapPanel = el("div", { class: "panel" }, [el("h3", {}, "Staff Budget")]);
  staffCapPanel.appendChild(toggleRow(S.settings.staffCapOn, v => { S.settings.staffCapOn = v; S.settings.difficulty = "Custom"; saveGame(); renderSettings(); }));
  staffCapPanel.appendChild(field("Budget limit ($M)", numInput(S.settings.staffCapLimit, v => { S.settings.staffCapLimit = Math.max(0, v); S.settings.difficulty = "Custom"; saveGame(); }, { min: 0, step: 1 })));
  root.appendChild(staffCapPanel);

  const rosterPanel = el("div", { class: "panel" }, [el("h3", {}, `Roster Limit (${ROSTER_LIMIT}-man)`)]);
  rosterPanel.appendChild(toggleRow(S.settings.rosterLimitOn, v => { S.settings.rosterLimitOn = v; S.settings.difficulty = "Custom"; saveGame(); renderSettings(); }));
  root.appendChild(rosterPanel);

  const dataPanel = el("div", { class: "panel" }, [el("h3", {}, "Save Data")]);
  dataPanel.appendChild(el("div", { class: "row-gap" }, [
    el("button", { class: "btn btn-ghost", onclick: exportSave }, "Export Save"),
    el("button", { class: "btn btn-ghost", onclick: triggerImport }, "Import Save"),
    el("button", { class: "btn btn-danger", onclick: resetFranchise }, "New Franchise"),
  ]));
  root.appendChild(dataPanel);
}
function toggleRow(value, onChange) {
  const row = el("div", { class: "chip-row" });
  ["On", "Off"].forEach(v => row.appendChild(el("button", { class: `chip ${(value ? "On" : "Off") === v ? "active" : ""}`, onclick: () => onChange(v === "On") }, v)));
  return row;
}
function settingChipRow(label, key, options) {
  const panel = el("div", { class: "panel" }, [el("h3", {}, label)]);
  const row = el("div", { class: "chip-row" });
  options.forEach(opt => row.appendChild(el("button", { class: `chip ${S.settings[key] === opt ? "active" : ""}`, onclick: () => { S.settings[key] = opt; S.settings.difficulty = "Custom"; saveGame(); renderSettings(); } }, opt)));
  panel.appendChild(row);
  return panel;
}
function applyPreset(preset) {
  S.settings.difficulty = preset;
  if (preset === "Easy") Object.assign(S.settings, { injuryLikelihood: "None", scoutAccuracy: "High", playerCapOn: false, staffCapOn: false });
  else if (preset === "Medium") Object.assign(S.settings, { injuryLikelihood: "Low", scoutAccuracy: "Medium", playerCapOn: true, staffCapOn: true });
  else if (preset === "Hard") Object.assign(S.settings, { injuryLikelihood: "High", scoutAccuracy: "Low", playerCapOn: true, staffCapOn: true });
  saveGame();
}
function exportSave() { downloadJSON(S, `gridiron-office-s${S.season}.json`); }
function triggerImport() { $("#file-import").click(); }
function resetFranchise() { if (confirmish("Start a brand new franchise? This erases your current save.")) { localStorage.removeItem(SAVE_KEY); location.reload(); } }

function renderEditPlayers(root) {
  if (!editPlayersTeamId) editPlayersTeamId = S.userTeamId;
  root.appendChild(el("p", { class: "section-sub" }, "Edit any team's active roster, or the current college draft class."));
  const modeRow = el("div", { class: "chip-row" });
  [["roster", "NFL Rosters"], ["prospects", "College Prospects"]].forEach(([k, l]) => modeRow.appendChild(el("button", { class: `chip ${editPlayersMode === k ? "active" : ""}`, onclick: () => { editPlayersMode = k; renderSettings(); } }, l)));
  root.appendChild(modeRow);

  if (editPlayersMode === "roster") {
    const sel = el("select");
    S.teams.forEach(t => sel.appendChild(el("option", { value: t.id }, teamName(t.id))));
    sel.value = editPlayersTeamId;
    sel.addEventListener("change", (e) => { editPlayersTeamId = e.target.value; renderSettings(); });
    root.appendChild(el("div", { class: "panel", style: "padding:12px 14px" }, [el("div", { class: "field-label" }, "Team"), sel]));
    renderRoster(root, editPlayersTeamId);
  } else {
    if (!S.draft) { root.appendChild(el("div", { class: "empty-state" }, "No active draft class — starts after the Champions Bowl.")); return; }
    const panel = el("div", { class: "panel" });
    const table = el("table");
    table.appendChild(el("tr", {}, ["Prospect", "Pos", "Age", "Scouted", ""].map(h => el("th", { class: h === "Age" ? "num" : "" }, h))));
    const tbody = el("tbody");
    S.draft.class.map(id => S.players[id]).forEach(p => {
      tbody.appendChild(el("tr", {}, [
        el("td", {}, p.name), el("td", {}, el("span", { class: "pos-badge" }, p.pos)), el("td", { class: "num" }, String(p.age)),
        el("td", {}, `${p._scoutLow}-${p._scoutHigh}`),
        el("td", {}, el("button", { class: "btn btn-ghost btn-sm", onclick: () => showEditPlayerModal(p, () => renderSettings(), { isProspect: true }) }, "Edit")),
      ]));
    });
    table.appendChild(tbody); panel.appendChild(table); root.appendChild(panel);
  }
}
function renderEditStaffScreen(root) {
  if (!editStaffTeamId) editStaffTeamId = S.userTeamId;
  root.appendChild(el("p", { class: "section-sub" }, "Edit any team's coach, scout, or physio directly."));
  const sel = el("select");
  S.teams.forEach(t => sel.appendChild(el("option", { value: t.id }, teamName(t.id))));
  sel.value = editStaffTeamId;
  sel.addEventListener("change", (e) => { editStaffTeamId = e.target.value; renderSettings(); });
  root.appendChild(el("div", { class: "panel", style: "padding:12px 14px" }, [el("div", { class: "field-label" }, "Team"), sel]));

  const team = teamById(editStaffTeamId);
  const roles = [
    ["coach", "Head Coach", [["dev", "Player Development"], ["gameday", "Gameday"]]],
    ["scout", "Chief Scout", [["evaluator", "Evaluator"], ["starSpotter", "Star Spotter"]]],
    ["physio", "Head Physio", [["prevention", "Prevention"], ["rehab", "Rehabilitation"]]],
  ];
  roles.forEach(([role, label, stats]) => {
    const s = team.staff[role];
    const panel = el("div", { class: "panel" });
    panel.appendChild(el("div", { class: "staff-card" }, [
      el("div", {}, [el("div", { class: "staff-role" }, label), el("div", { class: "staff-name" }, s.name)]),
      el("button", { class: "btn btn-ghost btn-sm", onclick: () => showEditStaffModal(team, role, label, stats) }, "Edit"),
    ]));
    const grid = el("div", { class: "stat-grid" });
    stats.forEach(([key, l]) => grid.appendChild(el("div", { class: "stat-box" }, [el("div", { class: "stars", html: starString(s[key]) }), el("div", { class: "l" }, l)])));
    panel.appendChild(grid);
    root.appendChild(panel);
  });
}

/* ================================ BOOTSTRAP ==================================== */

function renderTeamPicker() {
  const picker = $("#team-picker");
  picker.innerHTML = "";
  TEAM_DEFS.forEach((t, i) => {
    const opt = el("button", { class: "team-opt", type: "button" }, [
      el("div", { class: "t-conf" }, `${t.conference} · ${t.division}`),
      el("div", { class: "t-city" }, t.city),
      el("div", { class: "t-name" }, t.name),
    ]);
    opt.addEventListener("click", () => {
      const teamId = `team_${i}`;
      $$(".team-opt", picker).forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      $("#btn-start").disabled = false;
      $("#btn-start").dataset.teamId = teamId;
    });
    picker.appendChild(opt);
  });
}

function initApp() {
  renderTeamPicker();
  const existing = loadSavedState();
  if (existing) {
    S = existing;
    $("#continue-card").classList.remove("hidden");
    $("#continue-summary").textContent = `${teamName(S.userTeamId)} · Season ${S.season} · ${S.phase}`;
    if (cloudConfigured()) {
      const cfg = loadCloudConfig();
      cloudPull(cfg.token, cfg.gistId).then(remote => {
        if (remote && (remote.updatedAt || 0) > (S.updatedAt || 0) + 5000) {
          const note = $("#cloud-newer-note");
          note.innerHTML = "";
          note.appendChild(el("p", { class: "muted", style: "margin-top:10px" }, `A newer cloud save was found (${new Date(remote.updatedAt).toLocaleString()}).`));
          note.appendChild(el("button", { class: "btn btn-ghost btn-sm", onclick: () => { S = migrateSettings(remote); saveGame(); enterMainApp(); } }, "Load Cloud Version Instead"));
        }
      }).catch(() => { /* silent — local save still works fine offline */ });
    }
  }

  $("#btn-cloud-load").addEventListener("click", async () => {
    const token = $("#cloud-load-token").value.trim();
    const gistId = $("#cloud-load-gist").value.trim();
    const status = $("#cloud-load-status");
    if (!token || !gistId) { status.textContent = "Enter both the token and the Gist ID."; return; }
    status.textContent = "Loading…";
    try {
      const remote = await cloudPull(token, gistId);
      saveCloudConfig({ token, gistId });
      S = migrateSettings(remote); saveGame(); enterMainApp();
    } catch (e) { status.textContent = e.message; }
  });

  $("#btn-start").addEventListener("click", (e) => {
    const teamId = e.target.dataset.teamId; if (!teamId) return;
    newFranchise(teamId); enterMainApp();
  });
  $("#btn-continue").addEventListener("click", enterMainApp);
  $("#btn-new-instead").addEventListener("click", () => { $("#continue-card").classList.add("hidden"); });

  $$(".tab-btn[data-view]").forEach(b => b.addEventListener("click", () => setActiveView(b.dataset.view)));
  $("#modal-close").addEventListener("click", closeModal);
  $("#modal-backdrop").addEventListener("click", (e) => { if (e.target.id === "modal-backdrop") closeModal(); });

  $("#file-import").addEventListener("change", (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { S = migrateSettings(JSON.parse(reader.result)); saveGame(); enterMainApp(); } catch (err) { alert("Couldn't read that save file."); } };
    reader.readAsText(file);
  });
}

function enterMainApp() {
  $("#screen-newgame").classList.add("hidden");
  $("#screen-main").classList.remove("hidden");
  if (S.phase === "draft") runDraftUntilUserTurn();
  setActiveView("office");
  renderAll();
}

document.addEventListener("DOMContentLoaded", initApp);

// Debug/test accessor — top-level `let S` is not a window property in browsers.
window.__debugState = () => S;
window.__loadState = (obj) => { S = migrateSettings(obj); saveGame(); return S; };
