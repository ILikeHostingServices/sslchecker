RUNBOOK.md v1.0.0 (Last Rev: 2026-11-26)

# Runbook

## Deploy

Cloudflare Workers Builds deploys on every push: `staging` to the `sslchecker-staging` Worker, `main` to `sslchecker`. Changes reach them only through pull requests (see `AGENTS.md`). There is no manual deploy step.

## Verify

```
curl -sI https://sslchecker.ilhs.app
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://sslchecker.syshost.app/local/
curl -sI https://sslchecker-staging.ilhs.app
```

Expect `200` with `content-security-policy` on the live site, `301 https://sslchecker.ilhs.app/local/` from the old domain, and a `302` to a `cloudflareaccess.com` login on staging. Then paste a certificate on the live site and check that a card appears.

## Rollback

Workers & Pages > Worker > Deployments > Rollback to the last good version. Or revert in GitHub with a pull request into `staging`, then `staging` into `main`.

## Failure Alerts

None. A failed Workers Build shows as a failed check on the commit in GitHub, and the Tests workflow fails the pull request.

## Logs

Workers & Pages > Worker > Logs (observability is off by default). The page itself logs nothing.

## Scheduled Work

Not Applicable: no cron triggers or scheduled jobs. Check jsrsasign for advisories when the repository is next touched.
