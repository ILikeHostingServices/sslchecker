AGENTS.md v1.0.0 (Last Rev: 2026-11-26)

# SSL Certificate Checker - Agent Guide

A free, browser-only certificate checker published by ILHS at https://sslchecker.ilhs.app.

## Repo Facts

- Type: service (static website plus a Cloudflare Worker that serves it)
- Environment: ILHS (public, open source, MIT)
- Deployed: yes (Cloudflare Workers Builds: `staging` -> sslchecker-staging.ilhs.app, `main` -> sslchecker.ilhs.app)
- Primary Language: JavaScript (vanilla HTML, CSS, and JS; no build step, no npm dependencies)
- Default Branch: main (work branches start from `staging`)

## Read First

1. This file.
2. `docs/ARCHITECTURE.md`: what exists and how it connects.
3. `docs/DECISIONS.md`: what was decided and why. Do not relitigate without new evidence.
4. `docs/DESIGN.md`: interfaces, conventions, and the ILHS brand rules. Read before changing any UI.
5. `docs/ROADMAP.md`: what is planned.
6. `docs/RUNBOOK.md` and `docs/DEPLOYMENT.md`: before deploying or touching Cloudflare.
7. `SECURITY.md`: before touching headers, parsing, or anything that renders certificate data.
8. `CHANGELOG.md`: what changed and when.

## Commands

- Run: open `index.html`, or `npx --yes serve -l 8931` and open http://localhost:8931
- Run as Cloudflare serves it: `npx wrangler dev --var PRIMARY_HOST:127.0.0.1` and open http://127.0.0.1:8787
- Test: `node --test tests/*.test.js` (Node 20 or newer; pass the glob, `node --test tests/` fails on Node 22)
- Lint: none

## Rules

1. No secrets in the repo. Cloudflare deploy tokens live in the Cloudflare dashboard only.
2. No hardcoded hostnames in reusable code. The site's own domain lives in `wrangler.jsonc` (`PRIMARY_HOST`), `index.html` meta tags, `robots.txt`, and `.well-known/security.txt`.
3. Fail closed. If a check, header, or config cannot be confirmed, stop and say why.
4. Query for facts (versions, paths, config values) instead of guessing.
5. Do not change Cloudflare or GitHub settings unless explicitly approved. Do not commit or push unless asked.
6. Label non-obvious claims in notes: `[TESTED]`, `[SOURCE]`, `[USER]`, `[ASSUMED]`.
7. Research is not execution. Never describe a change as applied or verified from a plan or dry run.
8. This repository is public: no internal hostnames, IPs, share paths, usernames, or client details. Test certificates use example names only.

## Before Ending A Session

1. Add a `CHANGELOG.md` entry and bump `Checker.VERSION` in `js/version.js` on any functional change.
2. Bump the header version and date of every file you changed.
3. Record new decisions in `docs/DECISIONS.md` with the reason.
4. Fix any doc your change made stale. Run the tests.

## Repo-Specific Rules

- **Release flow: staging first.** Branch from `staging`, open the pull request into `staging`, merge when checks are green. The owner tests on sslchecker-staging.ilhs.app; only after the owner approves, open a pull request from `staging` into `main`. Never push `staging` or `main` directly.
- **Merging:** merge commits only (no squash or rebase), as ILHS-Owner, only when every check is green, using the full head commit SHA.
- **Git identity:** `ILHS-Owner <337515992+ILHS-Owner@users.noreply.github.com>` with a `Co-Authored-By` trailer for the agent. `main` was rewritten once (2026-11-26, owner approved) to replace the original author identity; never rewrite shared history again without explicit approval. Check `gh api user --jq .login` shows ILHS-Owner before any write.
- **Certificate data is hostile input.** Render it with `textContent` only (`tests/site.test.js` fails on `innerHTML`). Never parse, store, or display key blocks.
- **No network calls.** The page talks to no other host; `connect-src 'self'` in `worker/index.js` enforces it. Do not add a CDN, analytics, or lookups.
- **No inline scripts or styles** in `index.html` (the CSP forbids them; tests check).
- **Vendored code:** `js/vendor/jsrsasign-all-min.js` is copied unedited from the npm package `lib/` folder. Update it in its own pull request and run the tests.
- **Brand:** ILHS palette and tokens, Title Case (minor words lowercase mid-label), Sizing Spec v2.0.0 (44 px controls, 24 px text links, one-row 56 px header, footer at most 120 px desktop and 200 px phone), no shadows, emoji, or exclamation marks. Do not spell out ILHS. Contact: info@ilhs.app.
- **Formatting:** no em or en dashes in files you write; dates YYYY-MM-DD; times 24 hour.
- **Gotchas:** (a) jsrsasign defines globals with top-level `var`, so tests load it through `vm.runInThisContext` (`tests/load.js`), not `require`. (b) On Windows, `import()` of a path needs `pathToFileURL`. (c) Unicode escapes written through a script can turn into literal characters; check the saved file. (d) `openssl req -subj "/..."` in Git Bash needs `MSYS_NO_PATHCONV=1`.
