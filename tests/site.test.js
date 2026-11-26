/* tests/site.test.js v1.0.0 (Last Rev: 2026-11-26) */
/* Site integrity: brand sizing block, files the page loads, no third-party hosts, no inline code, no HTML
   injection sinks, and the no-dash writing rule. */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
// Line endings normalized: a Windows checkout (core.autocrlf) may have CRLF in some files and LF in others.
const read = f => fs.readFileSync(path.join(root, f), "utf8").replace(/\r\n/g, "\n");
const html = read("index.html");

test("style.css carries the pinned ILHS Shared Sizing Spec block unchanged", () => {
  const pinned = read("docs/shared/ilhs-sizing-tokens.css");
  const start = pinned.indexOf("/* ILHS Shared Sizing Spec v"), endMark = pinned.indexOf(" end */", start);
  const block = pinned.slice(start, endMark + " end */".length);
  assert.ok(block.length > 200);
  assert.ok(read("css/style.css").includes(block), "css/style.css differs from docs/shared/ilhs-sizing-tokens.css");
});

test("every file the page loads exists, and none comes from another host", () => {
  const refs = [...html.matchAll(/<(?:script|link|img)[^>]+(?:src|href)="([^"]+)"/g)].map(m => m[1])
    .filter(r => !r.startsWith("https://sslchecker.ilhs.app/") && !r.startsWith("https://ilhs.app/"));
  assert.ok(refs.length >= 7);
  refs.forEach(ref => {
    assert.doesNotMatch(ref, /^(https?:)?\/\//, `${ref} loads from another host`);
    assert.ok(fs.existsSync(path.join(root, ref)), `${ref} is referenced but missing`);
  });
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(scripts, ["js/vendor/jsrsasign-all-min.js", "js/version.js", "js/checker.js", "js/app.js"]);
});

test("no inline styles or scripts (the Content-Security-Policy blocks them)", () => {
  assert.doesNotMatch(html, /\sstyle="/);
  assert.doesNotMatch(html, /<script(?![^>]*src=)[^>]*>/);
  assert.doesNotMatch(html, /\son[a-z]+="/);
});

test("page scripts never write HTML (certificate fields are attacker-chosen)", () => {
  ["js/app.js", "js/checker.js"].forEach(f => {
    assert.doesNotMatch(read(f), /\.innerHTML|\.outerHTML|insertAdjacentHTML|document\.write/, f);
  });
});

test("the paste box is kept out of spell check and autofill services", () => {
  const box = html.match(/<textarea[^>]*>/)[0];
  ["spellcheck=\"false\"", "autocomplete=\"off\"", "autocorrect=\"off\"", "data-gramm=\"false\""].forEach(a => assert.ok(box.includes(a), a));
});

test("element ids are unique", () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(ids.filter((id, i) => ids.indexOf(id) !== i), []);
});

test("no em or en dashes in project files we write", () => {
  const files = ["index.html", "css/style.css", "favicon.svg", "wrangler.jsonc", "worker/index.js", "robots.txt",
    ...fs.readdirSync(root).filter(f => f.endsWith(".md")),
    ...fs.readdirSync(path.join(root, "docs")).filter(f => f.endsWith(".md")).map(f => `docs/${f}`),
    ...fs.readdirSync(path.join(root, "js")).filter(f => f.endsWith(".js")).map(f => `js/${f}`),
    ...fs.readdirSync(path.join(root, "tests")).filter(f => f.endsWith(".js")).map(f => `tests/${f}`)];
  files.forEach(f => assert.doesNotMatch(read(f), /[\u2010-\u2015]/, `${f} contains a dash variant`));
});
