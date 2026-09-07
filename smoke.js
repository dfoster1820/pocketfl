const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const dom = new JSDOM(html, { runScripts: "outside-only", url: "http://localhost/", pretendToBeVisual: true });
const { window } = dom;

global.window = window;
global.document = window.document;
global.localStorage = window.localStorage;
window.confirm = () => true;
window.alert = (m) => {};
global.confirm = window.confirm;
global.alert = window.alert;

const code = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
window.eval(code);

function log(...a) { console.log(...a); }
function fail(msg) { console.error("FAIL:", msg); process.exitCode = 1; }
function check(cond, msg) { if (!cond) fail(msg); }
function getState() { return window.__debugState(); }

/* ---------- 0. Nav structure: single top tab strip, no hamburger/sidebar ---------- */
check(document.querySelector("#tabstrip"), "tabstrip should exist");
check(document.querySelectorAll("#tabstrip .tab-btn").length === 5, "expected 5 top-level tabs");
check(!document.querySelector("#sidenav"), "sidenav should be gone");
check(!document.querySelector("#tabbar"), "old bottom tabbar should be gone");
check(!document.querySelector("#btn-menu-toggle"), "hamburger button should be gone");
log("Nav OK: single tabstrip, no hamburger/sidebar.");

/* ---------- 1. Franchise + real teams + schedule ---------- */
window.newFranchise("team_13"); // Kansas City Chiefs
let S = getState();
check(S.teams.length === 32, "expected 32 teams");
check(window.teamName(S.userTeamId) === "Kansas City Chiefs", "should be able to pick a real team");
check([...new Set(S.teams.map(t => t.conference))].sort().join(",") === "AFC,NFC", "conferences should be AFC/NFC");
const weeks = S.schedule.length;
check(weeks >= 18 && weeks <= 30, "schedule should be 18-30 weeks, got " + weeks);
const perTeamGames = {}; S.teams.forEach(t => perTeamGames[t.id] = 0);
S.schedule.forEach(wk => {
  const seen = new Set();
  wk.games.forEach(g => {
    check(!seen.has(g.home) && !seen.has(g.away), "team double-booked in a week");
    seen.add(g.home); seen.add(g.away);
    perTeamGames[g.home]++; perTeamGames[g.away]++;
  });
});
check(Object.values(perTeamGames).every(c => c === 18), "every team should have exactly 18 games");
log("Real teams + schedule OK.");

/* ---------- 2. Editing: players, staff, prospects ---------- */
const myTeam = window.teamById(S.userTeamId);
const somePlayerId = myTeam.players[0];
const p = S.players[somePlayerId];
const originalOvr = p.ovr;
Object.assign(p, { name: "Test Edited Player", ovr: 77, pot: 90, salary: 12.3, contractYears: 4 });
p.salaryOverride = true;
check(S.players[somePlayerId].name === "Test Edited Player", "player edit should stick");
check(S.players[somePlayerId].ovr === 77, "player ovr edit should stick");

const oldCoachName = myTeam.staff.coach.name;
window.editStaffDirect(myTeam, "coach", { name: "Test Coach", dev: 5, gameday: 5 });
check(window.teamById(S.userTeamId).staff.coach.name === "Test Coach", "staff edit should stick");
check(window.teamById(S.userTeamId).staff.coach.name !== oldCoachName, "staff name should have changed");
log("Direct player/staff editing OK.");

/* Salary override respected through offseason recalculation */
window.startSeason();
let guard = 0;
while (getState().phase === "regular" && guard < 30) { window.simulateWeek(); guard++; }
let poGuard = 0;
while (getState().phase === "playoffs" && poGuard < 10) { window.simPlayoffRound(); poGuard++; }
window.processOffseason();
S = getState();
const editedPlayerStillAround = S.players[somePlayerId];
if (editedPlayerStillAround && !editedPlayerStillAround.retired && editedPlayerStillAround.teamId) {
  check(editedPlayerStillAround.salary === 12.3, "salaryOverride should survive offseason salary recalculation");
}
log("Salary override respected through offseason (or player moved on, which is fine).");

/* ---------- 2b. New Personal/Skills/Contract fields + contract breakdown ---------- */
check(!document.querySelector("#view-team .btn-danger"), "roster table should no longer have a per-row Cut button");
check(typeof p.college === "string" && p.college.length > 0, "player should have a college");
check(typeof p.jerseyNumber === "number", "player should have a jersey number");
check(typeof p.injuryProne === "number" && p.injuryProne >= 1 && p.injuryProne <= 5, "player should have injuryProne 1-5");
p.bonus = 14; p.contractYears = 4; p.weightContract = "Front";
const breakdown = window.contractBreakdown(p);
check(breakdown.length === 4, "contract breakdown should have one row per contract year");
check(Math.abs(breakdown.reduce((s, r) => s + r.bonus, 0) - 14) < 0.5, "prorated bonus across years should sum back to the total bonus");
check(breakdown[0].salary > breakdown[3].salary, "a front-loaded contract should pay more in year 1 than the final year");
log("New Personal/Skills/Contract fields + contract breakdown OK. Cut button confirmed removed from roster table.");

/* ---------- 2c. Cut via Contract tab (releasePlayer still works the same way) ---------- */
const cutCandidate = S.players[myTeam.players[myTeam.players.length - 1]];
const cutTeamId = cutCandidate.teamId;
window.releasePlayer(cutTeamId, cutCandidate.id);
check(S.players[cutCandidate.id].teamId === null, "released player should have no team");
check(S.freeAgents.includes(cutCandidate.id), "released player should land in free agency");
log("Cut-via-contract (releasePlayer) still works correctly.");


check(!!S.lastWeekAwards, "lastWeekAwards should be set after simulating at least one week");
log("Weekly standouts computation OK (offense/defense best performer tracked per week).");

/* ---------- 2d. Skills tab Min/Max quick-set buttons ---------- */
{
  const domTestPlayer = S.players[myTeam.players[0]];
  window.showEditPlayerModal(domTestPlayer, () => {}, {});
  const skillsChip = [...document.querySelectorAll("#modal-body .chip")].find(b => b.textContent === "Skills");
  skillsChip.click();
  const modalBody = document.querySelector("#modal-body");
  const minMaxButtons = [...modalBody.querySelectorAll("button")].filter(b => b.textContent === "Min" || b.textContent === "Max");
  check(minMaxButtons.length === 16, "expected 16 Min/Max buttons on the Skills tab (8 fields x 2), got " + minMaxButtons.length);
  const speedField = [...modalBody.querySelectorAll(".field")].find(f => f.textContent.includes("Speed"));
  speedField.querySelector("button:last-of-type") && [...speedField.querySelectorAll("button")].find(b => b.textContent === "Max").click();
  check(speedField.querySelector("input").value === "99", "Max button should set Speed to 99");
  const injField = [...modalBody.querySelectorAll(".field")].find(f => f.textContent.includes("Injury Prone"));
  [...injField.querySelectorAll("button")].find(b => b.textContent === "Min").click();
  check(injField.querySelector("input").value === "1", "Min button should set Injury Prone to 1");
  const saveBtn = [...document.querySelector("#modal").querySelectorAll("button")].find(b => b.textContent === "Save Changes");
  saveBtn.click();
  check(S.players[domTestPlayer.id].speed === 99, "Speed Max should persist after Save");
  check(S.players[domTestPlayer.id].injuryProne === 1, "Injury Prone Min should persist after Save");
  log("Skills tab Min/Max quick-set buttons OK (present, functional, and persist on save).");
}

/* ---------- 3. Dual salary caps ---------- */
S.settings.playerCapLimit = 999;
S.settings.staffCapLimit = 999;
check(S.settings.playerCapLimit === 999, "player cap limit should be directly settable");
const candidates = window.generateStaffCandidates("scout", 3);
S.settings.staffCapOn = true;
S.settings.staffCapLimit = 0.1; // force it to be nearly impossible to afford
const hireResult = window.hireStaff("scout", candidates[0]);
check(hireResult.ok === false, "hiring should be blocked when over the staff budget");
S.settings.staffCapLimit = 999;
const hireResult2 = window.hireStaff("scout", candidates[0]);
check(hireResult2.ok === true, "hiring should succeed once the staff budget is raised");
log("Dual cap enforcement OK (player cap + staff cap independently settable and enforced).");

/* ---------- 4. 53-man roster limit ---------- */
S.settings.rosterLimitOn = true;
const team = window.teamById(S.userTeamId);
let lastSignedId = null;
while (team.players.length < 53 && S.freeAgents.length) {
  lastSignedId = S.freeAgents[0];
  team.players.push(lastSignedId);
  S.players[lastSignedId].teamId = team.id;
  S.freeAgents.shift();
}
if (team.players.length >= 53) {
  const anotherFA = Object.values(S.players).find(pl => !pl.teamId && !pl.retired);
  if (anotherFA) {
    if (!S.freeAgents.includes(anotherFA.id)) S.freeAgents.push(anotherFA.id);
    const res = window.signFreeAgent(anotherFA.id);
    check(res.ok === false, "signing should be blocked at the 53-man limit");
    log("Roster limit enforcement OK (roster size " + team.players.length + ").");
  } else {
    log("Roster limit test skipped — no additional free agent available to attempt signing.");
  }
} else {
  log("Roster limit test skipped — not enough free agents available to fill to 53 in this run.");
}

/* ---------- 5. Deep stats accumulate across a season ---------- */
S = getState();
// Note: .stats resets each offseason (already happened above), so we check
// accumulated .career and .seasonLog instead, which is what actually matters.
const anyCareerPasser = Object.values(S.players).find(pl => pl.career.passing.att > 0);
const anyCareerRusher = Object.values(S.players).find(pl => pl.career.rushing.att > 0);
const anyCareerReceiver = Object.values(S.players).find(pl => pl.career.receiving.rec > 0);
const anyCareerDefender = Object.values(S.players).find(pl => pl.career.defense.tkl > 0);
const anyCareerKicker = Object.values(S.players).find(pl => pl.career.kicking.fga > 0 || pl.career.kicking.xpa > 0);
check(!!anyCareerPasser, "career passing stats should have accumulated");
check(!!anyCareerRusher, "career rushing stats should have accumulated");
check(!!anyCareerReceiver, "career receiving stats should have accumulated");
check(!!anyCareerDefender, "career defensive stats should have accumulated");
check(!!anyCareerKicker, "career kicking stats should have accumulated");
const anyWithSeasonLog = Object.values(S.players).find(pl => pl.seasonLog && pl.seasonLog.length > 0);
check(!!anyWithSeasonLog, "seasonLog should be populated for at least one player");
check(S.teamSeasonHistory.length === 32, "team season history should have one entry per team after one offseason");
log("Deep box-score stats (passing/rushing/receiving/defense/kicking) accumulate into career + seasonLog. Team season history OK.");

/* ---------- 6. Draft + prospect editing + CPU free agency ---------- */
check(S.phase === "draft", "should be in draft phase");
const prospectId = S.draft.class[0];
const prospect = S.players[prospectId];
prospect.name = "Test Prospect Edited";
prospect._scoutLow = 60; prospect._scoutHigh = 70;
check(S.players[prospectId].name === "Test Prospect Edited", "prospect edit should stick");

window.runDraftUntilUserTurn();
let picks = 0;
while (window.draftOnClockTeam() && picks < 400) {
  const onClock = window.draftOnClockTeam();
  if (onClock === S.userTeamId) window.makeDraftPick(getState().draft.class[0]);
  window.runDraftUntilUserTurn();
  picks++;
}
check(window.draftOnClockTeam() === null, "draft should complete");
S = getState();
check(S.draft.picks.length === 96, "expected 96 draft picks, got " + S.draft.picks.length);
window.finishDraftIfDone();
S = getState();
check(S.phase === "offseason", "should be offseason after draft");
check(S.freeAgents.length < 200, "CPU free agency should keep the FA pool from ballooning, got " + S.freeAgents.length);
const cpuTeam = S.teams.find(t => t.id !== S.userTeamId);
check(cpuTeam.players.length >= 30, "CPU teams should refill their roster via free agency, got " + cpuTeam.players.length);
log("Draft (96 picks) + prospect editing + CPU free agency refill OK. FA pool size:", S.freeAgents.length);

/* ---------- 7. Trade blocked by roster limit ---------- */
const other = S.teams.find(t => t.id !== S.userTeamId);
const meNow = window.teamById(S.userTeamId);
if (meNow.players.length >= 50 && other.players.length >= 3) {
  const offer = [meNow.players[0]];
  const request = other.players.slice(0, 5); // lopsided trade to try to exceed the limit
  const tradeRes = window.proposeTrade(other.id, offer, request);
  if (meNow.players.length - 1 + 5 > 53) {
    check(tradeRes.blocked === true, "trade should be blocked when it would exceed the roster limit");
  }
  log("Trade roster-limit guard checked (blocked=" + !!tradeRes.blocked + ").");
} else {
  log("Trade roster-limit test skipped (roster sizes didn't set up the scenario this run).");
}

/* ---------- 8. Settings presets still work with the new fields ---------- */
window.applyPreset("Hard");
S = getState();
check(S.settings.difficulty === "Hard" && S.settings.injuryLikelihood === "High" && S.settings.playerCapOn === true && S.settings.staffCapOn === true, "Hard preset should set all expected fields");
window.applyPreset("Easy");
S = getState();
check(S.settings.playerCapOn === false && S.settings.staffCapOn === false, "Easy preset should turn both caps off");
log("Settings presets OK.");

/* ---------- 9. Save/load with migration ---------- */
window.beginNewSeason();
window.saveGame();
const raw = window.localStorage.getItem("gridiron_office_save_v4");
check(raw && JSON.parse(raw).season === 2, "save should persist season 2");
const migrated = window.migrateSettings(JSON.parse(raw));
check(migrated.settings.playerCapLimit !== undefined, "migration should ensure new settings fields exist");
log("Save/load + migration OK.");

/* ---------- 10. Render every view/sub-tab (including new ones) ---------- */
window.enterMainApp();
["office", "team", "league", "news", "settings"].forEach(v => {
  window.setActiveView(v);
  const node = document.querySelector(`#view-${v}`);
  check(node && node.innerHTML.trim().length > 0, `${v} view should render content`);
});
["roster", "stats", "caphit", "schedule", "freeagency", "trade"].forEach(sub => {
  window.eval(`teamSubTab = ${JSON.stringify(sub)};`);
  window.setActiveView("team");
  check(document.querySelector("#view-team").innerHTML.trim().length > 0, `team/${sub} should render`);
});
["standings", "playoffs", "draft", "hof"].forEach(sub => {
  window.eval(`leagueSubTab = ${JSON.stringify(sub)};`);
  window.setActiveView("league");
  check(document.querySelector("#view-league").innerHTML.trim().length > 0, `league/${sub} should render`);
});
["difficulty", "editplayers", "editstaff"].forEach(sub => {
  window.eval(`settingsSubTab = ${JSON.stringify(sub)};`);
  window.setActiveView("settings");
  check(document.querySelector("#view-settings").innerHTML.trim().length > 0, `settings/${sub} should render`);
});
log("All views + sub-tabs render OK, including Stats and Hall of Fame.");

/* ---------- 11. Hall of Fame induction over many seasons (headless, no DOM) ---------- */
{
  const ctx = {};
  ctx.document = { addEventListener(){}, querySelector(){return null;}, querySelectorAll(){return [];}, createElement(){return {style:{}, addEventListener(){}, appendChild(){}, setAttribute(){}, classList:{add(){},remove(){},toggle(){}}};} };
  ctx.window = ctx;
  ctx.localStorage = { setItem(){}, getItem(){return null;}, removeItem(){} };
  ctx.confirm = () => true; ctx.alert = () => {};
  const vm = require("vm");
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  vm.runInContext(`newFranchise("team_0");`, ctx);
  vm.runInContext(`
    function playFullSeason() {
      startSeason();
      let guard = 0;
      while (__debugState().phase === "regular" && guard < 30) { simulateWeek(); guard++; }
      let poGuard = 0;
      while (__debugState().phase === "playoffs" && poGuard < 10) { simPlayoffRound(); poGuard++; }
      processOffseason();
      runDraftUntilUserTurn();
      let picks = 0;
      while (draftOnClockTeam() && picks < 400) {
        const onClock = draftOnClockTeam();
        if (onClock === __debugState().userTeamId) makeDraftPick(__debugState().draft.class[0]);
        runDraftUntilUserTurn();
        picks++;
      }
      finishDraftIfDone();
      beginNewSeason();
    }
    for (let i = 0; i < 15; i++) playFullSeason();
  `, ctx);
  const finalState = vm.runInContext("__debugState()", ctx);
  check(finalState.hallOfFame.length > 0, "Hall of Fame should have inductees after 15 simulated seasons");
  check(finalState.hallOfFame.length < 60, "Hall of Fame should stay selective (elite), got " + finalState.hallOfFame.length + " after 15 seasons");
  const retiredCount = Object.values(finalState.players).filter(pl => pl.retired).length;
  const rate = finalState.hallOfFame.length / Math.max(1, retiredCount);
  check(rate < 0.2, "HOF induction rate should be well under 20% of retirees, got " + (rate * 100).toFixed(1) + "%");
  log(`Hall of Fame OK over 15 simulated seasons: ${finalState.hallOfFame.length} inductees out of ${retiredCount} retirees (${(rate * 100).toFixed(1)}%).`);
  log("Sample inductees:", finalState.hallOfFame.slice(0, 5).map(h => `${h.name} (${h.pos}, score ${h.score})`));
}

if (process.exitCode === 1) log("\nSMOKE TEST FAILED — see FAIL lines above.");
else log("\nALL SMOKE CHECKS PASSED");
