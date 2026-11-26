ROADMAP.md v1.0.0 (Last Rev: 2026-11-26)

# Roadmap

## Now

- Owner: Cloudflare setup in `DEPLOYMENT.md` (staging Worker, Access, domains, previews off), then test on staging and release to `main`.
- After go-live, point the IT Reference Calculator's menu link at https://sslchecker.ilhs.app/.

## Next

- Copy buttons for fingerprints and serials.
- Browser checks (sizing at every test size, axe-core) like the calculator's `tests/browser-conformance.js`.

## Later

- Read certificate signing requests (`BEGIN CERTIFICATE REQUEST`) and DER files.
- Offline install (service worker), if visitors ask for it.
