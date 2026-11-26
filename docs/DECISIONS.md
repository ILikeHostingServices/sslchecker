DECISIONS.md v1.0.0 (Last Rev: 2026-11-26)

# Decisions

Newest first. Each entry says what was decided and why.

## D-007 - Commit Author Identity Rewritten

2026-11-26. The three original commits on `main` carried a non-ILHS author name and email, publicly visible. The owner approved rewriting them to ILHS-Owner ("every repo needs to be ILHS-Owner") with file contents unchanged (tree hashes compared before and after), then a force push. Do not rewrite shared history again without explicit approval.

## D-006 - sslchecker.ilhs.app Is The Primary Domain

2026-11-26, owner. The site moves from sslchecker.syshost.app to sslchecker.ilhs.app. The old domain stays attached to the live Worker and 301-redirects with the path kept, so old links work.

## D-005 - One Self-Hosted Page, No CDN

2026-11-26. Version 1 had a CDN build at `/` and a vendored build at `/local`. Loading the parser from cdnjs meant a third-party request on a page that promises nothing leaves the browser, and the two copies had to be kept in step. Now there is one page with jsrsasign served from this site, so the CSP can allow `'self'` only and the page works offline from a clone. `/local` redirects to `/`.

## D-004 - jsrsasign Kept, Updated To 11.1.5

2026-11-26. Writing a certificate parser here would be more code to get wrong than a widely used library. 10.9.0 had 7 published advisories (fixed in 11.1.1), including a signature verification bypass, which matters because the page now checks which certificate signed which. Updated to the latest release, 11.1.5 (no known advisories on 2026-11-26).

## D-003 - Text Only, Never HTML

2026-11-26. Version 1 inserted certificate fields into `innerHTML`, so a crafted certificate could run script. Certificate data is attacker-chosen, so the page builds every element with `textContent`; a test enforces it, and the CSP blocks inline script as a second layer.

## D-002 - Staging First Releases And The Standard File Set

2026-11-26. Same flow and files as the IT Reference Calculator: branch from `staging`, pull request into `staging`, owner test on sslchecker-staging.ilhs.app behind Cloudflare Access, then `staging` into `main`. The standard repository documents keep agents and people from re-deriving context.

## D-001 - MIT License

2026-11-26. The version 1 README asked for a license and named MIT as the intended choice, and ILHS publishes its tools under MIT. `[ASSUMED]` the owner wants the same here, as with the IT Reference Calculator.
