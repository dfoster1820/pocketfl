# Setup Guide: GitHub + GitHub Pages + Home Screen

A complete walkthrough from "I have this folder" to "it's live on the
internet, syncs across my devices, and is on my phone's home screen." No
prior GitHub experience assumed.

## 0. What you need first

- A free [GitHub account](https://github.com/join) — if you don't have one, make one now.
- Git installed on your computer. Check with:
  ```bash
  git --version
  ```
  If that fails, install it from [git-scm.com](https://git-scm.com/downloads).

## 1. Create the repository on GitHub

1. Go to [github.com/new](https://github.com/new).
2. Pick a name, e.g. `pocketfl`.
3. Leave it **Public** (required for free GitHub Pages) unless you're on a
   paid plan that supports private Pages.
4. Do **not** check "Add a README" — you already have one in the folder.
5. Click **Create repository**. GitHub will show you a page with setup
   commands — you don't need to copy them, just keep the page open; you'll
   need the URL it shows (looks like `https://github.com/<you>/pocketfl.git`).

## 2. Push the project

Open a terminal in the `pocketfl` folder (the one with `index.html`
in it) and run:

```bash
cd pocketfl
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/pocketfl.git
git push -u origin main
```

Replace `<your-username>` with your actual GitHub username. If this is
your first time pushing from this computer, GitHub will prompt you to sign
in (a browser window usually pops up — follow that flow).

If the folder already has a `.git` directory (it does, if you downloaded
this project as a zip from an earlier step here), skip `git init` and just
run the `remote add` and `push` lines.

**Refresh the GitHub page** — you should now see all your files there.

## 3. Turn on GitHub Pages (free hosting)

1. On your repo's GitHub page, click **Settings** (top right of the repo, not your account settings).
2. In the left sidebar, click **Pages**.
3. Under "Build and deployment," set **Source** to `Deploy from a branch`.
4. Set **Branch** to `main` and folder to `/ (root)`. Click **Save**.
5. Wait about a minute, then refresh — GitHub shows a green box with your
   live URL, something like:
   ```
   https://<your-username>.github.io/pocketfl/
   ```

That URL is now permanent (as long as the repo exists) and free.

## 4. Make your save follow you across devices (Cloud Sync)

By default, your save lives only in the browser you're playing in — opening
the same URL on a different phone or computer starts a fresh franchise.
**Cloud Sync** fixes that by mirroring your save to a private GitHub Gist,
using the same kind of token from a step above.

### One-time setup, on your first device

1. Open the app, start (or continue) your franchise.
2. Go to **Settings → Cloud Sync**.
3. Create a token *just for this* (a separate one from step 2 is fine, or
   reuse it): GitHub → your profile photo → **Settings** → **Developer
   settings** → **Personal access tokens** → **Tokens (classic)** →
   **Generate new token**. This time, check **only the `gist` box** —
   nothing else — then generate and copy it.
4. Paste the token into the **Personal Access Token** field and tap
   **Create New Cloud Save**.
5. You'll get a **Gist ID** — write it down or keep this screen open. This
   ID plus your token are the two things any other device needs.

### Joining from a second device

1. Open your GitHub Pages URL there.
2. On the very first screen, there's a **"Have a cloud save?"** box —
   paste in the same token and the Gist ID from step 5 above, then tap
   **Load Cloud Save**.
3. That's it — the same franchise loads, and from now on this device syncs
   too.

### After that

- Every action you take (simming a week, a trade, editing a player) saves
  locally right away and pushes to the cloud a few seconds later.
- Opening the app on any connected device checks whether the cloud has
  something newer (e.g., you played on your phone last) and offers to load
  it before you continue.
- **Settings → Cloud Sync** always shows your Gist ID, lets you force a
  **Sync Now** or **Pull Latest**, and lets you **Disconnect** a device
  without deleting the cloud save itself.

### Worth knowing

- The token is stored only in each device's local browser storage — it's
  never included in an Export Save file, so sharing a save file with
  someone doesn't hand them your token.
- A GitHub Gist marked "secret" is *unlisted*, not encrypted or truly
  private — anyone who somehow got your exact Gist ID could view your save
  contents. That's a low-stakes exposure for a save file (team rosters and
  stats, nothing sensitive), but don't reuse this token for anything else
  or paste your Gist ID publicly.
- You can view/manage the raw Gist anytime at
  `https://gist.github.com/<gist-id>`.

## 5. Add it to your phone's home screen

The app has a custom icon and the right meta tags baked in, so this looks
and feels like a real app once added.

### iPhone (Safari)

1. Open your GitHub Pages URL in **Safari** (must be Safari, not Chrome —
   iOS only allows "Add to Home Screen" from Safari).
2. Tap the **Share** button (square with an arrow pointing up).
3. Scroll down and tap **Add to Home Screen**.
4. Confirm the name (defaults to "PocketFL") and tap **Add**.

You'll get a home screen icon with the gold "GO" mark, and opening it
launches full-screen without Safari's address bar — it behaves like an
installed app. If you've set up Cloud Sync (above) on this device already,
your franchise is right there.

### Android (Chrome)

1. Open the URL in Chrome.
2. Tap the **⋮** menu → **Add to Home screen** (Chrome may also
   auto-suggest this with an "Install app" banner).
3. Confirm the name and tap **Add**.

## 6. Making changes later

Whenever you edit `index.html` (or `app.js`/`style.css` and re-inline
them), push the update the same way:

```bash
git add .
git commit -m "Describe what changed"
git push
```

GitHub Pages redeploys automatically within a minute or two — no extra
steps. Your home screen icon and URL stay the same.

## Troubleshooting

- **Pages says "There isn't a GitHub Pages site here" after enabling it** —
  wait a minute and refresh; the first deploy takes a little longer than
  updates.
- **404 at the Pages URL** — double check Settings → Pages shows branch
  `main` and folder `/ (root)`, and that `index.html` is at the top level
  of the repo (not inside a subfolder).
- **"Add to Home Screen" doesn't show a custom icon** — make sure you're
  using the current `index.html` from this project (the icon is embedded
  directly in it); an older copy without the icon tags won't have it. Also
  confirm you're using Safari on iOS, not another browser.
- **Push rejected / asks for a password you don't have** — GitHub retired
  password-based pushes. Let the browser sign-in flow that pops up during
  `git push` complete, or set up a
  [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
  if you're prompted for one manually.
- **Cloud Sync says the request was rejected / token error** — double
  check the token was generated with the **gist** checkbox specifically
  (not just "repo"), and that you copied the whole token with no extra
  spaces. Tokens can also expire if you set an expiration when creating
  one — generate a new one if so.
- **Cloud Sync says it can't find the Gist** — double-check the Gist ID is
  copied exactly (no extra characters) from the device that created it, in
  Settings → Cloud Sync there.
- **Two devices show different franchises even though both say "Connected"** —
  open Settings → Cloud Sync on the outdated device and tap **Pull Latest**
  to force it to catch up; auto-sync happens a few seconds after each
  action, so a device that's been offline won't have today's changes until
  it reconnects and syncs.
