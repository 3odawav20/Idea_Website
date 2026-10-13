CRITICAL RECOVERY + FINAL PROJECT VERIFICATION

The previous verification discovered that the current workspace lost its .git directory.
Do NOT pretend local Git state is verifiable.

Also, the workspace contains:
- src/styles/globals.css
but does NOT contain:
- src/app/globals.css

And .gitignore is missing locally even though it exists on GitHub.

DO NOT make assumptions.
DO NOT claim completion yet.

Execute this recovery sequence:

==================================================
1. IDENTIFY THE ACTUAL PROJECT ROOT
==================================================

Determine the exact current project root.

Confirm:
- package.json
- src/
- vercel.json
- pnpm-lock.yaml if present

Do not create a new project or duplicate the repository.

==================================================
2. RESTORE GIT SAFELY
==================================================

The intended repository is EXACTLY:

https://github.com/3odawav20/Idea_Website

NOT:
https://github.com/3odawav20/IDEA-Website

Reinitialize/restore Git only if necessary.

Configure:
origin = https://github.com/3odawav20/Idea_Website.git

Fetch main from GitHub.

DO NOT overwrite valid local work blindly.

First inspect the current workspace and compare it against origin/main.

==================================================
3. DETERMINE THE TRUE BASE
==================================================

Fetch:

origin/main

Then report:

git rev-parse HEAD
git rev-parse origin/main
git status --short --branch

If HEAD does not exist because the repository was recreated, explicitly say so.

Do NOT fabricate an old local SHA.

==================================================
4. COMPARE CURRENT WORKSPACE AGAINST GITHUB
==================================================

Compare the actual current workspace files against origin/main.

Pay special attention to:

src/app/data/artceramic.json
src/app/data/artceramicImport.ts
src/app/data/abaElMozahemImport.ts
src/app/data/sourceRegistry.json
src/app/data/types.ts
src/app/store/store.tsx
src/styles/globals.css
src/app/globals.css
vercel.json
.gitignore

Determine exactly:
- same
- different
- local only
- remote only

==================================================
5. GLOBALS.CSS PATH ISSUE
==================================================

Investigate why the project uses:

src/styles/globals.css

instead of:

src/app/globals.css

Do NOT blindly rename it.

Inspect imports and actual application usage.

Determine which file is the real active global stylesheet.

If src/styles/globals.css is the correct architecture:
- keep it
- do not create a fake duplicate just to satisfy an old path expectation.

If src/app/globals.css was actually required by the intended architecture:
- restore/fix it properly
- update imports safely

The final report must state which stylesheet is actually used by the application and why.

==================================================
6. RESTORE .gitignore
==================================================

Ensure .gitignore exists in the actual project root.

It must protect at minimum:

node_modules/
dist/
.vercel/
.qa-screens/
.env
.env.*
*.pem
*.key
*.p12
*.pfx
.DS_Store
*.log

Do not accidentally ignore source files.

==================================================
7. DATA INTEGRITY
==================================================

Verify that local project data exactly matches the intended GitHub versions where applicable.

Do NOT modify product names, dimensions, SKUs, IDs, images, or source data unless there is explicit evidence and a documented reason.

Especially verify:
- artceramic.json
- artceramicImport.ts
- abaElMozahemImport.ts
- sourceRegistry.json

Do not claim all 40 sources are complete.

Use the registry's real statuses.

==================================================
8. BUILD
==================================================

Run:

pnpm build

Then run:

git diff --check

If Git is restored successfully.

==================================================
9. BROWSER / RUNTIME SANITY CHECK
==================================================

Run the application.

Verify at least:

Home
Products
Product detail
Search
Product share/deep link
Account entry
Mobile navigation
RTL
404/deep route fallback

Check browser console for runtime errors.

==================================================
10. NO SECRET HANDLING
==================================================

IMPORTANT:

A GitHub personal access token was accidentally exposed in the previous transcript.

Do NOT:
- use it
- echo it
- place it in shell history
- place it in .env
- place it in code
- commit it
- print it
- store it

Treat it as revoked/unsafe.

Use the authenticated GitHub integration or normal Git credential mechanisms only.

==================================================
11. COMMIT AND PUSH ONLY AFTER VERIFICATION
==================================================

Do not commit random changes.

If changes are necessary:
- inspect git diff
- git diff --check
- pnpm build
- commit only relevant files
- push to origin/main

Then verify the actual remote commit through GitHub.

==================================================
12. FINAL REPORT
==================================================

Return an evidence-based report with exactly:

PROJECT ROOT:
...

REMOTE:
...

REMOTE MAIN SHA:
...

LOCAL HEAD SHA:
...

GIT STATUS:
...

DIFF CHECK:
...

BUILD:
...

ACTIVE GLOBAL CSS:
...

.gitignore:
...

DATA FILE VERIFICATION:
...

BROWSER QA:
...

FILES CHANGED:
...

COMMIT:
...

PUSH:
...

REMOTE VERIFICATION:
...

BLOCKERS:
...

IMPORTANT:
Do not say "complete" unless every claim is backed by actual verification.

If local HEAD cannot be verified because Git had to be reconstructed, clearly state that.