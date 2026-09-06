# sslchecker

A single-page, client-side X.509 certificate decoder. Paste a PEM certificate,
a full `.ovpn` file, or several certs at once, and it tells you what each
block actually is — subject, issuer, validity window, serial, SHA-256
fingerprint, SANs, and whether it's a CA or a leaf/client cert.

**Live version:** https://sslchecker.sysapp.host

## Why this exists

OpenVPN client export files (from UniFi, pfSense/Netgate, OPNsense, etc.)
bundle multiple PEM blocks into one file — usually a CA cert, a client cert,
and a private key, sometimes with an intermediate in the chain. When you're
staring at three `-----BEGIN CERTIFICATE-----` blocks with no labels, it's
not always obvious at a glance which is which without pulling each one apart
with `openssl x509 -noout -subject -issuer` by hand. This does that, in a
browser, instantly, for as many blocks as you paste in at once.

## How it works

- Pure client-side JavaScript. No backend, no API, no server component.
- Certificate parsing is done by [jsrsasign](https://kjur.github.io/jsrsasign/),
  a widely used pure-JS crypto/PKI library. This tool doesn't implement any
  ASN.1/X.509 parsing itself — it hands each detected PEM block to jsrsasign
  and reads back the fields.
- On page load, the input text is regex-matched for `-----BEGIN
  CERTIFICATE-----` / `-----BEGIN PRIVATE KEY-----` (and `RSA
  PRIVATE KEY`) blocks. Each certificate block is parsed independently, so a
  file with multiple certs shows multiple result cards.
- Private key blocks are detected and flagged, but the content is never
  passed to any parser and never rendered — the tool tells you a key is
  present and stops there.

## What this tool does *not* do

- It does not track anything. There is no analytics script, no telemetry, no
  pixel, nothing phoning home about usage.
- It does not scan anything. There's no lookup against any external cert
  database, revocation list, or transparency log — it only reads the text you
  paste into the box.
- It does not save anything. There's no `localStorage`, no `sessionStorage`,
  no cookies, no server to persist to. Refresh the page and everything is
  gone. Nothing you paste in ever leaves your browser tab — the only network
  request the page makes at all is fetching the jsrsasign library file
  itself (and the local build below removes even that).
- It doesn't parse or display private key material, even though it's happy
  to tell you one is present in the file.

This is FOSS. Take the code, read it, change it, self-host it — there's
nothing hidden and nothing calling home.

## Two versions in this repo

| Path | What it loads | Use case |
|---|---|---|
| `/` (`index.html`) | jsrsasign from cdnjs | The version deployed to sslchecker.sysapp.host |
| `/local` (`local/index.html` + `local/jsrsasign.js`) | jsrsasign vendored locally, no CDN | Fully offline use — no network access needed at all once you have the files |

## Running it locally

You don't need Cloudflare, a web server, or an internet connection for the
`/local` version. Clone or download this repo, then just open the file:

```bash
git clone https://github.com/ILikeHostingServices/sslchecker.git
cd sslchecker/local
```

Then open `index.html` directly in a browser (double-click it, or
`open index.html` / `xdg-open index.html`). Because `jsrsasign.js` sits
right next to it in the same folder and is loaded via a relative
`<script src="./jsrsasign.js">` tag, it works straight from the filesystem
(`file://`) with zero network access required.

If you'd rather serve it over HTTP instead of opening it as a local file
(some browsers are stricter about `file://` script loading than others),
any static file server works:

```bash
cd sslchecker/local
python3 -m http.server 8080
# then open http://localhost:8080
```

The root version (`index.html` at the repo root) will also run the same
way, but it fetches jsrsasign from cdnjs on load, so it needs outbound
internet access to that one domain.

## Does the vendored jsrsasign.js go stale?

Yes, in the sense that it's a snapshot (currently 10.9.0, 2023-11-27) that
won't pick up upstream bug fixes or new features on its own. The practical
risk is low for what this tool does — it's read-only parsing/display, not a
security control making pass/fail decisions — but a parsing bug could in
theory misreport a field.

If you want to keep it current automatically, a scheduled job is the right
tool, not a live pull on every page load (that would reintroduce a
per-visit dependency on the CDN, which defeats the point of the `/local`
version). Two ways to do it:

**GitHub Actions (cron-scheduled workflow)** — a `.github/workflows/`
job that runs on a schedule (e.g. weekly), `curl`s the current jsrsasign
version from cdnjs or npm, diffs it against `local/jsrsasign.js`, and if
it's changed, commits the update (or opens a PR for you to review before
merging, which is the safer default for a vendored dependency). This is the
straightforward option and needs no extra infrastructure beyond the repo
itself.

**Cloudflare Worker (cron trigger)** — a Worker on a Cron Trigger could
fetch the latest file from cdnjs and push a commit via the GitHub API on a
schedule. This makes sense if you want the refresh logic living alongside
your other Cloudflare-hosted pieces rather than in GitHub Actions, but for
a single vendored file, it's more moving parts (Worker + GitHub API token
management) for the same outcome the Action gets you natively.

Given you're already running Gitea Actions elsewhere, note that the GitHub
Actions version here is GitHub-specific syntax — if you ever mirror this
repo back to Gitea, the workflow file itself doesn't transfer as-is, though
the same cron-diff-commit logic works fine under `act_runner`.

## A note on `index.html` naming

Both the root and `/local` need to be named `index.html` if you want clean
URLs — `sslchecker.sysapp.host` and `sslchecker.sysapp.host/local` — without
appending a filename. Cloudflare Pages (like most static hosts) serves
`index.html` automatically for a directory path; anything else needs its
full filename typed out (`/local/cert-decoder.html`), which is uglier and
easy to mistype when sharing a link.

## License

No license file is included yet. Until one is added, default copyright
applies and reuse technically isn't guaranteed even though the intent here
is fully open. If you want the FOSS intent to actually be enforceable,
add a `LICENSE` file — MIT is a common, low-friction choice for a small
utility like this.
