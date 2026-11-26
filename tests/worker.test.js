/* tests/worker.test.js v1.0.0 (Last Rev: 2026-11-26) */
/* Cloudflare Worker behavior (worker/index.js) with a fake ASSETS binding: the old domain 301-redirects to
   sslchecker.ilhs.app with path and query kept, /local goes to the page, the security headers are always sent,
   and staging sends noindex and a disallow-all robots.txt. */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { pathToFileURL } = require("url");

// import() needs a file:// URL; a bare path breaks on Windows (drive letter read as a URL scheme).
const load = () => import(pathToFileURL(path.join(__dirname, "..", "worker", "index.js")).href).then(m => m.default);
const ASSETS = { fetch: async req => new Response(`asset ${new URL(req.url).pathname}`, { status: 200, headers: { "Content-Type": "text/html" } }) };
const LIVE = { PRIMARY_HOST: "sslchecker.ilhs.app", NOINDEX: "", ASSETS, CF_VERSION_METADATA: { timestamp: "2026-11-26T12:00:00Z" } };
const STAGING = { PRIMARY_HOST: "sslchecker-staging.ilhs.app", NOINDEX: "1", ASSETS };

test("sslchecker.syshost.app 301-redirects to sslchecker.ilhs.app, keeping path and query", async () => {
  const worker = await load();
  for (const host of ["sslchecker.syshost.app", "www.sslchecker.syshost.app"]) {
    const res = await worker.fetch(new Request(`http://${host}/some/path?x=1`), LIVE);
    assert.equal(res.status, 301, host);
    assert.equal(res.headers.get("Location"), "https://sslchecker.ilhs.app/some/path?x=1", host);
  }
});

test("the retired /local page redirects to the page itself", async () => {
  const worker = await load();
  for (const p of ["/local", "/local/", "/local/index.html", "/local/jsrsasign.js"]) {
    const res = await worker.fetch(new Request(`https://sslchecker.ilhs.app${p}`), LIVE);
    assert.equal(res.status, 301, p);
    assert.equal(res.headers.get("Location"), "https://sslchecker.ilhs.app/", p);
  }
  const old = await worker.fetch(new Request("https://sslchecker.syshost.app/local/"), LIVE);
  assert.equal(old.headers.get("Location"), "https://sslchecker.ilhs.app/local/");
});

test("the primary host is served with locked-down security headers and Last-Modified, no noindex", async () => {
  const worker = await load();
  const res = await worker.fetch(new Request("https://sslchecker.ilhs.app/"), LIVE);
  assert.equal(res.status, 200);
  const csp = res.headers.get("Content-Security-Policy");
  assert.match(csp, /default-src 'none'.*frame-ancestors 'none'/);
  assert.match(csp, /connect-src 'self';/);
  assert.doesNotMatch(csp, /https?:|unsafe/, "the page must not load from or talk to any other host");
  assert.equal(res.headers.get("Strict-Transport-Security"), "max-age=31536000");
  assert.equal(res.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(res.headers.get("Referrer-Policy"), "no-referrer");
  assert.equal(res.headers.get("Last-Modified"), "Thu, 26 Nov 2026 12:00:00 GMT");
  assert.equal(res.headers.get("X-Robots-Tag"), null);
});

test("staging sends noindex on every response and blocks crawlers in robots.txt", async () => {
  const worker = await load();
  const page = await worker.fetch(new Request("https://sslchecker-staging.ilhs.app/"), STAGING);
  assert.equal(page.headers.get("X-Robots-Tag"), "noindex, nofollow");
  assert.ok(page.headers.get("Content-Security-Policy"));
  const robots = await worker.fetch(new Request("https://sslchecker-staging.ilhs.app/robots.txt"), STAGING);
  assert.equal(await robots.text(), "User-agent: *\nDisallow: /\n");
  const live = await worker.fetch(new Request("https://sslchecker.ilhs.app/robots.txt"), LIVE);
  assert.equal(await live.text(), "asset /robots.txt");
  // Staging only answers on its own hostname.
  const wrong = await worker.fetch(new Request("https://sslchecker.ilhs.app/"), STAGING);
  assert.equal(wrong.headers.get("Location"), "https://sslchecker-staging.ilhs.app/");
});
