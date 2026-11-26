CHANGELOG.md v1.0.1 (Last Rev: 2026-11-26)

# Changelog

All notable changes, newest first. Versions match `Checker.VERSION` in `js/version.js`.

## v2.0.1 - 2026-11-26

### Changed

- Footer now uses the shared ILHS Site Footer (Sizing Spec v2.0.0), the same as ilhs.app and calc.ilhs.app: version and build time; the FOSS For All mark and copyright; contact and source links. Brand and contact share one line from 600 px. The "Free Software For All" tagline is gone, since the mark says it.

## v2.0.0 - 2026-11-26

Rebuilt to the ILHS repository and website standard, and moved to sslchecker.ilhs.app.

### Security

- Certificate fields were inserted as HTML, so a certificate with markup in its subject or SAN could run script in the page. Every value is now set with `textContent`, and a test fails if page code writes HTML.
- jsrsasign updated from 10.9.0 to 11.1.5 (10.9.0 has 7 published advisories fixed in 11.1.1, including GHSA-8qwj-4jxw-m8jw, a signature verification bypass, and GHSA-8g7p-jf3g-gxcp, an infinite loop on crafted input). It is now served from this site instead of cdnjs, so the page loads nothing from other hosts.
- A Cloudflare Worker sends a strict Content-Security-Policy (`default-src 'none'`, scripts, styles, and requests to this site only), HSTS, `nosniff`, `no-referrer`, and frame blocking.
- Browser spell check, autocorrect, and Grammarly are turned off on the paste box, so pasted keys are not sent to spelling services.
- Encrypted, OpenSSH, and DSA private keys and OpenVPN static keys (tls-auth, tls-crypt) are now detected and flagged too.

### Added

- Which pasted certificate signed each one, checked by signature; self-signed roots are checked the same way.
- Validity status with days left, expired, expiring within 30 days, or not valid yet; dates shown as `YYYY-MM-DD HH:MM UTC`.
- Public key type and size, signature algorithm, key usage, extended key usage, and SHA-1 thumbprint.
- ILHS brand, ILHS Shared Sizing Spec v2.0.0, light theme, and a phone layout that stacks each label above its value.
- Results update as you paste.
- Tests (`node --test`), a GitHub Actions workflow, the standard repository documents, an MIT license, and `.well-known/security.txt`.
- Staging site and staging-first release flow.

### Changed

- sslchecker.ilhs.app is the address; sslchecker.syshost.app redirects to it, keeping the path.
- The separate `/local` copy is gone: the one page now works offline from a clone, and `/local` redirects to it.

### Removed

- Dead `fmtDate` helper and inline event handlers.

## v1.0.0 - 2026-09-06

- First version: a client-side PEM certificate decoder, with a CDN build at the root and a vendored build in `/local`.
