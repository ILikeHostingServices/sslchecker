DEPLOYMENT.md v1.0.0 (Last Rev: 2026-11-26)

# Deploying sslchecker.ilhs.app (Live And Staging)

How the SSL Certificate Checker is hosted on Cloudflare Workers, and the dashboard steps for the owner. The files in this repository that control deploys are `wrangler.jsonc` and `worker/index.js`; everything below is dashboard work. Modeled on the IT Reference Calculator's `docs/DEPLOYMENT.md`.

## The Target Setup

| Site | Address | Built from | Worker | Who can see it |
|---|---|---|---|---|
| Live | `sslchecker.ilhs.app` | `main` | `sslchecker` | Everyone |
| Staging | `sslchecker-staging.ilhs.app` | `staging` | `sslchecker-staging` | Approved emails only (one-time code by email) |

The live Worker also answers `sslchecker.syshost.app` and 301-redirects it to sslchecker.ilhs.app, keeping the path. `tests/worker.test.js` checks the redirect.

How changes flow: branch from `staging`, open a pull request into `staging`, test on sslchecker-staging.ilhs.app, and only after the owner approves, open a pull request from `staging` into `main` to go live.

## Before You Start: Which Project Serves The Site Today

On 2026-11-26 both sslchecker.syshost.app and sslchecker.ilhs.app answered `200` with no Content-Security-Policy, so the old page is served by a project with no Worker code `[TESTED]` (response headers). Find it in Workers & Pages (search for the domain under each project's Domains). Then:

- **It is a Worker** (Workers Builds, a "Workers" badge): use it as the live Worker in Step 2. If its name is not `sslchecker`, either rename it to `sslchecker`, or change `"name"` at the top of `wrangler.jsonc` to its name in a pull request first. The name in the file and the dashboard must match, or the build creates a second Worker.
- **It is a Pages project:** create a new Worker named `sslchecker` with Step 2's settings (Import a repository), attach the domains to it, then remove them from the Pages project and delete the Pages project once the Worker answers.

## Step 1: Protect The Branches (GitHub)

The `staging` branch was created from `main` on 2026-11-26. In GitHub > sslchecker > Settings > Rules > Rulesets (or Branches), for both `main` and `staging`:

1. Require a pull request before merging.
2. Require status checks to pass: `test` (the Tests workflow).
3. Block force pushes and deletions.

If rulesets are not available on the plan, keep the flow by process and record "no branch protection" as an exception in `SITE.md`, as on the calculator.

## Step 2: The Live Worker (sslchecker)

1. Workers & Pages > `sslchecker` > Settings > Build:
   - **Git repository:** `ILikeHostingServices/sslchecker`. **Production branch:** `main`. **Build command:** empty. **Root directory:** `/`.
   - **Deploy command:** `npx wrangler deploy --env=""` (picks the live settings; `wrangler.jsonc` also defines staging).
   - **API token:** a token that can deploy this Worker only. The calculator used to share the "sslchecker build token"; if that token is still shared or all-access, replace it.
   - **Branch control:** turn off builds for non-production branches, so only `main` builds (previews off, ILHS website baseline rule 13).
2. Settings > Domains & Routes: attach `sslchecker.ilhs.app` (Custom Domain) and keep `sslchecker.syshost.app`. Turn the `workers.dev` and Preview URL toggles off (`wrangler.jsonc` sets both off, so a deploy keeps them off).
3. Settings > Variables and Secrets after the first build from `main`: `PRIMARY_HOST` = `sslchecker.ilhs.app`, `NOINDEX` empty. Do not set them by hand; builds replace them from `wrangler.jsonc`.

The live Worker only gets the new code when `staging` is merged into `main`. Until then the old page keeps serving both domains.

## Step 3: Create The Staging Worker (sslchecker-staging)

1. Workers & Pages > **Create** > **Import a repository** > `ILikeHostingServices/sslchecker`.
   - **Worker name:** `sslchecker-staging` (must match `env.staging.name` in `wrangler.jsonc`).
   - **Build command:** empty. **Deploy command:** `npx wrangler deploy --env staging`. **Root directory:** `/`.
   - **API token:** a new token for this Worker only.
2. Let the first build finish. Do not attach a domain yet.
3. **Set the branch.** The import screen has no branch field, so the first build runs from `main`, which has no `env.staging` block until the rebuild is released, and deploys the live settings (the calculator hit this on 2026-11-25). Settings > Builds: **Production branch** `staging`, and turn off builds for non-production branches. Then start a build of `staging` (merge a pull request into it, or add a Deploy Hook and POST to it). Changing the branch alone does not rebuild.
4. Confirm in Settings > Variables and Secrets: `PRIMARY_HOST` = `sslchecker-staging.ilhs.app` and `NOINDEX` = `1`.

## Step 4: Require A Login For Staging (Before The Domain)

1. Zero Trust > Settings > Authentication > Login methods: make sure **One-time PIN** is added.
2. Zero Trust > Access > Applications > **Add an application** > **Self-hosted**.
   - Name: `SSL Checker Staging`. Public hostname: `sslchecker-staging.ilhs.app`.
   - Policies: reuse the ones the `ILHS Staging` and `Calc Staging` apps use (same approved emails).
   - Login methods: One-time PIN, with **Apply instant authentication** on.
   - Session duration: 1 hour.

## Step 5: Attach The Staging Domain

1. `sslchecker-staging` > Settings > Domains & Routes > **Add** > **Custom Domain** > `sslchecker-staging.ilhs.app`.
2. From a private browser window, open https://sslchecker-staging.ilhs.app: it must redirect to a `cloudflareaccess.com` login page. If the checker loads with no login, remove the domain and fix Step 4 first.

The staging Worker also sends `X-Robots-Tag: noindex, nofollow` and a disallow-all `robots.txt`.

## Step 6: Go Live

After the owner approves staging, open a pull request from `staging` into `main` and merge it when checks pass. Then run the Quick Checks. Once sslchecker.ilhs.app passes, the IT Reference Calculator's menu link (`EXTERNAL` in its `js/app.js`) can change to `https://sslchecker.ilhs.app/` in a pull request there.

## Headers For Other Web Servers

Hosting the files elsewhere, send these (from `worker/index.js`):

```
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

## Quick Checks

From Windows (`curl.exe`), Mac, or Linux:

```
curl -sI https://sslchecker.ilhs.app
curl -sI https://sslchecker.ilhs.app/.well-known/security.txt
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://sslchecker.syshost.app/local/
curl -sI https://sslchecker-staging.ilhs.app
```

| Result | Meaning |
|---|---|
| sslchecker.ilhs.app: `200` with `content-security-policy` and `strict-transport-security` | Live Worker and its headers are working |
| sslchecker.syshost.app: `301 https://sslchecker.ilhs.app/local/` | Redirect is working (that address then redirects to `/`) |
| sslchecker-staging: `302` to `...cloudflareaccess.com/...` | Staging login is working |
| sslchecker-staging: `200` with no login | Access app missing: remove the domain and fix Step 4 now |
| `200` with no `content-security-policy` | The old project still serves the domain: see Before You Start |
| Cloudflare error 522, 523, 530, or 1016 | Hostname is not attached to a Worker |
| A pull request gets a Cloudflare "Preview URL" comment | Non-production branch builds are still on: turn them off |

## Rollback

- Workers & Pages > Worker > **Deployments** > **Rollback** on the last good version.
- To take staging offline quickly, remove its custom domain, or set its Access policy to block everyone.
- Or revert in GitHub with a pull request into `staging`, then `staging` into `main`.
