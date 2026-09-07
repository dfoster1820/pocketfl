const fs = require("fs");
const { JSDOM } = require("jsdom");
const html = fs.readFileSync("index.html", "utf8");

// SESSION 1: open the app, pick a team, sim two weeks
const dom1 = new JSDOM(html, { runScripts: "dangerously", url: "https://example.github.io/gridiron-office/", pretendToBeVisual: true });
const w1 = dom1.window;

setTimeout(() => {
  w1.newFranchise("team_24"); // Dallas Cowboys
  w1.startSeason();
  w1.simulateWeek();
  w1.simulateWeek();
  const savedRaw = w1.localStorage.getItem("gridiron_office_save_v4");
  console.log("Session 1 (before closing tab):");
  console.log("  saved to localStorage:", !!savedRaw);
  console.log("  team:", w1.teamName(w1.__debugState().userTeamId), "| week:", w1.__debugState().week);

  // SESSION 2: brand new document/window (this is what "closing the tab and
  // reopening the URL later" actually looks like) but with the SAME
  // localStorage value a real browser would have kept on disk for that origin.
  const dom2 = new JSDOM(html, { runScripts: "dangerously", url: "https://example.github.io/gridiron-office/", pretendToBeVisual: true });
  const w2 = dom2.window;
  w2.localStorage.setItem("gridiron_office_save_v4", savedRaw);

  setTimeout(() => {
    w2.document.dispatchEvent(new w2.Event("DOMContentLoaded", { bubbles: true, cancelable: true }));
    setTimeout(() => {
      const s2 = w2.__debugState();
      console.log("\nSession 2 (after reopening the tab fresh):");
      console.log("  franchise restored:", w2.teamName(s2.userTeamId));
      console.log("  week:", s2.week, "| phase:", s2.phase);
      console.log("  continue-card visible on load:", !w2.document.querySelector("#continue-card").classList.contains("hidden"));
      process.exit(0);
    }, 100);
  }, 100);
}, 200);
