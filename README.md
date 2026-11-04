# Everfall

**Build 0.9.0 · Development handoff 3.0**

Everfall runs as an idle fantasy RPG in the browser. This package includes both the browser build and the TypeScript source. The archive extracts into one **Everfall** folder. Inside that folder, the files are flat.

## Upload from your phone

1. Extract the ZIP in your Files app and open the **Everfall** folder.
2. Open your GitHub repository in your browser. In **Add file → Upload files**, choose the files **inside** Everfall so that **index.html** is directly in the repository root. Commit the upload to your publishing branch. Use the desktop site view on your phone if GitHub hides the upload controls.
3. Confirm that **.nojekyll** appears next to **index.html** in GitHub. If the Files picker hid it, use **Add file → Create new file** and create an empty file named **.nojekyll** at the root.
4. In **Settings → Pages**, choose **Deploy from a branch**, pick the branch you uploaded to, and choose **/ (root)**. Use the Pages URL shown by GitHub once the deployment is ready.
5. Open the site and choose **Play on this device** to play immediately. Set up Firebase below before using an account.

No npm installation is needed for the phone upload. The static build uses relative links and can live at a repository URL such as `https://YOUR-NAME.github.io/YOUR-REPO/`. Firebase Authentication separates cloud saves by account. Access to the public game URL follows your GitHub Pages visibility settings.

[GitHub Pages publishing instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Use your existing Firebase project

The client already points to **everfall-d0cf7** using the supplied public web configuration.

1. In the Firebase console, open **Authentication → Sign-in method** and enable **Google** and **Email/Password**. Select a support email for Google if Firebase prompts for one.
2. In **Authentication → Settings → Authorized domains**, add the actual Pages **hostname**, such as `your-name.github.io`. Enter just the hostname. A custom domain needs its own entry.
3. Open **Cloud Firestore** and create the default database if the project does not already have one. Under **Rules**, add the Everfall match from **firestore.rules** and publish it. If the project has existing rules for other collections, merge the new match into those rules so their permissions are preserved.
4. Test sign-in, clear an encounter, and check **Settings** for the cloud status. Cloud autosaves run while the game is online. Open the game with the same account on a second device and verify that the save restores.
5. If both devices play independently, the first cloud write with the current revision wins. The other device retains its local copy and lets you export it or load the newer cloud copy from Settings.

The local expedition and authenticated profiles are separate. To move an existing local expedition to a cloud profile, export it from **Settings**, sign into the cloud profile, then import it there. Import replaces the selected profile. Never enter an admin credential or service account key into a browser file.

[Firebase email sign-in setup](https://firebase.google.com/docs/auth/web/password-auth) · [Firebase Google sign-in setup](https://firebase.google.com/docs/auth/web/google-signin) · [Firebase authorized domains](https://support.google.com/firebase/answer/6400741?hl=en)

## Play

- The war band fights on its own. Use **Push** to advance and **Farm** to repeat a cleared stage. Defeat in Push switches the party to Farm automatically.
- Stage 2 guarantees a Wild Egg and four crystals. Hatch the egg in **Pets** and choose an owner. Stage 3 guarantees the first dungeon key.
- Change formation, skill priority, equipment, companions and masteries through **Heroes**. Combat changes restart the current encounter with the new party setup.
- Dungeon keys are spent when you enter. Completed waves and camp state persist. If you close during a fight, that wave restarts on return.
- Upgrade equipment in **Inventory**. Lock gear you want to keep. The inventory stores up to 400 items, with excess drops sold or swapped for lower-quality unworn, unlocked gear.
- A successful first online load can cache the static game for offline reopening. In your browser menu, use **Install** or **Add to Home Screen** where available. Save export is also available from Settings.

## Rebuild the source

Use Node 20.19+ or Node 22.12+ and a current npm version. From inside the extracted folder:

```sh
npm ci
npm test
npm run balance
npm run build
npm run preview
```

`npm run dev` opens the editable `game.html` entry. The build writes a flat `dist` folder. To publish an update from source, copy the files **inside dist** to the repository root, including `.nojekyll`. Keep the source files at the root if you also want GitHub to store them. The generated `index.html` points to versioned bundles in the same directory.

- **combat.ts** contains the fixed-step simulation and **battlefield.ts** renders it in Phaser.
- **content.ts**, **loot.ts**, **progression.ts** and **save.ts** hold gameplay data and state transitions.
- **firebase-client.ts** and **firestore.rules** contain cloud persistence and account rules.
- **BUILD-REPORT.md** records verification results and the gaps against the production handoff.
