SITE.md v1.0.0 (Last Rev: 2026-11-26)

# Site: sslchecker

- Live: https://sslchecker.ilhs.app   (Worker: sslchecker)
- Staging: https://sslchecker-staging.ilhs.app   (Worker: sslchecker-staging)
- Source: repository root (static files; the Worker in worker/ serves them)
- Hosting: Cloudflare Workers static assets, built by Workers Builds from wrangler.jsonc
- Headers: Worker code (worker/index.js)
- Own branding: certificate glyph favicon in ILHS colors; ILHS mark and wordmark in the header per the Brand Guide
- Exceptions to the ILHS website baseline: sslchecker.syshost.app stays attached to the live Worker and 301-redirects to sslchecker.ilhs.app
- Baseline: ILHS website baseline (ILHS-Internal org/baseline/WEBSITES.md); previews off on both Workers
- Cloudflare steps: docs/DEPLOYMENT.md
