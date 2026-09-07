const fs = require("fs");
const { JSDOM } = require("jsdom");

function makeMockGistServer() {
  // In-memory fake of the parts of the GitHub Gist API we use.
  const gists = {};
  let nextId = 1;
  return {
    fetch: async (url, opts = {}) => {
      const method = opts.method || "GET";
      if (url === "https://api.github.com/gists" && method === "POST") {
        const body = JSON.parse(opts.body);
        const id = "gist" + (nextId++);
        gists[id] = { id, files: body.files };
        return { ok: true, status: 201, json: async () => gists[id] };
      }
      const m = url.match(/^https:\/\/api\.github\.com\/gists\/(\w+)$/);
      if (m) {
        const id = m[1];
        if (method === "PATCH") {
          if (!gists[id]) return { ok: false, status: 404, json: async () => ({}) };
          const body = JSON.parse(opts.body);
          Object.assign(gists[id].files, body.files);
          return { ok: true, status: 200, json: async () => gists[id] };
        }
        if (!gists[id]) return { ok: false, status: 404, json: async () => ({}) };
        return { ok: true, status: 200, json: async () => gists[id] };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    },
    gists,
  };
}

function bootApp() {
  const html = fs.readFileSync("index.html", "utf8");
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.github.io/gridiron-office/", pretendToBeVisual: true });
  const { window } = dom;
  const mock = makeMockGistServer();
  window.fetch = mock.fetch;
  window.confirm = () => true;
  window.alert = () => {};
  window.eval(fs.readFileSync("app.js", "utf8"));
  return { window, mock };
}

function log(...a) { console.log(...a); }
function fail(msg) { console.error("FAIL:", msg); process.exitCode = 1; }
function check(cond, msg) { if (!cond) fail(msg); }

(async () => {
  /* ---------- Device A: create a franchise, connect cloud sync, push ---------- */
  const A = bootApp();
  A.window.newFranchise("team_0");
  const stateA = A.window.__debugState();
  check(typeof stateA.updatedAt === "number", "state should carry an updatedAt timestamp");

  const gistId = await A.window.cloudCreate("fake-token-A");
  check(!!gistId, "cloudCreate should return a gist id");
  check(A.window.cloudConfigured(), "device A should be marked as cloud-configured after create");
  log("Device A created cloud save:", gistId);

  A.window.startSeason();
  A.window.simulateWeek();
  // saveGame() schedules a debounced push; call cloudPush directly to simulate the debounce firing
  await A.window.cloudPush("fake-token-A", gistId, A.window.__debugState());
  log("Device A pushed after simulating a week. Team:", A.window.teamName(A.window.__debugState().userTeamId), "week:", A.window.__debugState().week);

  /* ---------- Device B: fresh browser, connects using the same token + gist id ---------- */
  const B = bootApp();
  // Device B's fetch needs to see the SAME gist store as device A — reuse A's mock server.
  B.window.fetch = A.mock.fetch;

  const pulled = await B.window.cloudPull("fake-token-A", gistId);
  check(pulled.userTeamId === stateA.userTeamId, "device B should pull the same team as device A set up");
  check(pulled.week === 2 || pulled.phase === "regular", "device B should see the season progress made on device A");
  B.window.saveCloudConfig({ token: "fake-token-A", gistId });
  log("Device B pulled cloud save. userTeamId:", pulled.userTeamId, "week:", pulled.week, "season:", pulled.season);

  /* ---------- Device B plays further, pushes; Device A pulls the update ---------- */
  // Load the pulled state into device B's running app state via the exposed accessor path:
  B.window.__loadState(pulled);
  B.window.simulateWeek();
  await B.window.cloudPush("fake-token-A", gistId, B.window.__debugState());
  log("Device B advanced to week", B.window.__debugState().week, "and pushed.");

  const backToA = await A.window.cloudPull("fake-token-A", gistId);
  check(backToA.week === B.window.__debugState().week, "device A pulling again should see device B's progress");
  check(backToA.updatedAt >= stateA.updatedAt, "pulled state should have an equal-or-newer timestamp");
  log("Device A re-pulled and now sees week", backToA.week, "— matches device B. Cross-device sync confirmed end-to-end.");

  /* ---------- Error handling: bad token/gist should not throw uncaught ---------- */
  let threw = false;
  try { await A.window.cloudPull("fake-token-A", "does-not-exist"); }
  catch (e) { threw = true; check(typeof e.message === "string" && e.message.length > 0, "error should have a readable message"); }
  check(threw, "pulling a nonexistent gist should reject with an error, not silently succeed");
  log("Bad Gist ID correctly rejects with a readable error.");

  /* ---------- UI: Settings > Cloud Sync renders in both connected and disconnected states ---------- */
  const C = bootApp();
  C.window.newFranchise("team_5");
  C.window.enterMainApp();
  C.window.setActiveView("settings");
  const cloudChip = [...C.window.document.querySelectorAll("#view-settings .chip")].find(b => b.textContent === "Cloud Sync");
  check(!!cloudChip, "Cloud Sync chip should exist in Settings");
  cloudChip.click();
  let panelText = C.window.document.querySelector("#view-settings").textContent;
  check(panelText.includes("Create New Cloud Save") || panelText.includes("Connect to Existing"), "disconnected Cloud Sync screen should show connect options");

  C.window.saveCloudConfig({ token: "t", gistId: "g123" });
  C.window.setActiveView("settings");
  [...C.window.document.querySelectorAll("#view-settings .chip")].find(b => b.textContent === "Cloud Sync").click();
  panelText = C.window.document.querySelector("#view-settings").textContent;
  check(panelText.includes("g123"), "connected Cloud Sync screen should display the Gist ID");
  check(panelText.includes("Sync Now") && panelText.includes("Disconnect"), "connected screen should show Sync Now and Disconnect");
  log("Cloud Sync settings UI renders correctly in both disconnected and connected states.");

  if (process.exitCode === 1) log("\nCLOUD SYNC TEST FAILED — see FAIL lines above.");
  else log("\nALL CLOUD SYNC CHECKS PASSED");
})();
