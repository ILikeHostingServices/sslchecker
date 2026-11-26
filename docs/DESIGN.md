DESIGN.md v1.0.2 (Last Rev: 2026-11-26)

# Design

How the checker presents itself and behaves. Structure lives in `ARCHITECTURE.md`.

## Interfaces

- **Logic:** `Checker.check(text, now)` returns `{ secrets, certs }`. `secrets` lists the `BEGIN` labels of key blocks (for example `PRIVATE KEY`, `OpenVPN Static key V1`). Each cert is `{ title, isCA, status: { level, label, text, from, until }, rows: [[label, value], ...] }`, or `{ title, error }` when the block cannot be read. `level` is `ok`, `warn` (under 30 days left), or `bad` (expired or not valid yet). Values are plain text.
- **Worker:** `PRIMARY_HOST` (the one hostname served; every other custom domain gets a 301 to it with path and query; empty disables; `*.workers.dev` is never redirected) and `NOINDEX` (`"1"` sends `X-Robots-Tag: noindex, nofollow` and a disallow-all `robots.txt`). `/local` and `/local/*` redirect to `/`.

## Conventions

- **File headers:** every first-party file starts with its name, version, and last edit date. Vendored files and JSON are exempt.
- **App version:** `Checker.VERSION` in `js/version.js`, shown in the footer. Bump it with a `CHANGELOG.md` entry on every functional change.
- **Example data:** only example domains, documentation IP ranges (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24, 2001:db8::/32), and "Northwind Traders". Test certificates in `tests/fixtures` are made with OpenSSL for these names and have no matching keys in the repository.
- **Times:** certificate dates are shown in UTC (`YYYY-MM-DD HH:MM UTC`), as certificates store them. The footer build time is US Eastern.

## User Interface

- **Layout:** one-row 56 px header (ILHS mark, wordmark, app title, link to ilhs.app; phones drop the wordmark and the link). Page title, one-line intro, privacy note. From 960 px the paste box sits left (sticky) and the result cards right; below that they stack. Footer is the shared ILHS Site Footer (Sizing Spec v2.0.0, "Site Footer"): version and build time; FOSS For All mark and copyright; info@ilhs.app and the source link. From 600 px the last two lines join, so a desktop footer is two lines.
- **Cards:** one per certificate, titled with its number and common name, with badges for CA or leaf and the validity status. A key/value table follows; on phones each label stacks above its value.
- **Brand:** palette `--bg`, `--surface`, `--surface-2`, `--line`, `--text`, `--muted`, `--accent` (teal), `--amber` (warnings), `--red` (errors and key warnings). `--field-line` mixes `--muted` into `--line` for field borders.
- **Contrast:** every text pair meets WCAG AA 4.5:1 in both themes (lowest 5.43:1, light theme); field borders 3.3:1 to 4.5:1 `[TESTED]` (2026-11-26, in-browser computed colors).
- **Type and sizing:** ILHS Shared Sizing Spec v2.0.0 tokens only, pinned in `docs/shared/ilhs-sizing-tokens.css`. Page title `--fs-h1`, card titles `--fs-h3`, table text `--fs-nav` and `--fs-small`, paste box `--fs-body` (never under 16 px). Buttons at least 44 x 44 px; footer links at least 24 px tall.
- **Copy:** Title Case with the owner's short-word rule (2026-11-26): words of 4 or more letters capitalized, words of 3 letters or fewer lowercase ("Issued by", "Public key"), except the first word, the first word after a colon, acronyms, proper names, the pronoun I, and unit symbols in parentheses; it applies to headings, buttons, and labels. No emoji or exclamation marks. No sales copy.
- **Print:** prints the result cards only.

## Principles

1. Everything runs in the browser and nothing leaves the page.
2. Certificate content is untrusted: text only, never HTML.
3. Key material is detected, never read.
4. No build step and no dependencies beyond the one vendored parser.
