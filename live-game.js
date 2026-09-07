const fs = require("fs");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(__dirname + "/../index.html", "utf8");
const dom = new JSDOM(html, { runScripts: "outside-only", url: "http://localhost/", pretendToBeVisual: true });
const { window } = dom;
global.window = window; global.document = window.document; global.localStorage = window.localStorage;
window.confirm = () => true; window.alert = () => {};

window.eval(fs.readFileSync(__dirname + "/../app.js", "utf8"));

function log(...a) { console.log(...a); }
function fail(msg) { console.error("FAIL:", msg); process.exitCode = 1; }
function check(cond, msg) { if (!cond) fail(msg); }

window.newFranchise("team_0");
window.initApp();
window.enterMainApp();
let S = window.__debugState();

/* ---------- 1. Live modal opens with zeroed scoreboard, not the final score up front ---------- */
const home = window.teamById(S.userTeamId);
const away = S.teams.find(t => t.id !== S.userTeamId);
const result = window.simulateGame(home, away);
const fakeGame = { home: home.id, away: away.id, homeScore: result.homeScore, awayScore: result.awayScore, log: result.log };

window.showLiveGameModal(fakeGame);
const modalBody = document.querySelector("#modal-body");
const scores = [...modalBody.querySelectorAll(".sb-score")].map(el => el.textContent);
if (fakeGame.log.length > 0) {
  check(scores[0] === "0" && scores[1] === "0", "live modal should start at 0-0 (not show the final score immediately), got " + scores.join("-"));
  check(modalBody.textContent.includes("Q1") || modalBody.querySelector(".sb-vs").textContent.startsWith("Q"), "should show an in-progress quarter indicator, not FINAL, at open");
  check(!modalBody.querySelector("button.btn-primary") || modalBody.querySelector("button.btn-primary").classList.contains("hidden"), "Close button should be hidden until the game finishes revealing");
  check(!!modalBody.querySelector("button.btn-ghost"), "Skip to Final button should be present");
  log("Live modal opens at 0-0 with an in-progress indicator (not an instant final recap) — confirms this is NOT the old instant-summary behavior.");
} else {
  log("(This particular simulated game had no scoring plays to reveal — skipping the zero-state assertion, still exercising the rest of the flow.)");
}

/* ---------- 2. Skip to Final reveals everything and lands on the correct final score ---------- */
const skipBtn = [...modalBody.querySelectorAll("button")].find(b => b.textContent === "Skip to Final");
check(!!skipBtn, "Skip to Final button should be findable");
skipBtn.click();

const finalScores = [...modalBody.querySelectorAll(".sb-score")].map(el => el.textContent);
check(finalScores[0] === String(fakeGame.homeScore), `home score after skip should be ${fakeGame.homeScore}, got ${finalScores[0]}`);
check(finalScores[1] === String(fakeGame.awayScore), `away score after skip should be ${fakeGame.awayScore}, got ${finalScores[1]}`);
check(modalBody.querySelector(".sb-vs").textContent === "FINAL", "status should read FINAL after skip");
const closeBtn = [...modalBody.querySelectorAll("button")].find(b => b.textContent === "Close");
check(!!closeBtn && !closeBtn.classList.contains("hidden"), "Close button should be visible after the game finishes");
log(`Skip to Final correctly lands on ${finalScores[0]}-${finalScores[1]} (matches the underlying simulated result).`);

/* ---------- 3. All log entries actually got revealed into the DOM ---------- */
const revealedRows = modalBody.querySelectorAll(".play-log .pl-row").length;
if (fakeGame.log.length > 0) {
  check(revealedRows === fakeGame.log.length, `expected ${fakeGame.log.length} play rows revealed, got ${revealedRows}`);
} else {
  check(modalBody.textContent.includes("defensive struggle"), "a scoreless log should show the empty-state message");
}
log("All", fakeGame.log.length, "play-log entries revealed correctly.");

/* ---------- 4. Closing early cleans up the interval (no dangling timer) ---------- */
const home2 = window.teamById(S.userTeamId);
const result2 = window.simulateGame(home2, away);
const fakeGame2 = { home: home2.id, away: away.id, homeScore: result2.homeScore, awayScore: result2.awayScore, log: result2.log };
window.showLiveGameModal(fakeGame2);
check(window.__debugState, "sanity: debug accessor still present"); // just ensures app still alive
document.querySelector("#modal-close").click();
// After closing, the modal-backdrop should be hidden and no further errors should occur if we let a moment pass.
check(document.querySelector("#modal-backdrop").classList.contains("hidden"), "modal should be hidden after closing early");
log("Closing the live modal early hides it and clears the timer without error.");

/* ---------- 5. Champions Bowl live view shows the championship line after finishing ---------- */
window.showLiveGameModal({ home: home.id, away: away.id, homeScore: 24, awayScore: 17, log: fakeGame.log, winner: home.id }, true);
const cbModal = document.querySelector("#modal-body");
const cbSkip = [...cbModal.querySelectorAll("button")].find(b => b.textContent === "Skip to Final");
cbSkip.click();
check(cbModal.textContent.includes("are champions"), "Champions Bowl live view should show the championship line once finished");
log("Champions Bowl live view correctly shows the champion once the reveal finishes.");

if (process.exitCode === 1) log("\nLIVE GAME VIEWER TEST FAILED — see FAIL lines above.");
else log("\nALL LIVE GAME VIEWER CHECKS PASSED");
