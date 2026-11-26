SECURITY.md v1.0.0 (Last Rev: 2026-11-26)

# Security Policy

This policy covers the SSL Certificate Checker website (sslchecker.ilhs.app) and this repository. The ilhs.app website has its own [policy](https://ilhs.app/contact/#security).

## Reporting A Problem

Email **info@ilhs.app** with:

- The address (URL) or file involved.
- What you found and how to see it again.
- What someone could do with it, if you know.

Please do not open a public issue or post details anywhere public until it is fixed. The same contact is published at https://sslchecker.ilhs.app/.well-known/security.txt (RFC 9116).

## What To Expect

| Step | Target |
|---|---|
| We confirm we got your report | Within 3 business days |
| We tell you whether it is a real problem and our plan | Within 10 business days |
| Fix goes live | As soon as it is tested on staging, usually within 30 days |

We will credit you when the fix goes live, unless you ask us not to.

## Scope

| In scope | Out of scope |
|---|---|
| https://sslchecker.ilhs.app | Reports from automated scanners with no working example |
| https://sslchecker-staging.ilhs.app (login required) | Bugs in jsrsasign itself (report those upstream; tell us if they affect this site) |
| sslchecker.syshost.app, which redirects here | Denial of service and volume testing. Please do not run them |
| The Worker, `wrangler.jsonc`, the page code in `js/`, and the GitHub Actions workflow | ilhs.app and other ILHS apps (use their own policies) |

## How The Site Is Protected

- **Nothing leaves the browser.** Certificates are parsed in the page. The only request the page makes is a `HEAD` request to itself for the footer's build time. The Content-Security-Policy allows scripts, styles, fonts, images, and requests from this site only.
- **No HTML from certificates.** Certificate fields are chosen by whoever made the certificate, so they are written with `textContent`. `tests/site.test.js` fails if page code uses `innerHTML` or similar.
- **Keys are never read.** Private key and OpenVPN static key blocks are counted by their `BEGIN` line; their contents are not parsed, stored, or shown.
- **No storage.** No cookies, `localStorage`, analytics, or server-side code beyond the Worker that serves the files.
- **Headers.** HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `frame-ancestors 'none'`, and cross-origin isolation headers, set in `worker/index.js` and checked by `tests/worker.test.js`.
- **Dependencies.** One: jsrsasign, vendored unedited from npm. Check it for advisories when you touch this repository and update it in its own pull request.
