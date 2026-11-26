ARCHITECTURE.md v1.0.0 (Last Rev: 2026-11-26)

# Architecture

What exists and how it connects. Why it is this way is in `DECISIONS.md`.

## Overview

One static page. The browser parses certificates with a vendored copy of jsrsasign. A Cloudflare Worker serves the files, redirects old addresses, and adds security headers.

## Components

| Component | Path | Role |
|---|---|---|
| Page | `index.html`, `css/style.css`, `favicon.svg`, `assets/` | Layout, ILHS brand, self-hosted fonts |
| Parser | `js/vendor/jsrsasign-all-min.js` | X.509 and ASN.1 parsing, hashes, signature checks (globals `X509`, `KJUR`, `zulutodate`) |
| Logic | `js/checker.js` | `Checker.check(text, now)`: finds PEM blocks, counts key blocks, describes each certificate, links issuers by signature |
| UI | `js/app.js` | Runs `Checker.check` on every input event and builds the cards with `textContent` |
| Worker | `worker/index.js`, `wrangler.jsonc` | Redirects to `PRIMARY_HOST` and from `/local`, security headers, `Last-Modified`, staging noindex |
| Tests | `tests/*.test.js`, `tests/load.js`, `tests/fixtures/` | Logic, Worker, and site checks with Node's built-in runner |
| CI | `.github/workflows/test.yml` | Runs the tests on every pull request and on pushes to `staging` and `main` |

## Data Flow

1. The visitor pastes text into the box. It stays in the page; nothing is sent or stored.
2. `Checker.check` matches `BEGIN CERTIFICATE` blocks and key `BEGIN` lines. Key blocks are only counted.
3. Each certificate is parsed by jsrsasign; fields come back as plain strings.
4. `app.js` draws one card per certificate. The only request the page makes is `HEAD` on itself for the footer build time.

## Dependencies

- jsrsasign 11.1.5 (MIT), vendored. No npm install, no build step.
- Fonts: Familjen Grotesk, Source Sans 3, JetBrains Mono (SIL OFL), self-hosted.
- Hosting: Cloudflare Workers static assets, built by Workers Builds.

## Constraints

- No requests to other hosts (enforced by the CSP).
- Works from a cloned folder with no network.
- No inline scripts or styles.
