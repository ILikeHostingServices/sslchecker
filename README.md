README.md v2.0.0 (Last Rev: 2026-11-26)

# SSL Certificate Checker

A free, single-page certificate checker published by ILHS at https://sslchecker.ilhs.app. Paste a PEM certificate, a chain, or a whole OpenVPN `.ovpn` profile, and it labels every certificate in it.

## Overview

OpenVPN profiles exported from UniFi, pfSense, OPNsense, and similar bundle several PEM blocks in one file: usually a CA certificate, a client certificate, and a private key. This page tells you which is which without running `openssl x509` on each block by hand.

For each certificate it shows the subject, issuer, which pasted certificate signed it (checked by signature, not just by name), validity dates in UTC with days left or expired, names (SAN), public key type and size, signature algorithm, key usage, serial, SHA-256 fingerprint, and SHA-1 thumbprint (the value Windows shows).

Privacy:

- Everything runs in your browser tab. The page makes no requests to any other site, and the Content-Security-Policy blocks it from doing so.
- Nothing is saved: no cookies, no storage, no analytics. Reload the page and the text is gone.
- Private keys and OpenVPN static keys are detected by their `BEGIN` line and flagged. Their contents are never parsed or shown.
- The paste box turns off browser spell check, which on some browsers sends typed text to a cloud service.

Certificate parsing uses [jsrsasign](https://kjur.github.io/jsrsasign/) (MIT), vendored in `js/vendor/`.

## Files

| Path | What it is |
|---|---|
| `index.html` | The page |
| `css/style.css` | ILHS brand styles, with the pinned ILHS Shared Sizing Spec block |
| `js/checker.js` | Finds PEM blocks and describes each certificate (no DOM, tested in Node) |
| `js/app.js` | Page wiring: draws the result cards with `textContent` only |
| `js/version.js` | App name and version shown in the footer |
| `js/vendor/jsrsasign-all-min.js` | jsrsasign 11.1.5 from npm, unedited |
| `assets/` | ILHS mark and self-hosted fonts (SIL Open Font License texts included) |
| `favicon.svg`, `robots.txt`, `.well-known/security.txt` | Site icon, crawler rules, security contact |
| `worker/index.js`, `wrangler.jsonc` | Cloudflare Worker: redirects, security headers, staging noindex |
| `tests/` | `node --test` suites and example certificates |
| `docs/` | Architecture, design, decisions, roadmap, runbook, deployment |

## Quick Start

Use it at https://sslchecker.ilhs.app, or run it yourself with no network access at all:

```
git clone https://github.com/ILikeHostingServices/sslchecker.git
cd sslchecker
```

Then open `index.html` in a browser (double-click it). Every file the page needs is in the folder.

To serve it over HTTP instead, use any static file server from the repository root, for example `npx --yes serve -l 8931` or `python -m http.server 8931`, then open http://localhost:8931.

To run it the way Cloudflare serves it (redirects and headers included): `npx wrangler dev --var PRIMARY_HOST:127.0.0.1`, then open http://127.0.0.1:8787.

Run the tests (Node 20 or newer, no install step):

```
node --test tests/*.test.js
```

## After Install Configuration

None for the page. To host it on your own Cloudflare account, change `name` and `PRIMARY_HOST` in `wrangler.jsonc` (set `PRIMARY_HOST` to empty to turn off the redirect). On any other web server, serve the repository root as static files; `docs/DEPLOYMENT.md` lists the security headers to copy.

## Troubleshooting

| Problem | Fix |
|---|---|
| "No certificate or key blocks found" | The text must include the `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----` lines. DER (binary) files must be converted first: `openssl x509 -inform der -in cert.cer -out cert.pem` |
| "Could not read this block as a certificate" | The block was cut short or changed while copying. Copy it again, whole |
| "Issued By: Not in the pasted text" | The issuing CA certificate was not pasted. Paste the chain to see the links |
| Footer shows no build time | Normal when opened from a file; the build time comes from the web server's `Last-Modified` header |

## License

MIT. See `LICENSE`. jsrsasign is MIT licensed by Kenji Urushima; the fonts are under the SIL Open Font License.
