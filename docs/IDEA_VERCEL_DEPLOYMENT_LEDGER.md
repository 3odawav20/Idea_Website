# IDEA Egypt — Vercel deployment ledger

This is the durable history and deployment-routing policy for IDEA Egypt. **Only append verified records**; never write a READY state from inference or from a source-only GitHub commit. Record Vercel's real deployment ID, branch, commit, origin workspace, project, URL, creation timestamp and observed result. All times below are UTC. No keys, API tokens or personal credentials in this file.

## Account/workspace routing

**Primary** (Vercel connector verified 2026-11-12):
- Authenticated user: `abdelrahmanamr895-6118`
- Team/workspace: `abdelrahmanamr895-6118s-projects` (`team_gnD5XrR4h3wZBoYqCZmragui`)
- Project: `idea-website` (`prj_cDM2A6TwfnMxAxBImISPmExqnwQh`)
- Source: `3odawav20/Idea_Website`
- Plan observed: Hobby

**Secondary connected workspace** (verified as a *team under the same authenticated user*, **not proven to be a separate Vercel login/account**):
- Team/workspace: `yoy-38ebd9e7` (`team_GgeNUMuwsNZufosZ6MODiYbb`)
- Existing project: `idea-website` (`prj_MjyTvBHCbuGeZTu8RuwbzR3Jv0uV`)
- Existing project's Git link: `3odawav20/IDEA-Website` — **NOT the source spelling/repo linked to primary**; must verify exact content/commit before fallback
- Plan observed: Hobby
- Latest checked release is ERROR; older READY releases exist.

**Fallback rule:** Use primary for normal previews. If a primary build is explicitly blocked by a deployment quota or platform error, determine the actual error and verify the secondary team's permissions, entitlement, branch/source SHA, root directory, environment variables and intended preview URL. Only then deploy the **same source SHA** to an approved linked project/new preview project on the secondary workspace. Never overwrite the secondary's unrelated existing project configuration, never move production domains, never bypass access/security restrictions, never trigger payments or upgrades without approval. A second team is not an unlimited quota workaround. The active Vercel connector currently exposes one logged-in user and two teams; a completely separate login would require its own valid connection.

**Recording rule (every attempted release):** Add a row with UTC timestamp, workspace, project ID, GitHub repository, branch, full commit SHA, deployment ID, exact URL, Vercel result and reason. Update the row if its pending state changes; do not guess success. Compare GitHub SHA with deployment SHA before labeling it a deployed code version. Vercel READY validates deployment status, **not** production PHP/MySQL, OAuth, SMS or RFQ functionality.

## Verified deployment history at time of initial audit (2026-11-12)

| Created (UTC) | Workspace | GitHub source / branch | Git commit SHA | Vercel deployment | Result |
| --- | --- | --- | --- | --- | --- |
| 2026-11-12 18:00:01 | Primary / `idea-website` | `3odawav20/Idea_Website` / `fix/idea-rfq-confirmed-submit-audit-20261112` | `6dae061b9f9e2ab3d39593c82d13c0db08d20c05` | [`dpl_8xZLocu9SHvv6Ae8mzNDANPab1mJ`](https://idea-website-494v5nuae-abdelrahmanamr895-6118s-projects.vercel.app/) | READY |
| 2026-11-12 17:26:27 | Primary / `idea-website` | `3odawav20/Idea_Website` / `feat/idea-six-auth-providers-20261112` | `01b760c37a35be35a8b7668d0c9a8ef48cc0044b` | [`dpl_8zH6iKpxCVLcTrh1SUU1Cw5qQQVW`](https://idea-website-ncxw8v71j-abdelrahmanamr895-6118s-projects.vercel.app/) | READY; earlier branch SHA, not all latest OAuth commits |
| 2026-11-12 17:25:10 | Primary / `idea-website` | `3odawav20/Idea_Website` / `feat/idea-six-auth-providers-20261112` | `112ea085cbf2aebc7058002872b2cd74ca4a8171` | [`dpl_GbuwrghSaF9f6qQ5KcK8RHTAFh62`](https://idea-website-5ykrbsnwk-abdelrahmanamr895-6118s-projects.vercel.app/) | READY; older branch SHA |
| 2026-11-04 11:43:12 | Secondary `yoy` / `idea-website` | `3odawav20/IDEA-Website` / `dependabot/npm_and_yarn/vite-6.4.5` | `49c5f7da9d525195b865ee7d39fff4abfa8d7436` | [`dpl_9SLA3Yjb2g1Y7uhHpGAHfc9dghKv`](https://idea-website-f6vww0sd5-yoy-38ebd9e7.vercel.app/) | ERROR |
| 2026-10-16 17:25:27 | Secondary `yoy` / `idea-website` | `3odawav20/IDEA-Website` / `main` | `6af35631991d81e926ebe885571a43e332ed1243` | [Secondary historical READY](https://idea-website-owi16j0b0-yoy-38ebd9e7.vercel.app/) | READY; historical, not current |

**Important:** Listing source `3odawav20/IDEA-Website` above reflects Vercel project Git metadata. Do not assume it is equivalent to `3odawav20/Idea_Website` without SHA and repository identity verification. This ledger captures deployment records visible through the connected account, and is not an exhaustive historical export.
